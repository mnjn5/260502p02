'use strict';

function boot() {
    initAos();
    initScrollChartBackground();
    initScrollTopButton();
    initRevealSectionBackground();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}

window.addEventListener('load', function () {
    if (typeof AOS !== 'undefined' && typeof AOS.refresh === 'function') {
        AOS.refresh();
    }
});

function initAos() {
    if (typeof AOS === 'undefined') {
        return;
    }
    var reduced = false;
    try {
        reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e1) {
        reduced = false;
    }
    AOS.init({
        duration: 700,
        easing: 'ease-out-cubic',
        /* false: 뷰포트 밖으로 나가면 aos-animate 제거 → zoom-in 등 초기(작은) 상태로 복귀 */
        once: false,
        offset: 120,
        disable: reduced,
    });
    if (document.readyState === 'complete') {
        AOS.refresh();
    }
}

/**
 * 스크롤 진행도에 따라 꺾은선이 왼쪽 하단에서 오른쪽 상단으로 그려진다.
 * 원시 진행도 0~1은 시각 진행도 약 0.05~1로 매핑해, 페이지 최상단에서도 약간 그려진 상태로 시작한다.
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

    var progressMin = 0.05;

    function update() {
        ticking = false;
        var raw = scrollProgress();
        var p = progressMin + raw * (1 - progressMin);
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

/**
 * 섹션 상단이 뷰포트 하단(100% 지점)에 있을 때 진행 0,
 * 그 상태에서 문서를 한 뷰포트 높이(100vh)만큼 더 스크롤하면 진행 1 → 배경 완전 검정.
 * (--reveal: 0~1, CSS에서 검은 레이어 opacity·글자색 보간)
 */
function initRevealSectionBackground() {
    var el = document.getElementById('revealColdnessSection');
    if (!el) {
        return;
    }

    var ticking = false;

    function updateReveal() {
        ticking = false;
        var vh = window.innerHeight;
        if (vh <= 0) {
            return;
        }
        var rect = el.getBoundingClientRect();
        var t = (vh - rect.top) / vh;
        if (t < 0) {
            t = 0;
        }
        if (t > 1) {
            t = 1;
        }
        el.style.setProperty('--reveal', String(t));
    }

    function onScrollOrResize() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateReveal);
        }
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    updateReveal();
}
