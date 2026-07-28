/* ═══════════════════════════════════════════════════════════════════════
   방문자 집계(관리자 전용) + 본페이지 최근 업데이트 표시 (모든 페이지 공용)

   • GoatCounter 코드는 관리자(portfolio-admin)에서 넣고 '반영하기'를 누르면
     아래 CODE 줄이 자동으로 채워집니다. 비어 있으면 집계는 꺼진 상태입니다.
   • 방문자 수는 공개 페이지에 표시하지 않는다 — 관리자 대시보드(GoatCounter)에서만 확인.
   • '최근 업데이트' 일시는 GitHub 공개 API로 자동 조회하므로 가입과 무관하게
     항상 작동합니다.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  /* ADMIN:GC_CODE START */ var CODE = "baehyun"; /* ADMIN:GC_CODE END */
  var REPO = "00ny/00ny.github.io"; // 최근 업데이트 일시를 읽어올 GitHub 저장소

  // 1) 방문자 집계 (코드가 있을 때만) — 위치·유입·기기 정보는 GoatCounter가 자동 수집
  if (CODE) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "//gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://" + CODE + ".goatcounter.com/count");
    document.head.appendChild(s);
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
