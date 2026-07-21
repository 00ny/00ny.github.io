/* 콘텐츠 보호 — 우클릭 메뉴·이미지 드래그를 막아 가벼운 복제를 억제한다.
   한계(정직): 개발자 도구·소스 보기·저장소 클론까지 막지는 못한다(웹 구조상 불가능).
   끄려면 각 HTML에서 guard.js <script> 한 줄을 지우면 된다. */
document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
document.addEventListener('dragstart', function (e) {
  var t = e.target;
  if (t && (t.tagName === 'IMG' || t.tagName === 'A')) e.preventDefault();
});
