/* ============================================================
   상단 고정 바 교대   (공용 · 프로젝트 페이지 전용 — index 에는 .site-bar 가 없어 즉시 빠진다)
   ------------------------------------------------------------
   ★ 불변식: 화면에 고정된 바는 항상 0개 또는 1개.
       문서 최상단 구간 = 신원 스트립(.site-bar)만
       목차를 지난 뒤    = 페이지 목차 내비(nav:not(.proj-nav))만
     교대는 style.css 의 transition-delay 가 순차로 처리한다(나가는 쪽 먼저).
     여기서는 html 에 .nav-on 을 켜고 끄기만 한다.

   "목차를 지났다"의 판정 — 7편의 구조가 제각각이라 한 셀렉터로는 안 된다.
     문서 안 목차 블록(.toc:not(nav)) · 입구 리드(.entry-lede) · 히어로 · 내비의 원래 자리,
     이 후보들 중 **가장 아래에 있는 것의 바닥**을 임계값으로 쓴다.
     한 페이지에 목차 블록이 없어도(여우숲·원쁠원) 리드/내비 자리가 대신 잡히므로
     페이지별 분기가 필요 없다.
   ★ 내비를 position:fixed 로 띄우면 원래 자리를 잃는다 — 그래서 자리에 표식을 먼저 남긴다.
   ============================================================ */
(function () {
  var root = document.documentElement;
  if (!document.querySelector('.site-bar')) return;              /* index — 여긴 스트립이 없다 */
  var nav = document.querySelector('nav:not(.proj-nav)');
  if (!nav || !nav.parentNode) return;

  root.classList.add('shellnav-boot');
  root.classList.add('shellnav');

  var mark = document.createElement('div');
  mark.className = 'shellnav-mark';
  mark.setAttribute('aria-hidden', 'true');
  nav.parentNode.insertBefore(mark, nav);

  var SEL = ['.toc:not(nav)', '.entry-lede', 'header.hero', '.hero'];

  function threshold() {
    var y = mark.getBoundingClientRect().top + window.pageYOffset;
    for (var i = 0; i < SEL.length; i++) {
      var list = document.querySelectorAll(SEL[i]);
      for (var j = 0; j < list.length; j++) {
        var b = list[j].getBoundingClientRect().bottom + window.pageYOffset;
        if (b > y) y = b;
      }
    }
    return y;
  }

  var on = false, tick = 0;
  var HYST = 24;   /* 임계값 위에서 손이 떨려도 두 바가 번갈아 깜빡이지 않게 하는 사구간 */

  function apply() {
    tick = 0;
    var t = threshold(), y = window.pageYOffset;
    var next = on ? (y > t - HYST) : (y > t);
    if (next !== on) { on = next; root.classList.toggle('nav-on', on); }
  }
  function sched() { if (!tick) tick = requestAnimationFrame(apply); }

  addEventListener('scroll', sched, { passive: true });
  addEventListener('resize', sched);
  addEventListener('load', sched);
  apply();
  requestAnimationFrame(function () { root.classList.remove('shellnav-boot'); });
})();
