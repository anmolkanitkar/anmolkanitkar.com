#!/usr/bin/env python3
"""Render the projects grid into public/index.html from content/projects.json.

Two jobs, in order:

1. Refresh repository stats (stars, primary language, last commit date) from the
   GitHub API for every project that names a public ``repo``.
2. Render every project as a card and splice the result into ``index.html``
   between the ``projects:start`` / ``projects:end`` markers.

Design notes worth knowing before you change anything here:

* **Standard library only.** No pip install, no lockfile, no dependency that can
  rot. ``urllib`` is clumsier than ``requests`` but it is always present, on this
  machine and on a GitHub Actions runner.
* **Only the marked region of index.html is touched.** Everything outside the
  markers stays hand-editable, so the generator and a human editing the page do
  not fight over the same file.
* **A network failure keeps the previous stats.** Wiping good data because
  GitHub was briefly unreachable would be worse than showing a number that is a
  week stale, so fetch errors warn and move on.
* **Idempotent.** Running it twice in a row produces no second diff. That is what
  lets the CI workflow use "did anything change?" as its commit condition.

Usage::

    python3 scripts/build_projects.py              # fetch stats, then render
    python3 scripts/build_projects.py --no-fetch   # render only, no network

Set ``GITHUB_TOKEN`` to raise the API rate limit from 60 requests/hour
(unauthenticated) to 5000. CI passes the workflow's built-in token.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime
from html import escape
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PROJECTS_JSON = REPO_ROOT / "content" / "projects.json"
INDEX_HTML = REPO_ROOT / "public" / "index.html"

START_MARKER = "<!-- projects:start -->"
END_MARKER = "<!-- projects:end -->"

API = "https://api.github.com"
TIMEOUT = 15
# Indentation of the marker lines in index.html, so generated markup lines up
# with the handwritten markup around it.
INDENT = " " * 6


# --------------------------------------------------------------------------- #
# GitHub API
# --------------------------------------------------------------------------- #
def _get_json(url: str) -> object | None:
    """GET a URL and parse JSON, or return None and warn on any failure."""
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        # GitHub rejects requests with no User-Agent.
        "User-Agent": "anmolkanitkar.com-build-script",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        request = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # 404 on a repo that exists almost always means it is private, not gone.
        hint = " (private repo, or the token cannot see it?)" if exc.code == 404 else ""
        warn(f"{url} → HTTP {exc.code}{hint}")
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        warn(f"{url} → {exc}")
    return None


def fetch_stats(repo: str) -> dict | None:
    """Return {stars, language, lastCommit} for ``owner/name``, or None."""
    meta = _get_json(f"{API}/repos/{repo}")
    if not isinstance(meta, dict):
        return None

    last_commit = None
    commits = _get_json(f"{API}/repos/{repo}/commits?per_page=1")
    if isinstance(commits, list) and commits:
        last_commit = (
            commits[0].get("commit", {}).get("committer", {}).get("date")
        )

    return {
        "stars": meta.get("stargazers_count"),
        "language": meta.get("language"),
        "lastCommit": last_commit,
    }


# --------------------------------------------------------------------------- #
# Rendering
# --------------------------------------------------------------------------- #
def format_commit_date(iso: str | None) -> str | None:
    """'2026-08-08T07:33:32Z' → 'Updated Aug 2026'."""
    if not iso:
        return None
    try:
        when = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None
    return f"Updated {when:%b %Y}"


def render_card(project: dict) -> str:
    """One <li class="card">. Every interpolated value is HTML-escaped.

    Escaping matters even though you write this content yourself: an ampersand
    or angle bracket in a blurb would otherwise produce invalid markup, and
    getting into the habit at the boundary is how you avoid the injection bug
    later, when the content is not yours.
    """
    lines = [f'{INDENT}  <li class="card">']

    lines.append(f'{INDENT}    <div class="card__head">')
    lines.append(
        f'{INDENT}      <h3 class="card__title">{escape(project["title"])}</h3>'
    )
    lines.append(f"{INDENT}    </div>")

    if project.get("blurb"):
        lines.append(
            f'{INDENT}    <p class="card__blurb">{escape(project["blurb"])}</p>'
        )

    if project.get("learned"):
        lines.append(f'{INDENT}    <div class="card__learned">')
        lines.append(f"{INDENT}      <strong>What I learned</strong>")
        lines.append(f'{INDENT}      {escape(project["learned"])}')
        lines.append(f"{INDENT}    </div>")

    tags = project.get("tags") or []
    if tags:
        lines.append(f'{INDENT}    <ul class="tags">')
        for tag in tags:
            lines.append(f'{INDENT}      <li class="tag">{escape(tag)}</li>')
        lines.append(f"{INDENT}    </ul>")

    # Footer: links on the left, auto-refreshed stats pushed to the right.
    links = project.get("links") or {}
    stats = project.get("stats") or {}

    stat_parts = []
    if stats.get("language"):
        stat_parts.append(escape(str(stats["language"])))
    if stats.get("stars"):  # hide a zero — it reads worse than showing nothing
        stat_parts.append(f'&#9733; {escape(str(stats["stars"]))}')
    updated = format_commit_date(stats.get("lastCommit"))
    if updated:
        stat_parts.append(escape(updated))

    if links.get("live") or links.get("source") or stat_parts:
        lines.append(f'{INDENT}    <div class="card__foot">')
        if links.get("live"):
            lines.append(
                f'{INDENT}      <a class="card__link" href="{escape(links["live"], quote=True)}"'
                f' rel="noopener">Visit site</a>'
            )
        if links.get("source"):
            lines.append(
                f'{INDENT}      <a class="card__link" href="{escape(links["source"], quote=True)}"'
                f' rel="noopener">Source</a>'
            )
        if stat_parts:
            lines.append(f'{INDENT}      <div class="card__stats">')
            for part in stat_parts:
                lines.append(f"{INDENT}        <span>{part}</span>")
            lines.append(f"{INDENT}      </div>")
        lines.append(f"{INDENT}    </div>")

    lines.append(f"{INDENT}  </li>")
    return "\n".join(lines)


def render_grid(projects: list[dict]) -> str:
    if not projects:
        return f'{INDENT}  <p class="section__note">No projects listed yet.</p>'
    cards = "\n".join(render_card(project) for project in projects)
    return f'{INDENT}  <ul class="cards">\n{cards}\n{INDENT}  </ul>'


def splice(html: str, block: str) -> str:
    """Replace the content between the markers, leaving the markers in place."""
    start = html.find(START_MARKER)
    end = html.find(END_MARKER)
    if start == -1 or end == -1:
        die(
            f"Could not find {START_MARKER} / {END_MARKER} in {INDEX_HTML}. "
            "The generator writes only between those markers — put them back."
        )
    if end < start:
        die("projects:end appears before projects:start in index.html.")

    head = html[: start + len(START_MARKER)]
    tail = html[end:]
    return f"{head}\n{block}\n{INDENT}{tail}"


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def warn(message: str) -> None:
    print(f"warning: {message}", file=sys.stderr)


def die(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def write_if_changed(path: Path, content: str) -> bool:
    """Write only when the content differs. Returns True if the file changed.

    This is what makes the whole thing idempotent, and it is why the CI workflow
    can use 'git diff --quiet' to decide whether a commit is warranted.
    """
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return False
    path.write_text(content, encoding="utf-8")
    return True


# --------------------------------------------------------------------------- #
def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--no-fetch",
        action="store_true",
        help="skip the GitHub API and render from the stats already on disk",
    )
    args = parser.parse_args()

    if not PROJECTS_JSON.exists():
        die(f"{PROJECTS_JSON} not found")

    data = json.loads(PROJECTS_JSON.read_text(encoding="utf-8"))
    projects = data.get("projects")
    if not isinstance(projects, list):
        die("content/projects.json must contain a 'projects' array")

    if not args.no_fetch:
        for project in projects:
            repo = project.get("repo")
            if not repo:
                # No public repo for this project — nothing to fetch, and that is
                # a normal state, not an error.
                print(f"  {project['slug']}: no repo, skipping stats")
                continue

            fresh = fetch_stats(repo)
            if fresh is None:
                warn(f"{project['slug']}: keeping previous stats for {repo}")
                continue

            project["stats"] = fresh
            print(
                f"  {project['slug']}: {repo} → "
                f"{fresh['stars']} stars, {fresh['language']}, {fresh['lastCommit']}"
            )

    json_changed = write_if_changed(
        PROJECTS_JSON,
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
    )

    html_changed = write_if_changed(
        INDEX_HTML,
        splice(INDEX_HTML.read_text(encoding="utf-8"), render_grid(projects)),
    )

    changed = [
        name
        for name, did in (("projects.json", json_changed), ("index.html", html_changed))
        if did
    ]
    print(f"{', '.join(changed)} updated" if changed else "no changes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
