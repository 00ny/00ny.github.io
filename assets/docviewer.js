/* 문서 보기 — 선택 캐러셀(.docsel) + 세로 스크롤 뷰어(.dv). 프로젝트 상세 공용.
   ★ 페이지 데이터는 기존 갤러리 섹션(.gal)에서 읽고, 읽은 뒤 그 섹션을 DOM 에서 들어낸다.
     스크립트가 없거나 실패하면 갤러리가 그대로 남아 그것이 폴백이다 — 갤러리를 HTML 에서 지우지 말 것.
   ★ 인라인 인용(.ifig)과 기존 라이트박스는 페이지의 인라인 스크립트가 파싱 시점에 참조를 잡아 둔다.
     여기서 섹션을 들어내도 그 참조는 살아 있다(순서 의존 — 이 파일은 반드시 defer).
   ★ 지연 로딩·현재 장 추적은 IntersectionObserver 가 아니라 스크롤 좌표 계산이다. 바꾸지 말 것.
   ★ 썸네일 목록은 <nav> 로 만들지 말 것 — style.css 의 `body:has(.site-bar) nav:not(.proj-nav)`
     교대 규칙이 그것까지 잡아 position:fixed + visibility:hidden 으로 화면에서 지운다. */
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
    /* 갤러리 한 장의 마크업이 페이지마다 다르다(figure / .gi / .g). 자식 하나 = 한 장으로 읽는다.
       src 는 속성으로 읽는다 — 인라인 스크립트가 배열에서 채워 넣는 페이지도 속성에 반영된다. */
    var pages = Array.prototype.slice.call(gal.children).map(function (f) {
      var im = f.querySelector ? f.querySelector('img') : null;
      if (!im) return { src: '' };
      var cap = f.getAttribute('data-cap') || '';
      if (!cap) {
        var c = f.querySelector('figcaption, .pg, .g-n');
        if (c) cap = (c.textContent || '').trim();
      }
      return { src: im.getAttribute('src') || im.getAttribute('data-src') || '',
               alt: im.getAttribute('alt') || '',
               cap: cap, key: f.getAttribute('data-page') || '' };
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

  /* 문서가 한 편뿐인 페이지 — 고를 것이 없으니 선택 단계를 없앤다(한 번 클릭 = 열기). */
  var ONE = docs.length === 1;
  if (ONE) sel.classList.add('docsel--one');

  /* ---------- 2. 뷰어 골격 ---------- */
  var dv = document.createElement('div');
  dv.className = 'dv';
  dv.setAttribute('role', 'dialog');
  dv.setAttribute('aria-modal', 'true');
  dv.setAttribute('aria-label', '문서 전체 보기');
  dv.innerHTML =
    '<div class="dv__bar">' +
      '<span class="dv__title"></span>' +
      '<span class="dv__count">' +
        '<input class="dv__num" type="text" inputmode="numeric" autocomplete="off" aria-label="페이지 번호로 이동">' +
        '<b class="dv__tot"></b>' +
      '</span>' +
      '<span class="dv__zoom" role="group" aria-label="확대/축소">' +
        '<button type="button" class="dv__zb dv__zb--o" aria-label="축소">−</button>' +
        '<b class="dv__zv" aria-live="polite">100%</b>' +
        '<button type="button" class="dv__zb dv__zb--i" aria-label="확대">+</button>' +
        '<button type="button" class="dv__zf">맞춤</button>' +
      '</span>' +
      '<button type="button" class="dv__gb" aria-pressed="false">전체 페이지</button>' +
      '<span class="dv__swap"></span>' +
      '<button type="button" class="dv__x" aria-label="닫기">&times;</button>' +
    '</div><div class="dv__body"><div class="dv__grid" aria-label="전체 페이지"></div></div>';
  document.body.appendChild(dv);

  var barTitle = dv.querySelector('.dv__title'),
      barNum = dv.querySelector('.dv__num'),
      barTot = dv.querySelector('.dv__tot'),
      barGrid = dv.querySelector('.dv__gb'),
      barZO = dv.querySelector('.dv__zb--o'),
      barZI = dv.querySelector('.dv__zb--i'),
      barZV = dv.querySelector('.dv__zv'),
      barZF = dv.querySelector('.dv__zf'),
      barSwap = dv.querySelector('.dv__swap'),
      gridEl = dv.querySelector('.dv__grid'),
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
    wrap.innerHTML = '<div class="dv__side" role="navigation" aria-label="' + d.short +
                     ' 페이지 선택"></div><div class="dv__scroll"></div>';
    body.insertBefore(wrap, gridEl);
    d.wrap = wrap;
    d.side = wrap.querySelector('.dv__side');
    d.scroll = wrap.querySelector('.dv__scroll');

    var gw = document.createElement('div');
    gw.className = 'dv__gwrap';
    gridEl.appendChild(gw);
    d.gwrap = gw;
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
    d.scroll.addEventListener('pointerdown', zDown, { passive: true });
    d.scroll.addEventListener('click', zClick);
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

  /* 전체 페이지 그리드 — 처음 펼칠 때만 만든다(썸네일과 별개 이미지라 native lazy 로 받는다) */
  function buildGrid(d) {
    if (d.gridBuilt) return;
    d.gridBuilt = true;
    d.gEls = [];
    d.pages.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dv__gc';
      b.setAttribute('aria-label', (i + 1) + '페이지' + (p.cap ? ' · ' + p.cap : ''));
      var im = document.createElement('img');
      im.loading = 'lazy'; im.decoding = 'async'; im.alt = ''; im.src = p.src;
      b.appendChild(im);
      var n = document.createElement('b');
      n.textContent = i + 1;
      b.appendChild(n);
      b.addEventListener('click', function () { setGrid(false); goPage(d, i); });
      d.gwrap.appendChild(b);
      d.gEls.push(b);
    });
    d.gEls.forEach(function (g, k) { g.classList.toggle('is-on', k === d.active); });
  }

  function setGrid(on) {
    if (on && cur) buildGrid(cur);
    dv.classList.toggle('is-grid', !!on);
    barGrid.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on && cur && cur.gEls && cur.gEls[cur.active]) {
      cur.gEls[cur.active].scrollIntoView({ block: 'nearest' });
    }
  }

  function setActive(d, i) {
    if (i < 0 || d.active === i) return;
    d.active = i;
    d.thEls.forEach(function (t, k) { t.classList.toggle('is-on', k === i); });
    if (d.gEls) d.gEls.forEach(function (g, k) { g.classList.toggle('is-on', k === i); });
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

  /* ---------- 2-b. 확대/축소 ----------
     배율은 --dv-z 한 값이고 페이지 폭이 곧 배율이다(이유는 style.css 주석).
     ★ 커서 기준 확대는 비례식으로 맞지 않는다 — 여백·간격·썸네일 레일은 배율을 안 탄다.
       바꾸기 전에 커서 아래 지점을 '그 장 안의 비율 좌표'로 적어 두고, 새 폭이 확정된 뒤
       같은 지점이 화면의 같은 자리에 오도록 실제 사각형을 다시 재서 스크롤을 더한다. */
  var ZS = [1, 1.25, 1.5, 2, 3], zi = 0, shiftOn = false, downAt = null, byMouse = true;

  function pageAt(d, y) {
    var best = null, bd = Infinity, i, r, dist;
    for (i = 0; i < d.pgEls.length; i++) {
      r = d.pgEls[i].getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) return d.pgEls[i];
      dist = y < r.top ? r.top - y : y - r.bottom;
      if (dist < bd) { bd = dist; best = d.pgEls[i]; }
    }
    return best;
  }

  function zoomTo(ni, cx, cy) {
    ni = ni < 0 ? 0 : (ni > ZS.length - 1 ? ZS.length - 1 : ni);
    if (ni === zi) { zBar(); return; }
    var d = cur, keep = null, pg, r, sr;
    if (d && d.built && d.pgEls.length) {
      if (typeof cx !== 'number') {        /* 단추·단축키로 바꿀 때는 보던 칸의 가운데를 붙잡는다 */
        sr = d.scroll.getBoundingClientRect();
        cx = sr.left + sr.width / 2; cy = sr.top + sr.height / 2;
      }
      pg = pageAt(d, cy);
      if (pg) {
        r = pg.getBoundingClientRect();
        keep = { pg: pg, fx: (cx - r.left) / r.width, fy: (cy - r.top) / r.height, cx: cx, cy: cy };
      }
    }
    zi = ni;
    dv.style.setProperty('--dv-z', ZS[zi]);
    dv.classList.toggle('is-zoom', zi > 0);
    if (keep) {
      var sc = d.scroll, prev = sc.style.scrollBehavior;
      sc.style.scrollBehavior = 'auto';    /* smooth 면 이 보정이 애니메이션으로 흘러 어긋난다 */
      var nr = keep.pg.getBoundingClientRect();
      sc.scrollLeft += (nr.left + keep.fx * nr.width) - keep.cx;
      sc.scrollTop += (nr.top + keep.fy * nr.height) - keep.cy;
      sc.style.scrollBehavior = prev;
    }
    zBar();
    if (d) sync(d);
  }

  function zReset() {
    zi = 0;
    dv.style.setProperty('--dv-z', 1);
    dv.classList.remove('is-zoom');
    if (cur && cur.scroll) {
      var prev = cur.scroll.style.scrollBehavior;
      cur.scroll.style.scrollBehavior = 'auto';
      cur.scroll.scrollLeft = 0;
      cur.scroll.style.scrollBehavior = prev;
    }
    zBar();
  }

  function zBar() {
    barZV.textContent = Math.round(ZS[zi] * 100) + '%';
    barZO.disabled = barZF.disabled = zi === 0;
    barZI.disabled = zi === ZS.length - 1;
    /* 커서 모양이 곧 가능 여부다 — 한계에 닿으면 확대/축소 커서를 거둔다 */
    dv.classList.toggle('is-czin', !shiftOn && zi < ZS.length - 1);
    dv.classList.toggle('is-czout', shiftOn && zi > 0);
  }

  /* 페이지 위 왼쪽 클릭 = 한 단계 확대, Shift+클릭 = 한 단계 축소.
     ★ 마우스만 받는다 — 터치·펜은 브라우저 기본 핀치/스크롤에 맡긴다(탭이 확대로 오작동하지 않게).
     ★ 끌어서 스크롤한 끝의 click 은 확대가 아니다. */
  function zDown(e) {
    byMouse = !e.pointerType || e.pointerType === 'mouse';
    downAt = [e.clientX, e.clientY];
  }
  function zClick(e) {
    if (!byMouse || !cur) return;
    var t = e.target;
    if (!t || !t.closest || !t.closest('.dv__pg')) return;   /* 여백 클릭은 종전대로 닫기다 */
    if (downAt && (Math.abs(e.clientX - downAt[0]) > 6 || Math.abs(e.clientY - downAt[1]) > 6)) return;
    zoomTo(zi + (e.shiftKey ? -1 : 1), e.clientX, e.clientY);
  }

  barZO.addEventListener('click', function () { zoomTo(zi - 1); });
  barZI.addEventListener('click', function () { zoomTo(zi + 1); });
  barZF.addEventListener('click', function () { zoomTo(0); });
  function shiftWatch(e) {
    if (!dv.classList.contains('is-open') || !!e.shiftKey === shiftOn) return;
    shiftOn = !!e.shiftKey;
    zBar();
  }
  document.addEventListener('keydown', shiftWatch);
  document.addEventListener('keyup', shiftWatch);
  zBar();

  function syncBar() {
    if (!cur) return;
    barTitle.textContent = cur.title;
    barTot.textContent = '/ ' + cur.pages.length;
    /* 입력 중에는 덮어쓰지 않는다 — 스크롤 추적이 타이핑을 지운다 */
    if (document.activeElement !== barNum) barNum.value = String(Math.max(cur.active, 0) + 1);
  }

  function jump() {
    if (!cur) return;
    var n = parseInt(barNum.value, 10);
    if (n >= 1 && n <= cur.pages.length) goPage(cur, n - 1);
    barNum.value = String(Math.max(cur.active, 0) + 1);
  }
  barNum.addEventListener('change', jump);
  barNum.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); jump(); barNum.blur(); }
  });
  barNum.addEventListener('focus', function () { barNum.select(); });
  barGrid.addEventListener('click', function () { setGrid(!dv.classList.contains('is-grid')); });

  /* ---------- 3. 열기 · 닫기 · 문서 전환 ---------- */
  var cur = null, opener = null, lockY = 0;

  function showDoc(i) {
    var d = docs[i];
    build(d);
    docs.forEach(function (x) {
      x.wrap.classList.toggle('is-on', x === d);
      x.gwrap.classList.toggle('is-on', x === d);
      x.swapBtn.setAttribute('aria-pressed', x === d ? 'true' : 'false');
    });
    cur = d;
    zReset();          /* 문서를 바꾸거나 닫았다 열면 100% 로 — 열 때마다 반드시 거친다 */
    if (dv.classList.contains('is-grid')) setGrid(true);
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

  /* ?doc= 로 들어와 곧장 열린 경우 — 돌아갈 자리가 없다(들어온 순간 스크롤은 0).
     닫을 때 문서 카드 앞에 내려놓는다. 이 좌표는 **닫는 시점**에 재야 맞는다 —
     열 때는 뷰어가 갤러리 섹션을 들어낸 직후라 문서가 아직 제 높이가 아니다. */
  var landOnSel = false;

  function close() {
    setGrid(false);
    dv.classList.remove('is-open');
    document.body.style.overflow = '';
    if (landOnSel) {
      landOnSel = false;
      var sb = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';   /* smooth 면 이 이동이 통째로 씹힌다 */
      var t = (sel.closest('section') || sel).getBoundingClientRect().top + (window.pageYOffset || 0) - 64;
      window.scrollTo(0, t < 0 ? 0 : t);
      document.documentElement.style.scrollBehavior = sb;
    } else {
      window.scrollTo(0, lockY);
    }
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  dv.querySelector('.dv__x').addEventListener('click', close);
  dv.addEventListener('click', function (e) {
    if (e.target === body || (cur && (e.target === cur.scroll || e.target === cur.wrap))) close();
  });
  window.addEventListener('resize', function () { if (cur && dv.classList.contains('is-open')) queue(cur); });

  document.addEventListener('keydown', function (e) {
    if (!dv.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (dv.classList.contains('is-grid')) setGrid(false); else close();
      return;
    }
    if (e.key === 'Tab') { trap(e); return; }
    if (e.target === barNum) return;   /* 번호 입력 중 — 화살표는 편집용이다 */
    if (!cur) return;
    /* ★ 수정자가 붙은 조합은 넘긴다 — ⌘+/⌘-/⌘0 은 브라우저 확대다. 가로채지 말 것. */
    if (!e.metaKey && !e.ctrlKey && !e.altKey &&
        (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '_' || e.key === '0')) {
      zoomTo(e.key === '0' ? 0 : (e.key === '+' || e.key === '=' ? zi + 1 : zi - 1));
      e.preventDefault();
      return;
    }
    var sc = cur.scroll, step = sc.clientHeight * 0.9;
    if (e.key === 'ArrowDown') sc.scrollTop += 120;
    else if (e.key === 'ArrowUp') sc.scrollTop -= 120;
    else if (e.key === 'PageDown') sc.scrollTop += step;
    else if (e.key === 'PageUp') sc.scrollTop -= step;
    else if (e.key === 'Home') goPage(cur, 0);
    else if (e.key === 'End') goPage(cur, cur.pages.length - 1);
    else if (e.key === 'ArrowLeft' && zi > 0) sc.scrollLeft -= 120;    /* 확대 중에만 — 넘친 폭 이동 */
    else if (e.key === 'ArrowRight' && zi > 0) sc.scrollLeft += 120;
    else return;
    e.preventDefault();
    queue(cur);
  });

  function trap(e) {
    var f = Array.prototype.filter.call(
      dv.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])'),
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
      d.card.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
    if (lit && SMOOTH) {
      var c = docs[i].card;
      c.classList.remove('is-lit');
      void c.offsetWidth;
      c.classList.add('is-lit');
    }
    if (go) go.innerHTML = '<b>' + docs[i].title + '</b> 펼쳐 보기 →';
  }

  /* 선택은 hover, 열기는 클릭 — 1단계다. hover 가 없는 환경(터치·키보드)에서도
     클릭/Enter 로 바로 열리고 ←→·포커스로 고를 수 있다.
     ★ 스침 방지: 커서가 지나가기만 해도 카드가 튀지 않게 진입 후 HOVER_IN 만큼 머물러야 바뀐다.
       나갈 때는 되돌리지 않는다 — 되돌리면 카드↔버튼 사이를 지날 때마다 깜빡인다. */
  var HOVERABLE = !!(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches);
  var HOVER_IN = 110, hoverT = 0;

  docs.forEach(function (d, i) {
    var hit = d.card.querySelector('.docsel__hit');
    if (!hit) return;
    hit.addEventListener('click', function (e) { e.preventDefault(); open(i); });
    hit.addEventListener('focus', function () { if (picked !== i) select(i, true); });
    if (ONE || !HOVERABLE) return;
    hit.addEventListener('pointerenter', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      clearTimeout(hoverT);
      if (picked === i) return;
      hoverT = setTimeout(function () { select(i, true); }, HOVER_IN);
    });
    hit.addEventListener('pointerleave', function () { clearTimeout(hoverT); });
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

  /* ---------- 6. ?doc=<키> 로 도착하면 그 문서를 열어 둔 채 시작한다 ----------
     키는 카드 id 의 `doc-` 뒤 조각(orig / sum / combat / sub …). index 상세의
     표지 카드가 이 쿼리로 들어와 '클릭 한 번 = 문서'를 만든다.
     ★ 쿼리는 연 직후 지운다 — 남겨 두면 닫은 뒤 새로고침·뒤로가기에서 다시 열린다. */
  var want = (location.search.match(/[?&]doc=([^&]*)/) || [])[1];
  if (want) {
    want = decodeURIComponent(want.replace(/\+/g, ' '));
    var at0 = 0;
    docs.forEach(function (d, i) {
      if ((d.card.id || '').replace(/^doc-/, '') === want) at0 = i;
    });
    select(at0, false);
    landOnSel = true;
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    open(at0);
  }
})();
