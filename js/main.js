'use strict';

document.addEventListener('DOMContentLoaded', function () {
    initScrollChartBackground();
    initScrollTopButton();
});

/**
 * 스크롤 진행도(0~1)에 따라 꺾은선이 왼쪽 하단에서 오른쪽 상단으로 그려지고,
 * 스크롤 끝에서 곡선의 끝점이 우상단에 맞춰지도록 한다.
 */
function initScrollChartBackground() {
    var path = document.getElementById('chartTrendPath');
    var dot = document.getElementById('chartHeadDot');
    var svg = document.querySelector('.scroll-chart-svg');
    if (!path || !svg) {
        return;
    }

    var pathLength = path.getTotalLength();
    path.style.strokeDasharray = String(pathLength);
    path.style.strokeDashoffset = String(pathLength);

    var ticking = false;

    function scrollProgress() {
        var doc = document.documentElement;
        var maxScroll = doc.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) {
            return 1;
        }
        var y = window.scrollY || doc.scrollTop;
        var p = y / maxScroll;
        if (p < 0) {
            p = 0;
        }
        if (p > 1) {
            p = 1;
        }
        return p;
    }

    function update() {
        ticking = false;
        var p = scrollProgress();
        path.style.strokeDashoffset = String(pathLength * (1 - p));

        if (dot) {
            var dist = pathLength * p;
            if (dist < 0.5) {
                dot.setAttribute('opacity', '0');
            } else {
                var pt = path.getPointAtLength(dist);
                dot.setAttribute('cx', String(pt.x));
                dot.setAttribute('cy', String(pt.y));
                dot.setAttribute('opacity', String(0.35 + 0.65 * p));
            }
        }

        /* 미세 패럴럭스: 스크롤할수록 그래프가 살짝 위로 (상승 느낌) */
        var lift = p * 2.5;
        svg.style.transform = 'translate3d(0, ' + (-lift).toFixed(2) + 'vh, 0)';
    }

    function onScrollOrResize() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    update();
}

/** 스크롤이 일정 이상이면 오른쪽 하단 맨 위로 버튼 표시 */
function initScrollTopButton() {
    var btn = document.getElementById('scrollTopBtn');
    if (!btn) {
        return;
    }

    var showThresholdPx = 160;
    var rafId = 0;

    function getThreshold() {
        return Math.max(showThresholdPx, Math.round(window.innerHeight * 0.12));
    }

    function syncVisibility() {
        rafId = 0;
        var y = window.scrollY || document.documentElement.scrollTop;
        if (y > getThreshold()) {
            btn.classList.add('is-visible');
        } else {
            btn.classList.remove('is-visible');
        }
    }

    function onScrollOrResize() {
        if (!rafId) {
            rafId = requestAnimationFrame(syncVisibility);
        }
    }

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    syncVisibility();
}
