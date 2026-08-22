/* 원본 캡처 팝업 — a[data-shotlb] 를 같은 화면 안에서 연다(새 탭으로 나가지 않는다).
   ★ 포커스 복귀 대상은 트리거를 직접 받는다. document.activeElement 로 잡으면
     사파리에서 마우스로 누른 링크에 포커스가 없어 복귀가 엉뚱한 곳으로 튄다.
   ★ href 는 지우지 말 것 — 이 스크립트가 없을 때의 유일한 접근 경로다. */
(function () {
  var links = document.querySelectorAll('a[data-shotlb]');
  if (!links.length) return;
  var box = null, img, cap, xbtn, last = null;

  function build() {
    box = document.createElement('div');
    box.className = 'shotlb';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', '원본 캡처 확대 보기');
    box.innerHTML = '<button class="shotlb__x" type="button" aria-label="닫기">×</button>'
      + '<img class="shotlb__img" alt="">'
      + '<p class="shotlb__cap"></p>';
    img = box.querySelector('.shotlb__img');
    cap = box.querySelector('.shotlb__cap');
    xbtn = box.querySelector('.shotlb__x');
    box.addEventListener('click', function (e) { if (e.target !== img) close(); });
    document.body.appendChild(box);
  }

  function open(a) {
    if (!box) build();
    var im = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = im ? im.alt : '';
    cap.textContent = a.getAttribute('data-shotlb') || '';
    last = a;
    box.classList.add('on');
    document.body.style.overflow = 'hidden';
    xbtn.focus();
  }

  function close() {
    if (!box || !box.classList.contains('on')) return;
    box.classList.remove('on');
    document.body.style.overflow = '';
    if (last && last.focus) last.focus();
    last = null;
  }

  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function (e) { e.preventDefault(); open(this); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
