/* ═══════════════════════════════════════════════════════════════════════
   방문자 집계(관리자 전용) + 본페이지 최근 업데이트 표시 (모든 페이지 공용)

   • GoatCounter 코드는 관리자(portfolio-admin)에서 넣고 '반영하기'를 누르면
     아래 CODE 줄이 자동으로 채워집니다. 비어 있으면 집계는 꺼진 상태입니다.
   • Microsoft Clarity(화면 녹화·히트맵)도 같은 방식입니다 — 관리자에서 프로젝트 ID를
     넣고 '반영하기'를 누르면 아래 CLARITY 줄이 채워집니다. 비어 있으면 안 실립니다.
   • 방문자 수는 공개 페이지에 표시하지 않는다 — 관리자 대시보드(GoatCounter)에서만 확인.
   • '최근 업데이트' 일시는 GitHub 공개 API로 자동 조회하므로 가입과 무관하게
     항상 작동합니다.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  /* ADMIN:GC_CODE START */ var CODE = "baehyun"; /* ADMIN:GC_CODE END */
  /* ADMIN:CLARITY_ID START */ var CLARITY = "xufmlow3tp"; /* ADMIN:CLARITY_ID END */
  var REPO = "00ny/00ny.github.io"; // 최근 업데이트 일시를 읽어올 GitHub 저장소

  /* ── 집계를 켤지 말지 ──────────────────────────────────────────────────
     ★ 차단 목록이 아니라 **허용 목록**이다. 막을 것을 하나씩 적는 방식은 반드시
       샌다 — 실제로 Clarity 에 `http://localhost/index.html`(8건, 1위)과
       `https://Electron`(1건)이 쌓였다. 뒤쪽은 앱 내장 브라우저라 localhost 도
       사설 IP 도 아니어서 어떤 차단 규칙에도 안 걸린다.
       그래서 **실제 사이트 주소일 때만** 집계한다. 나머지(로컬 미리보기, 내장
       브라우저, file://, IP 직접 접속, 미리보기 배포)는 전부 자동으로 빠진다.
     • 도메인을 옮기면 이 배열에 새 주소를 넣어야 집계가 다시 켜진다.
       (안 넣으면 조용히 꺼진다 — 통계가 안 늘면 여기를 먼저 볼 것)

     ── 내 방문 빼기 ──────────────────────────────────────────────────
     주소 끝에 `?track=off` 를 한 번 붙여 열면 이 브라우저에서는 이후 집계가
     꺼진다(GoatCounter·Clarity 둘 다). 다시 켜려면 `?track=on`.
     기기·브라우저마다 한 번씩 해야 한다(그 브라우저에만 저장되기 때문).
     ※ 이건 '앞으로'만 막는다. 이미 쌓인 기록은 지우지 못한다. */
  var SITE_HOSTS = ["00ny.github.io"];
  var LIVE = SITE_HOSTS.indexOf(location.hostname) !== -1;

  var optOut = false;
  try {
    var q = location.search;
    if (/[?&]track=off\b/.test(q)) localStorage.setItem("track-off", "1");
    else if (/[?&]track=on\b/.test(q)) localStorage.removeItem("track-off");
    optOut = localStorage.getItem("track-off") === "1";
  } catch (e) { /* 시크릿 모드 등에서 localStorage 가 막히면 그냥 집계한다 */ }

  var TRACK = LIVE && !optOut;

  // 1) 방문자 집계 (코드가 있을 때만) — 위치·유입·기기 정보는 GoatCounter가 자동 수집
  if (CODE && TRACK) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "//gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://" + CODE + ".goatcounter.com/count");
    document.head.appendChild(s);
  }

  // 1-b) 화면 녹화·히트맵 (Microsoft Clarity) — 프로젝트 ID 가 있을 때만.
  //   • ID 는 비밀이 아니다. 어차피 공개 페이지에 그대로 실리는 값이라 관리자에서 넣고
  //     '반영하기'를 누르면 위 CLARITY 줄이 채워진다. 비어 있으면 아무것도 나가지 않는다.
  //   • 아래 세 줄은 Clarity 의 '수동으로 설치'가 주는 **공식 스니펫 그대로**이고,
  //     마지막 인자만 위 CLARITY 변수로 바꿨다. 스니펫을 손보지 말 것.
  //   • 이 파일은 </body> 앞에서 defer 로 실행되므로 문서 안에 <script> 가 반드시 하나 이상
  //     있다(최소한 이 파일 자신). 그래서 스니펫의 getElementsByTagName("script")[0] 이 늘 잡힌다.
  //
  //   ★ 위 TRACK 이 false 면 아예 안 싣는다. Clarity 에는 GoatCounter 같은 자동 로컬 제외가
  //     없어서, 이게 없으면 개발 중 미리보기까지 전부 녹화된다. 그 녹화는 재생해도 화면이
  //     깨지는데(Clarity 서버가 localhost 의 CSS·이미지를 못 가져온다) 사이트 결함처럼 보인다.
  if (CLARITY && TRACK) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY);
  }

  // 2) 본페이지 사이 띠 채우기 (해당 요소가 있는 페이지에서만)
  // 방문자 수는 공개 페이지에 표시하지 않는다 — 관리자 대시보드(GoatCounter)에서만 확인
  document.addEventListener("DOMContentLoaded", function () {
    // 최근 업데이트 일시 — GitHub 공개 API, 가입과 무관하게 자동.
    // ※ 값은 '커밋한 시각'이지 push 시각이 아니다. 로컬에서 커밋만 하고 나중에
    //   push 하면 표시 시각이 push 보다 이르게 나온다.
    var lu = document.getElementById("lastUpdate");
    if (lu) {
      fetch("https://api.github.com/repos/" + REPO + "/commits?per_page=1")
        .then(function (r) { return r.json(); })
        .then(function (a) {
          if (a && a[0] && a[0].commit) {
            var d = new Date(a[0].commit.committer.date);
            // 분 단위까지 한국 시각으로 고정 표기 — timeZone 을 안 주면 방문자
            // 현지 시각으로 보이고, hourCycle 을 안 주면 자정이 24:00 이 될 수 있다
            lu.querySelector("b").textContent = new Intl.DateTimeFormat("ko-KR", {
              timeZone: "Asia/Seoul",
              year: "numeric", month: "numeric", day: "numeric",
              hour: "2-digit", minute: "2-digit", hourCycle: "h23"
            }).format(d);
            lu.hidden = false;
          }
        })
        .catch(function () {});
    }
  });
})();
