/* ============================================================
   같은 페이지 안 이동 = 부드러운 스크롤   (공용 · index + 프로젝트 6)
   ------------------------------------------------------------
   무엇을 바꾸나
     목차 바·"쇼케이스로 보기 ↓"·"게임 리뷰 보러가기 ↓"·"리뷰 ↑" 처럼
     href="#..." 로 같은 문서 안을 오가는 링크만 가로챈다.
     다른 문서로 가는 이동(프로젝트 페이지 진입·외부 링크)은 손대지 않는다 —
     그건 '뎁스 이동'이라 화면이 바뀌는 게 맞다.

   왜 CSS 한 줄(scroll-behavior:smooth)로 끝내지 않았나 — 실측 때문이다.
     Chrome 148 · 1280×800 에서 네이티브 smooth 의 소요 시간은 거리에 끌려간다.
         879px → 749ms      6,266px → 1,531ms      13,287px → 1,594ms
     첫 화면에서 #showcase(페이지 끝)까지 1.6초다. "화면을 빠르게 내린다"는
     요구와 어긋나고, 엔진마다 곡선이 달라 같은 사이트가 브라우저별로 다르게 움직인다.
     그래서 지속시간을 여기서 정한다 — 거리에 따라 늘되 상한이 있다.
         dur = clamp(MIN, K·√거리, MAX)
         879px → 300ms     6,266px → 554ms     13,287px → 700ms   (네이티브의 1/2~1/3)
     √를 쓰는 이유: 짧은 거리에 500ms 를 쓰면 고무줄처럼 늘어지고,
     긴 거리에 일정 시간을 쓰면 시작이 튄다. 상한이 있어야 '어디로 가든 비슷한 시간'이 된다.

   ★ CSS 의 html{scroll-behavior:smooth} 는 지우지 말 것 — 이 파일이 못 뜨거나
     JS 가 꺼진 환경의 폴백이다. 대신 애니메이션 동안에는 인라인 auto 로 잠깐 끈다.
     안 끄면 프레임마다 부르는 scrollTo 가 저마다 또 애니메이션을 만들어 서로를 쫓는다.
     (인라인 style 은 어떤 시트보다 세므로 페이지 <style> 의 smooth 도 함께 눌린다.)
   ★ 착지 지점의 숫자(68px·64px …)를 여기 적지 않는다. 대상의 scroll-margin-top 과
     스크롤 컨테이너의 scroll-padding-top 을 읽어서 쓴다 — CSS 가 단일 소스다.
     그래서 index(68) 와 프로젝트 페이지(64) 와 헤스티(scroll-padding 64) 가
     각자 자기 값으로 착지한다. 이 파일은 페이지마다 다르게 손볼 것이 없다.
   ★ prefers-reduced-motion: reduce → 애니메이션 없이 즉시 이동.
   ★ no-JS → 이 파일이 실행되지 않고 CSS 의 smooth 가 그대로 남는다(앵커는 살아 있다).

   속도를 바꾸고 싶으면 아래 MIN·MAX·K 세 숫자만 만지면 된다.
   ============================================================ */
(function () {
  var root = document.documentElement;
  var rm = window.matchMedia
    ? matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  var MIN = 300;   /* 아무리 가까워도 이만큼은 움직인다 — 더 짧으면 '잘라 붙인' 것으로 읽힌다 */
  var MAX = 700;   /* 아무리 멀어도 이 안에 끝낸다 — 페이지 끝까지가 이 값이다 */
  var K   = 7;     /* 거리 곡선. dur = K·√거리 */

  var raf = 0;         /* 도는 중인 애니메이션 프레임 */
  var release = null;  /* 끝나거나 취소될 때 되돌릴 것들 */

  function num(v) { var n = parseFloat(v); return n > 0 ? n : 0; }
  function nowY() { return window.pageYOffset || root.scrollTop || 0; }

  /* 네이티브 앵커와 같은 자리에 세운다:
     대상의 scroll-margin 영역 위쪽을, scroll-padding 만큼 안쪽으로 들어간 뷰포트 위쪽에 맞춘다. */
  function targetY(el) {
    var pad = num(getComputedStyle(root).scrollPaddingTop);
    var mar = num(getComputedStyle(el).scrollMarginTop);
    var y   = el.getBoundingClientRect().top + nowY() - mar - pad;
    var max = root.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(y, max > 0 ? max : 0));
  }

  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (release) { release(); release = null; }
  }

  /* 스크롤 키만 취소로 친다. Tab·Esc·글자 입력까지 취소하면 오작동으로 보인다.
     Enter 는 링크를 누른 그 키라 여기 없다(keydown 이 click 보다 먼저 끝난다). */
  var STOPKEY = { ArrowUp:1, ArrowDown:1, PageUp:1, PageDown:1, Home:1, End:1, ' ':1, Spacebar:1 };

  function glide(to, done) {
    var from = nowY(), d = to - from, ad = Math.abs(d);
    if (ad < 2) { done(); return; }                 /* 이미 그 자리 */

    var dur = Math.max(MIN, Math.min(MAX, K * Math.sqrt(ad)));
    var was = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';             /* ★ 위 주석 참조 */

    /* 사용자가 직접 스크롤하면 즉시 손을 뗀다 — 끌어당기며 싸우지 않는다.
       (트랙패드 관성이 남은 채로 링크를 누르면 시작하자마자 취소될 수 있다.
        그때 화면은 사용자의 손이 하던 대로 계속 움직이므로 어색하지 않다.) */
    function keyStop(e) { if (STOPKEY[e.key]) stop(); }
    addEventListener('wheel', stop, { passive: true });
    addEventListener('touchstart', stop, { passive: true });
    addEventListener('keydown', keyStop);
    release = function () {
      removeEventListener('wheel', stop);
      removeEventListener('touchstart', stop);
      removeEventListener('keydown', keyStop);
      root.style.scrollBehavior = was;
    };

    var t0 = 0;
    raf = requestAnimationFrame(function step(now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   /* easeInOutCubic */
      window.scrollTo(0, Math.round(from + d * e));
      if (p < 1) { raf = requestAnimationFrame(step); return; }
      raf = 0;
      if (release) { release(); release = null; }
      done();
    });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (a.target && a.target !== '_self') return;      /* 새 탭은 그대로 둔다 */
    if (a.hasAttribute('download')) return;

    var href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '#' || href.length < 2) return;   /* '#' 단독은 통과 */

    var id = href.slice(1), el = null;
    try { el = document.getElementById(decodeURIComponent(id)); } catch (err) { /* 잘못된 이스케이프 */ }
    if (!el) el = document.getElementById(id);
    if (!el) return;                                   /* 없는 앵커 → 브라우저에 맡긴다 */

    e.preventDefault();

    /* 주소와 히스토리는 '지금' 남긴다. 이 시점의 스크롤 위치(=출발점)가 이전 항목의
       복원 위치로 기록되기 때문이다 — 끝난 뒤에 남기면 도착점이 출발점으로 기록돼
       뒤로가기가 제자리걸음이 된다. pushState 는 스크롤을 옮기지 않아 점프가 없다. */
    if (window.history && history.pushState) history.pushState(null, '', href);
    else location.hash = href;                         /* 아주 오래된 브라우저 — 즉시 점프 */

    var y = targetY(el);

    /* 포커스도 옮긴다. 네이티브 앵커가 하던 일이라, 안 하면 키보드·스크린리더의
       다음 Tab 이 목차 링크 자리에서 이어져 화면 밖으로 나간다.
       도착한 뒤에 옮겨 preventScroll 을 모르는 브라우저에서도 튀지 않게 한다.
       테두리는 style.css 의 [tabindex="-1"]:focus 규칙이 지운다. */
    function landed() {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      try { el.focus({ preventScroll: true }); } catch (err) { el.focus(); }
    }

    stop();                                            /* 이동 중 다른 앵커를 누르면 앞의 것을 접는다 */
    if (rm.matches) {
      /* 즉시 이동. CSS 의 reduce 예외에 기대지 않고 여기서도 직접 끈다 —
         style.css 가 못 뜨면 페이지 <style> 의 smooth 가 살아남아 '즉시'가 아니게 된다. */
      var w = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, y);
      root.style.scrollBehavior = w;
      landed();
      return;
    }
    glide(y, landed);
  });
})();
