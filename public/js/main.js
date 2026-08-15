/* anmolkanitkar.com — the only script on the page.
 *
 * Everything here is progressive enhancement: with JavaScript disabled the page
 * is fully readable and every link works. Nothing below is load-bearing.
 */
(function () {
    'use strict';

    /* Footer year. The HTML ships a hardcoded fallback so a no-JS visitor still
     * sees a sensible year rather than an empty span. */
    var year = document.getElementById('year');
    if (year) {
        year.textContent = String(new Date().getFullYear());
    }

    /* Draw a divider under the sticky header once the page has scrolled.
     *
     * IntersectionObserver rather than a scroll listener: a scroll handler fires
     * on every frame of a scroll and has to be throttled by hand, whereas this
     * fires twice — once crossing in, once crossing out. A 1px sentinel at the
     * top of the document is the standard trick for "has the user scrolled".
     */
    var nav = document.getElementById('nav');
    if (!nav || !('IntersectionObserver' in window)) {
        return;
    }

    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;height:1px;width:1px;pointer-events:none;';
    document.body.prepend(sentinel);

    new IntersectionObserver(function (entries) {
        nav.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
}());
