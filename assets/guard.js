/* 콘텐츠 보호 — 가벼운 복제 억제일 뿐 보안이 아니다.
   개발자 도구 · 소스 보기 · 자산 URL 직접 입력 · 화면 캡처는 막지 못한다.
   끄려면 각 HTML 의 guard.js <script> 한 줄을 지운다. */
(function () {
  /* capture 로 받는다 — 중간에서 stopPropagation 을 걸어도 통과하지 못하게. */
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); }, true);

  /* ★ [draggable="true"] 만 통과시킨다 — index.html 의 '대표 포트폴리오' 순서 바꾸기가 그것으로 돈다.
     예외 없이 막으면 그 기능이 조용히 죽는다. */
  document.addEventListener('dragstart', function (e) {
    var n = e.target, el = n && n.nodeType === 1 ? n : n && n.parentElement;
    if (el && el.closest && el.closest('[draggable="true"]')) return;
    e.preventDefault();
  }, true);

  /* ⌘S / Ctrl+S 저장. e.code 를 함께 보는 것은 한글 입력 상태에서 e.key 가 달라지기 때문이다. */
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey &&
        (e.code === 'KeyS' || e.key === 's' || e.key === 'S')) e.preventDefault();
  }, true);
})();
