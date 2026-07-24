/* ═══════════════════════════════════════════════════════════════════════
   방문자 집계 + 본페이지 표시 (모든 페이지 공용)

   • GoatCounter 코드는 관리자(portfolio-admin)에서 넣고 '반영하기'를 누르면
     아래 CODE 줄이 자동으로 채워집니다. 비어 있으면 집계는 꺼진 상태입니다.
   • '최근 업데이트' 일시는 GitHub 공개 API로 자동 조회하므로 가입과 무관하게
     항상 작동합니다.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  /* ADMIN:GC_CODE START */ var CODE = ""; /* ADMIN:GC_CODE END */
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
  document.addEventListener("DOMContentLoaded", function () {
    // 2-a) 오늘 방문자 — 공개 카운터(토큰 불필요), 오늘 날짜부터 집계
    var vt = document.getElementById("visitorToday");
    if (vt && CODE) {
      var t = new Date();
      var day =
        t.getFullYear() +
        "-" +
        String(t.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(t.getDate()).padStart(2, "0");
      fetch("https://" + CODE + ".goatcounter.com/counter/TOTAL.json?start=" + day)
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.count != null) {
            vt.querySelector("b").textContent = j.count + "명";
            vt.hidden = false;
          }
        })
        .catch(function () {});
    }

    // 2-b) 최근 업데이트(push) 일시 — GitHub 공개 API, 가입과 무관하게 자동
    var lu = document.getElementById("lastUpdate");
    if (lu) {
      fetch("https://api.github.com/repos/" + REPO + "/commits?per_page=1")
        .then(function (r) { return r.json(); })
        .then(function (a) {
          if (a && a[0] && a[0].commit) {
            var d = new Date(a[0].commit.committer.date);
            lu.querySelector("b").textContent =
              d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate() + ".";
            lu.hidden = false;
          }
        })
        .catch(function () {});
    }
  });
})();
