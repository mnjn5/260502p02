'use strict';

/**
 * #investCtaSection — 블록 노출 진행도(pGlobal)로 줄마다 순차 sin 파형 (scale·opacity).
 *
 * 재검토 보강:
 * - getBoundingClientRect().height만 쓰면 레이아웃 전/폰트 로딩 시 0에 가까워 pGlobal이 비정상일 수 있음
 *   → blockH = max(offsetHeight, clientHeight, rect.height, 1)
 * - 스크롤은 window뿐 아니라 document(capture)·visualViewport(모바일 주소창)에도 구독
 * - 첫 페인트 직후 한 번 더 rAF로 update (레이아웃 안정화)
 * - 루트 높이 변할 때 ResizeObserver로 update
 */
(function () {
    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function clamp(n, a, b) {
        return Math.max(a, Math.min(b, n));
    }

    function initInvestCtaScrollScale() {
        var root = document.getElementById('investCtaSection');
        if (!root) {
            return;
        }

        var lines = root.querySelectorAll('.invest-cta__line');
        var n = lines.length;
        if (!n) {
            return;
        }

        if (prefersReducedMotion()) {
            lines.forEach(function (el) {
                el.style.transform = 'scale(1)';
                el.style.opacity = '1';
                el.style.willChange = 'auto';
            });
            return;
        }

        var minScale = 0.55;
        var maxScale = 2;
        var minOpacity = 0.2;
        var maxOpacity = 1;
        var rafId = 0;

        function measureBlockHeight() {
            var rect = root.getBoundingClientRect();
            return Math.max(
                1,
                root.offsetHeight || 0,
                root.clientHeight || 0,
                rect.height || 0
            );
        }

        function update() {
            rafId = 0;
            var viewH = window.innerHeight;
            if (viewH <= 0) {
                return;
            }

            var rootRect = root.getBoundingClientRect();
            var blockH = measureBlockHeight();
            var denom = viewH + blockH;
            if (denom < 1) {
                denom = 1;
            }

            /* 아래에만 있음 → 시작 전 / 위로 완전히 나감 → 끝(모두 작음) / 그 사이는 스크롤 비율 */
            var pGlobal;
            if (rootRect.top >= viewH) {
                pGlobal = 0;
            } else if (rootRect.bottom <= 0) {
                pGlobal = 1;
            } else {
                pGlobal = (viewH - rootRect.top) / denom;
                pGlobal = clamp(pGlobal, 0, 1);
            }

            for (var i = 0; i < n; i++) {
                var el = lines[i];
                var slotP = (pGlobal - i / n) * n;
                slotP = clamp(slotP, 0, 1);
                var wave = Math.sin(Math.PI * slotP);

                var scale = minScale + (maxScale - minScale) * wave;
                var opacity = minOpacity + (maxOpacity - minOpacity) * wave;

                el.style.transformOrigin = 'center center';
                el.style.transform = 'scale(' + scale.toFixed(4) + ')';
                el.style.opacity = String(opacity.toFixed(3));
            }
        }

        function scheduleUpdate() {
            if (!rafId) {
                rafId = requestAnimationFrame(update);
            }
        }

        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        document.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });

        if (window.visualViewport) {
            window.visualViewport.addEventListener('scroll', scheduleUpdate, { passive: true });
            window.visualViewport.addEventListener('resize', scheduleUpdate, { passive: true });
        }

        window.addEventListener('resize', scheduleUpdate, { passive: true });

        if (typeof ResizeObserver !== 'undefined') {
            var ro = new ResizeObserver(scheduleUpdate);
            ro.observe(root);
        }

        update();
        requestAnimationFrame(function () {
            requestAnimationFrame(update);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInvestCtaScrollScale);
    } else {
        initInvestCtaScrollScale();
    }
})();
