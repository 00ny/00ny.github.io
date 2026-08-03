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

  /* ── 꼬리표를 방문 내내 이어 붙인다 ─────────────────────────────────────
     GoatCounter 는 **페이지를 볼 때마다** 그 순간의 주소에서 꼬리표를 읽는다.
     그래서 `?campaign=SJM` 으로 들어온 사람이 안에서 문서를 눌러 넘어가면
     그 주소엔 꼬리표가 없어 **그 조회는 꼬리표 없이 기록된다**(실측:
     `/?campaign=SJM` 6 · `/projects/endfield-level.html` 은 꼬리표 없음).
     방문자를 식별해 저장하지 않는 설계라 서버가 이어 줄 방법도 없다.

     → 이 브라우저의 탭이 기억하게 한다. 처음 들어올 때 꼬리표를 sessionStorage
       에 넣어 두고, 이후 조회는 `window.goatcounter.path` 에 그 꼬리표를 붙여
       보낸다(공식 지원 설정: `window.goatcounter = {path: '/hello'}`).
       그러면 `/projects/endfield-level.html?campaign=SJM` 로 기록돼
       "SJM 으로 온 사람이 무릉을 봤다"가 통계에 남는다.
       관리자 화면은 이미 경로에서 쿼리를 떼고 `문서 · 태그 SJM` 으로 보여 준다.

     ★ 값이 바뀌는 점 — 이제 캠페인 숫자는 '들어온 횟수'가 아니라
       '그 꼬리표로 온 사람이 본 화면 수'가 된다. 이어 붙이지 않으면 "어디로
       갔는지"를 영영 알 수 없으므로 그 교환을 택했다.
     · sessionStorage 라 탭을 닫으면 사라진다(새 방문은 새로 시작).
       새로고침은 유지된다.
     · 들어온 주소에 이미 꼬리표가 있으면 손대지 않는다 — GoatCounter 가
       알아서 읽는다. 두 번 붙이면 경로가 지저분해진다.
     · 옛 `?campaign=` 링크도 **읽는 쪽에서는 계속 인식한다**(이미 뿌린 링크가 있다).
       새로 붙이는 이름만 아래처럼 `utm_campaign` 이다.

     ── ★ 2026-08-03 · 왜 주소 자체를 고쳐 쓰는가 ────────────────────────────
     예전에는 `window.goatcounter.path` 만 바꿨다. 그러면 **GoatCounter 에게 말하는
     경로만** 바뀌고 브라우저의 실제 주소는 그대로라, Microsoft Clarity 는 꼬리표를
     영영 못 봤다(Clarity 는 우리가 주는 값이 아니라 **실제 location 을 읽는다**).
     그래서 하위 문서에서 두 도구가 서로 다른 것을 보는 비대칭이 있었다.

     검토한 다른 길과 버린 이유 —
       ⓐ Clarity 커스텀 태그 `clarity("set", 키, 값)` : **버렸다.** API 는 실재하지만
         공식 Data Export API 가 쪼갤 수 있는 차원은 Browser·Device·Country/Region·
         OS·Source·Medium·Campaign·Channel·URL **아홉 개로 고정**이고 커스텀 태그는
         그 안에 없다. 문서에도 커스텀 태그는 **Filters(녹화 거르기)** 에 나온다고만
         적혀 있다 → 관리자 화면의 집계로는 **조회할 수 없다.**
       ⓑ 잠깐 붙였다가 몇 초 뒤에 다시 떼기 : 버렸다. GoatCounter 는 한 번만 보내니
         안전하지만, Clarity 가 주소 변화를 어떻게 처리하는지 확인할 방법이 없다.
       ⓒ 지금 방식 — 주소에 `utm_campaign` 을 심는다. 두 도구가 **자기 눈으로**
         같은 꼬리표를 본다. Clarity 의 `Campaign` 칸이 세션 단위인지 페이지 단위인지는
         아직 실데이터로 확인 못 했는데(꼬리표 붙은 방문이 아직 없다), 이 방식은
         **URL 값 자체에 꼬리표가 들어가므로 그 답과 무관하게 이어진다.**

     ⚠️ 대가 : 주소창에 꼬리표가 보인다. 방문자가 그 주소를 복사해 남에게 보내면
       그 사람의 방문도 같은 꼬리표로 잡힌다. 되돌리려면 아래 `history.replaceState`
       한 줄만 지우면 된다 — 나머지는 그대로 두어도 옛 동작(GoatCounter 만 인식)이 된다.
     ⚠️ 반드시 **Clarity·GoatCounter 스크립트를 붙이기 전에** 고쳐야 한다. 둘 다
       실릴 때의 주소를 읽기 때문이다. 이 블록을 아래로 옮기지 말 것. */
  var CAMP_KEY = "gc-campaign";
  var campHere = /[?&](?:campaign|utm_campaign)=/.test(location.search);
  var camp = "";
  try {
    var m = /[?&](?:campaign|utm_campaign)=([^&#]*)/.exec(location.search);
    if (m && m[1]) { camp = decodeURIComponent(m[1]); sessionStorage.setItem(CAMP_KEY, camp); }
    else { camp = sessionStorage.getItem(CAMP_KEY) || ""; }
  } catch (e) { /* 시크릿 모드 등에서 막히면 이어 붙이기만 포기한다 */ }

  if (TRACK && camp && !campHere) {
    // 원래 쿼리 뒤에 이어 붙인다. `location.search` 가 `?` 한 글자만일 때도 있어
    // 물음표를 떼고 다시 조립한다(안 그러면 `?&utm_campaign=` 이 된다).
    var q = location.search.replace(/^\?/, "");
    var tagged = location.pathname + "?" + (q ? q + "&" : "") +
      "utm_campaign=" + encodeURIComponent(camp);
    // ① 실제 주소를 고친다 → Clarity 가 자기 눈으로 꼬리표를 본다.
    //    해시(`#unreal`)는 맨 뒤에 그대로 둔다 — 떼면 '이 대목 링크 복사'가 깨진다.
    //    history.state 도 넘겨 남의 상태를 지우지 않는다.
    try { history.replaceState(history.state, "", tagged + location.hash); } catch (e) {}
    // ② GoatCounter 에게도 같은 경로를 명시한다. ① 이 막힌 브라우저(드물다)에서도
    //    GoatCounter 쪽 집계는 살아남는다 — 두 줄이 서로의 보험이다.
    window.goatcounter = window.goatcounter || {};
    window.goatcounter.path = tagged;
  }

  // 1) 방문자 집계 (코드가 있을 때만) — 위치·유입·기기 정보는 GoatCounter가 자동 수집
  //    ※ 위 window.goatcounter 설정이 **이 스크립트를 붙이기 전에** 끝나야 한다.
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
