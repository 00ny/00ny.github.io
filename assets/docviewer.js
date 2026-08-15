/* 문서 보기 — 선택 캐러셀(.docsel) + 세로 스크롤 뷰어(.dv). 프로젝트 상세 공용.
   ★ 페이지 데이터는 기존 갤러리 섹션(.gal)에서 읽고, 읽은 뒤 그 섹션을 DOM 에서 들어낸다.
     스크립트가 없거나 실패하면 갤러리가 그대로 남아 그것이 폴백이다 — 갤러리를 HTML 에서 지우지 말 것.
   ★ 인라인 인용(.ifig)과 기존 라이트박스는 페이지의 인라인 스크립트가 파싱 시점에 참조를 잡아 둔다.
     여기서 섹션을 들어내도 그 참조는 살아 있다(순서 의존 — 이 파일은 반드시 defer).
   ★ 지연 로딩·현재 장 추적은 IntersectionObserver 가 아니라 스크롤 좌표 계산이다. 바꾸지 말 것. */
(function () {
  'use strict';

  var sel = document.querySelector('.docsel');
  if (!sel) return;
  var cards = Array.prototype.slice.call(sel.querySelectorAll('.docsel__c'));
  if (!cards.length) return;

  var SMOOTH = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NEAR = 900;   /* 본문: 화면 위아래로 이만큼까지 미리 받는다 */
  var NEART = 200;  /* 썸네일 */

  /* ---------- 1. 갤러리에서 데이터 수집 → 갤러리 제거 ---------- */
  var docs = [];
  cards.forEach(function (card) {
    var gal = document.getElementById(card.getAttribute('data-gal') || '');
    if (!gal) return;
    var pages = Array.prototype.slice.call(gal.querySelectorAll('figure')).map(function (f) {
      var im = f.querySelector('img');
      return { src: im ? im.getAttribute('src') : '', alt: (im && im.getAttribute('alt')) || '',
               cap: f.getAttribute('data-cap') || '', key: f.getAttribute('data-page') || '' };
    }).filter(function (p) { return p.src; });
    if (!pages.length) return;
    docs.push({
      card: card,
      title: card.getAttribute('data-title') || '',
      short: card.getAttribute('data-short') || card.getAttribute('data-title') || '',
      pages: pages,
      sec: gal.closest('section') || gal,
      built: false, seen: false, active: -1
    });
  });
  if (!docs.length) return;
  docs.forEach(function (d) { if (d.sec && d.sec.parentNode) d.sec.parentNode.removeChild(d.sec); });

  /* ---------- 2. 뷰어 골격 ---------- */
  var dv = document.createElement('div');
  dv.className = 'dv';
  dv.setAttribute('role', 'dialog');
  dv.setAttribute('aria-modal', 'true');
  dv.setAttribute('aria-label', '문서 전체 보기');
  dv.innerHTML =
    '<div class="dv__bar">' +
      '<span class="dv__title"></span><span class="dv__count"></span>' +
      '<span class="dv__swap"></span>' +
      '<button type="button" class="dv__x" aria-label="닫기">&times;</button>' +
    '</div><div class="dv__body"></div>';
  document.body.appendChild(dv);

  var barTitle = dv.querySelector('.dv__title'),
      barCount = dv.querySelector('.dv__count'),
      barSwap = dv.querySelector('.dv__swap'),
      body = dv.querySelector('.dv__body');

  docs.forEach(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = d.short;
    b.addEventListener('click', function () { showDoc(i); });
    barSwap.appendChild(b);
    d.swapBtn = b;

    var wrap = document.createElement('div');
    wrap.className = 'dv__doc';
    wrap.innerHTML = '<nav class="dv__side" aria-label="' + d.short + ' 페이지 선택"></nav><div class="dv__scroll"></div>';
    body.appendChild(wrap);
    d.wrap = wrap;
    d.side = wrap.querySelector('.dv__side');
    d.scroll = wrap.querySelector('.dv__scroll');
  });

  /* 페이지 비율은 첫 장이 실제로 그려질 때 확정한다(기본값은 A4 가로) */
  var arDone = false;
  function noteRatio(im) {
    if (arDone || !im.naturalWidth) return;
    arDone = true;
    dv.style.setProperty('--dv-ar', im.naturalWidth + '/' + im.naturalHeight);
  }

  function build(d) {
    if (d.built) return;
    d.built = true;
    d.pgEls = []; d.thEls = []; d.pgImgs = []; d.thImgs = [];

    d.pages.forEach(function (p, i) {
      var fig = document.createElement('div');
      fig.className = 'dv__pg';
      var im = document.createElement('img');
      im.dataset.src = p.src;
      im.alt = p.alt;
      im.addEventListener('load', function () { noteRatio(im); }, { once: true });
      fig.appendChild(im);
      var n = document.createElement('span');
      n.className = 'dv__pgn';
      n.textContent = (i + 1) + ' / ' + d.pages.length;
      fig.appendChild(n);
      d.scroll.appendChild(fig);
      d.pgEls.push(fig); d.pgImgs.push(im);

      var th = document.createElement('button');
      th.type = 'button';
      th.className = 'dv__th';
      th.setAttribute('aria-label', p.cap || (i + 1) + '페이지');
      var ti = document.createElement('img');
      ti.dataset.src = p.src; ti.alt = '';
      th.appendChild(ti);
      var tb = document.createElement('b');
      tb.textContent = i + 1;
      th.appendChild(tb);
      th.addEventListener('click', function () { goPage(d, i); });
      d.side.appendChild(th);
      d.thEls.push(th); d.thImgs.push(ti);
    });

    var end = document.createElement('p');
    end.className = 'dv__end';
    end.textContent = '— ' + d.title + ' 끝 (' + d.pages.length + '페이지) —';
    d.scroll.appendChild(end);

    d.scroll.addEventListener('scroll', function () { queue(d); }, { passive: true });
    d.side.addEventListener('scroll', function () { queue(d); }, { passive: true });
  }

  /* rAF 가 아니라 타이머다 — 프레임을 안 그리는 환경(검증 도구·백그라운드 탭)에서도 돈다 */
  var pending = 0;
  function queue(d) {
    if (pending) return;
    pending = setTimeout(function () { pending = 0; sync(d); }, 60);
  }

  function load(im) {
    if (im && im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; }
  }

  /* 지금 보고 있는 장 + 받아야 할 이미지 — 전부 스크롤 좌표로 계산한다 */
  function sync(d) {
    if (!d.built || !d.pgEls.length) return;
    var sc = d.scroll, top = sc.scrollTop, h = sc.clientHeight, base = d.pgEls[0].offsetTop;
    var mid = top + h * 0.45, act = 0, i;
    for (i = 0; i < d.pgEls.length; i++) {
      var y = d.pgEls[i].offsetTop - base, hh = d.pgEls[i].offsetHeight;
      if (y <= mid) act = i;
      if (y < top + h + NEAR && y + hh > top - NEAR) load(d.pgImgs[i]);
    }
    setActive(d, act);

    var sd = d.side, hor = sd.scrollWidth > sd.clientWidth + 4;
    var st = hor ? sd.scrollLeft : sd.scrollTop, sh = hor ? sd.clientWidth : sd.clientHeight;
    for (i = 0; i < d.thEls.length; i++) {
      var t = d.thEls[i],
          ty = (hor ? t.offsetLeft : t.offsetTop) - (hor ? d.thEls[0].offsetLeft : d.thEls[0].offsetTop),
          tl = hor ? t.offsetWidth : t.offsetHeight;
      if (ty < st + sh + NEART && ty + tl > st - NEART) load(d.thImgs[i]);
    }
  }

  function setActive(d, i) {
    if (i < 0 || d.active === i) return;
    d.active = i;
    d.thEls.forEach(function (t, k) { t.classList.toggle('is-on', k === i); });
    var th = d.thEls[i];
    if (th) {
      if (d.side.scrollWidth > d.side.clientWidth + 4) {
        d.side.scrollLeft = th.offsetLeft - d.side.clientWidth / 2 + th.offsetWidth / 2;
      } else {
        d.side.scrollTop = th.offsetTop - d.side.clientHeight / 2 + th.offsetHeight / 2;
      }
    }
    if (cur === d) syncBar();
  }

  function goPage(d, i) {
    var pg = d.pgEls[i];
    if (!pg) return;
    d.scroll.scrollTop = Math.max(0, pg.offsetTop - d.pgEls[0].offsetTop - (i ? 14 : 0));
    setActive(d, i);
    sync(d);
  }

  function syncBar() {
    if (!cur) return;
    barTitle.textContent = cur.title;
    barCount.textContent = (Math.max(cur.active, 0) + 1) + ' / ' + cur.pages.length;
  }

  /* ---------- 3. 열기 · 닫기 · 문서 전환 ---------- */
  var cur = null, opener = null, lockY = 0;

  function showDoc(i) {
    var d = docs[i];
    build(d);
    docs.forEach(function (x) {
      x.wrap.classList.toggle('is-on', x === d);
      x.swapBtn.setAttribute('aria-pressed', x === d ? 'true' : 'false');
    });
    cur = d;
    select(i, false);
    if (!d.seen) { d.seen = true; goPage(d, 0); }
    syncBar();
    sync(d);
  }

  function open(i) {
    opener = document.activeElement;
    lockY = window.pageYOffset;
    dv.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    showDoc(i);
    dv.querySelector('.dv__x').focus();
  }

  function close() {
    dv.classList.remove('is-open');
    document.body.style.overflow = '';
    window.scrollTo(0, lockY);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  dv.querySelector('.dv__x').addEventListener('click', close);
  dv.addEventListener('click', function (e) {
    if (e.target === body || (cur && (e.target === cur.scroll || e.target === cur.wrap))) close();
  });
  window.addEventListener('resize', function () { if (cur && dv.classList.contains('is-open')) queue(cur); });

  document.addEventListener('keydown', function (e) {
    if (!dv.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { trap(e); return; }
    if (!cur) return;
    var sc = cur.scroll, step = sc.clientHeight * 0.9;
    if (e.key === 'ArrowDown') sc.scrollTop += 120;
    else if (e.key === 'ArrowUp') sc.scrollTop -= 120;
    else if (e.key === 'PageDown') sc.scrollTop += step;
    else if (e.key === 'PageUp') sc.scrollTop -= step;
    else if (e.key === 'Home') goPage(cur, 0);
    else if (e.key === 'End') goPage(cur, cur.pages.length - 1);
    else return;
    e.preventDefault();
    queue(cur);
  });

  function trap(e) {
    var f = Array.prototype.filter.call(
      dv.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (!dv.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- 4. 선택 캐러셀 ---------- */
  var picked = 0;
  var go = sel.parentNode.querySelector('.docsel__go');

  function select(i, lit) {
    picked = i;
    docs.forEach(function (d, k) {
      var on = k === i;
      d.card.setAttribute('aria-current', on ? 'true' : 'false');
      var cue = d.card.querySelector('.docsel__cue');
      if (cue) cue.textContent = on ? '한 번 더 누르면 펼쳐집니다' : '';
    });
    if (lit && SMOOTH) {
      var c = docs[i].card;
      c.classList.remove('is-lit');
      void c.offsetWidth;
      c.classList.add('is-lit');
    }
    if (go) go.innerHTML = '<b>' + docs[i].title + '</b> 펼쳐 보기 →';
  }

  docs.forEach(function (d, i) {
    var hit = d.card.querySelector('.docsel__hit');
    if (!hit) return;
    hit.addEventListener('click', function (e) {
      e.preventDefault();
      if (picked !== i) select(i, true); else open(i);
    });
  });
  sel.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var n = (picked + (e.key === 'ArrowRight' ? 1 : docs.length - 1)) % docs.length;
    select(n, true);
    var hit = docs[n].card.querySelector('.docsel__hit');
    if (hit) hit.focus();
    e.preventDefault();
  });
  if (go) go.addEventListener('click', function (e) { e.preventDefault(); open(picked); });

  /* ---------- 5. 본문 인용(.ifig) → 그 장을 뷰어에서 ----------
     data-from 이 갤러리 figure 의 data-page 와 같은 키다.
     ★ 캡처 단계에서 전파를 끊는다 — 페이지 인라인 스크립트가 .ifig 에 걸어 둔
       라이트박스 핸들러를 여기서 막아야 뷰어와 둘 다 열리지 않는다.
       이 파일이 없거나 실패하면 그 라이트박스가 폴백으로 남는다. */
  var byKey = {};
  docs.forEach(function (d, di) {
    d.pages.forEach(function (p, pi) { if (p.key && !(p.key in byKey)) byKey[p.key] = [di, pi]; });
  });
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var fig = t.closest('.ifig[data-from]');
    if (!fig || dv.contains(fig)) return;
    var at = byKey[fig.getAttribute('data-from')];
    if (!at) return;
    e.preventDefault();
    e.stopPropagation();
    open(at[0]);
    /* .dv__scroll 은 scroll-behavior:smooth 다 — 그대로 두면 1p 부터 훑고 내려간다.
       인용에서 온 진입은 그 장이 바로 보여야 하므로 이 한 번만 즉시 이동. */
    var d = docs[at[0]], prev = d.scroll.style.scrollBehavior;
    d.scroll.style.scrollBehavior = 'auto';
    goPage(d, at[1]);
    d.scroll.style.scrollBehavior = prev;
  }, true);

  select(0, false);
})();
