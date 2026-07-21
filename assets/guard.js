/* 콘텐츠 보호 — 이미지 저장/복사만 가볍게 억제한다. 우클릭 자체는 살려둔다.
   · 이미지 위 우클릭만 차단(→ "이미지 저장" 메뉴가 안 뜬다)
   · 링크·텍스트·빈 공간의 우클릭은 그대로(→ "새 탭에서 열기" 등 정상)
   · 이미지 드래그(끌어서 저장)도 차단
   한계(정직): 개발자 도구·소스 보기·저장소 clone까지는 못 막는다. 가벼운 억제 장치일 뿐.
   끄려면 각 HTML에서 guard.js <script> 한 줄을 지우면 된다. */
document.addEventListener('contextmenu', function (e) {
  if (e.target && e.target.tagName === 'IMG') e.preventDefault();   // 이미지 위에서만
});
document.addEventListener('dragstart', function (e) {
  if (e.target && e.target.tagName === 'IMG') e.preventDefault();
});
