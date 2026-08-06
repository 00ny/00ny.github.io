# 이력 섹션 리뉴얼 — 노션 수준의 가독성·시각 요소 (구현 지시서)

> **✅ 구현 완료 (2026-07-18).** 이 문서는 이제 기획 이력이다. 실제 결과·판단은 CLAUDE.md §2-11 참조.
> 스킬은 §2 표 전량을 레벨바로 담았다(축약 없음). 데이터 수정은 `scratchpad/build_resume.py`의 표를 고쳐 재생성.
>
> **작성: 2026-07-18 (Fable, 기획 세션). 구현: 같은 날 (Opus).**
> 근거: 사용자가 노션 포트폴리오(Hyun Moment)의 학력·활동·수상·스킬 스크린샷과 우리 `#resume`를 비교 —
> "가독성과 시각적인 요소가 약하다." 이 문서는 그 격차의 **원인 진단 → Cinematic Dark 문법으로의 번역 → 실행 사양**이다.
> 마크업·CSS·데이터를 그대로 옮겨도 되게 썼다. 시각 확인 지점(§7)은 반드시 브라우저로 검증할 것.

---

## 0. 진단 — 노션이 이기는 5가지 (스크린샷 분석)

| # | 노션의 장치 | 우리의 현재 상태 | 격차의 본질 |
|---|---|---|---|
| 1 | **날짜 칩 컬럼** — 모든 항목이 mono 박스 칩(`26.06 ~ 26.07`)으로 시작, 왼쪽에 세로 스캔 축이 생김 | 날짜가 문장 끝 괄호에 묻힘 `(2026.06–07)` | 스캔 축 부재. 눈이 정렬할 기준선이 없다 |
| 2 | **스킬 레벨바** — 툴마다 세그먼트 바(▰▰▰▱)+`Lv.N` 배지, 카테고리 그룹, 2열 카드 | `기획·협업 — Figma · Notion…` 텍스트 나열 | **숙련도 정보가 통째로 소실**. 시각 리듬 0 |
| 3 | **핵심 항목 하이라이트** — 넥슨 메커톤·겜마루 기획부장·유니데브 대외협력부만 주황 강조 | 전 항목 동일 무게 | 위계 부재 — 어떤 항목이 중요한지 페이지가 말해주지 않음 |
| 4 | **수상 2열 그리드** — 🏆 + 굵은 텍스트로 한눈에 4건 | 한 줄에 `·`로 압축 | 가장 자랑할 정보가 가장 눌려 있음 |
| 5 | **볼륨** — 게임 활동 12건 전부 노출 | 대표 5건 요약 | 밀도 자체가 "활동량"의 증거인데 요약이 그걸 지움 |

**결론:** 문제는 다크 톤이 아니라 **컴포넌트 부재**다. 불릿 텍스트를 날짜칩·레벨바·그리드라는 구조물로 바꾸면 같은 내용이 다르게 읽힌다.

## 1. 방향 — 복제가 아니라 번역

노션을 그대로 베끼지 않는다. DESIGN_RENEWAL의 제약(다색 금지·장식 금지·액센트 10%) 안에서 같은 효과를 낸다.

| 노션 장치 | 우리 번역 | 이유 |
|---|---|---|
| 컬러 브랜드 아이콘 22개 | **아이콘 없음** — 레벨바+카테고리가 리듬을 만든다 | 다색 아이콘은 §2 금지 위반. 모노크롬 SVG 22개는 유지비만 큼 |
| 🎓🏆⭐ 이모지 카드 | 기존 `.resume__k` mono 라벨의 **세분화**(학력/자격증/활동/수상·장학/기술) | 시스템 일관성. 이모지는 Cinematic Dark의 절제와 충돌 |
| ▰▱ 문자 레벨바 | **CSS 세그먼트 바 10칸** (문자 글리프는 폰트 폴백이 불안정) | 렌더 일관성 + 토큰 색 제어 |
| 주황 하이라이트 다수 | **핵심 3건만** `--accent` (넥슨 메커톤 · 겜마루 기획부장 · 유니데브 대외협력부) | 액센트 절제 규칙(§3-1) |
| (없음) | **게임 엔진 = "프로젝트로 검증" 배지** — Unity 3D·MSW는 자기평가 레벨 대신 해당 프로젝트 페이지 링크 | 노션에 없는 우리만의 강점: 근거가 클릭 한 번 거리에 있다 |

## 2. 데이터 (노션 스크린샷 기준 — 이것이 원본이다)

### 학력
| 날짜 | 내용 |
|---|---|
| 2026.02 | 숭실대학교 IT글로벌미디어학부 졸업 |
| 2019.03 | 서울고등학교 이공계 졸업 |

### 자격증
| 날짜 | 내용 |
|---|---|
| 2024.12 | Adobe Premiere Pro 2023 |
| 2024.03 | 콘텐츠 기획관리사 1급 |
| 2024.03 | 홍보전략전문가 1급 |
| 2020.06 | Adobe Photoshop CC 2015 |

### 활동 — 게임 (★=하이라이트 3건)
| 날짜 | 내용 |
|---|---|
| 26.06 ~ 26.07 | ★ 넥슨 메커톤 |
| 26.05 ~ 26.12 | 스마일게이트 스토브크루 3기 |
| 25.12 ~ 26.02 | NC AI · Varco3D 크리에이터 1기 |
| 25.01 ~ 25.12 | ★ 게임제작 동아리 겜마루 기획부장 |
| 25.01 ~ 25.12 | ★ 게임제작 연합동아리 유니데브 대외협력부 |
| 24.05 ~ 25.05 | 졸업전시 프로젝트 「암흑의 여우숲」 |
| 24.05 ~ 24.08 | 겜마루 여름공모전 「여우사냥」 |
| 24.03 ~ 24.12 | 게임제작 동아리 겜마루 일반부원 |
| 24.11 (1일) | 컴투스 멘토링 스쿨 |
| 24.07 ~ 24.12 | 재활용 교육 게임 기획 「다 먹어요 펠리컨」 |
| 24.07 ~ 24.12 | 메타버스 게임 기획 「Lost Time」 |
| 21.07 ~ 21.12 | AR 콘텐츠 기획 「어린왕자 각색」 |

### 활동 — IT 서비스
| 날짜 | 내용 |
|---|---|
| 25.02 ~ 25.05 | 예비창업패키지 — 사업·서비스 기획 |
| 25.03 ~ 25.07 | 스냅비츠 화면 정의서 의뢰 — 서비스 기획 |

### 수상 (2열 그리드) / 장학
- 펄어비스 **최우수상** · 벨킨 코리아 **최우수상** · 카카오 **우수상** · WISH **장려상**
- 장학: 25.03 유당장학재단 · 25.10 제일하이텍재단 · 25.06 송영숙 교수

### 기술 (카테고리 · 이름 · 레벨 0~10)
| 카테고리 | 툴 (Lv) |
|---|---|
| 협업 | Notion 10 · Figma 10 · Slack 8 · Github 7 |
| 문서 | Google Sheet 9 · Power Point 9 · Word 9 · 한글 9 · Obsidian 8 |
| AI | Midjourney 9 · ImageFX 9 · Kling 8 · VEO3 8 |
| 영상 | VLLO 10 · Capcut 10 · Nuke 6 · Audition 5 |
| 디자인 | Canva 10 · Photoshop 7 |
| SNS | Instagram 10 · Youtube 9 · Naver Blog 9 |
| **게임 엔진** | Unity 3D → `foxforest.html` 링크 · MapleStory Worlds → `onepluone.html` 링크 (레벨바 대신 "프로젝트로 검증 →" 배지) |

정렬 원칙: 카테고리는 **협업을 맨 앞**(기획자 직무 관련도순), 각 카테고리 안은 레벨 내림차순.

## 3. 컴포넌트 사양 (style.css의 index 구역에 추가)

```css
/* ---------- 이력 아이템: 날짜 칩 + 내용 ---------- */
.ritem{display:flex; align-items:baseline; gap:14px; margin-bottom:9px}
.ritem:last-child{margin-bottom:0}
.rd{
  flex:none; min-width:118px; text-align:center;
  font-family:var(--font-mono); font-size:11.5px; font-weight:500; letter-spacing:.02em;
  color:var(--text-sub); background:rgba(255,255,255,.055);
  border:1px solid var(--border); border-radius:6px; padding:2px 9px;
}
.ritem .t{font-size:14.5px; line-height:1.65}
.ritem .t b{font-weight:600}
.ritem--hot .t{color:var(--accent-strong); font-weight:600}   /* 하이라이트 3건 전용 */
.rgroup{
  font-family:var(--font-mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase;
  color:rgba(255,255,255,.38); margin:18px 0 10px;
}
.rgroup:first-child{margin-top:0}

/* ---------- 수상 2열 그리드 ---------- */
.awards{display:grid; grid-template-columns:repeat(2,1fr); gap:8px 24px; margin-bottom:14px}
.award{font-size:14.5px}
.award b{font-weight:700}
.award .grade{color:var(--accent-strong); font-weight:700}   /* 최우수상 등 등급만 */

/* ---------- 스킬 카드 + 레벨바 ---------- */
.skills{display:grid; grid-template-columns:repeat(2,1fr); gap:10px 18px}
.skill{
  display:flex; align-items:center; gap:12px;
  background:var(--surface); border:1px solid var(--border); border-radius:9px;
  padding:11px 14px;
}
.skill .nm{font-size:13.5px; font-weight:600; flex:none; min-width:96px}
.skill .bar{flex:1; display:flex; gap:3px}
.skill .bar i{height:6px; flex:1; border-radius:2px; background:rgba(255,255,255,.08)}
.skill .bar i.on{background:rgba(255,255,255,.55)}
.skill .lv{
  flex:none; font-family:var(--font-mono); font-size:11px; font-weight:600;
  color:var(--text-sub); background:rgba(255,255,255,.055);
  border-radius:5px; padding:2px 7px;
}
/* 게임 엔진 — 레벨 대신 근거 링크 */
.skill--proof .lv{color:var(--accent-strong); background:rgba(233,138,60,.12)}
.skill--proof a{color:inherit; text-decoration:none}
.skill--proof:hover{border-color:var(--accent)}

@media(max-width:640px){
  .skills{grid-template-columns:1fr}
  .awards{grid-template-columns:1fr; gap:6px}
  .rd{min-width:104px; font-size:11px}
  .ritem{gap:10px}
}
```

**함정 경고(이 저장소 전례):** 새 규칙은 기존 `.resume__v` 계열 뒤에 추가할 것. 같은 특정도의 선언은 순서가 승부를 가른다.
레벨바 `i.on` 개수 = 레벨값. `<i>` 10개 중 앞 N개에 `class="on"`.

## 4. 마크업 — `#resume`의 교체 범위

**유지:** 섹션 골격, `.tag/h2/lede`, `이름`·`연락처` 두 행, `.resume` 150px 라벨 그리드.
**교체:** `학력` `경력 · 교육` `활동 · 수상` `기술 · 도구` 4개 행 → 아래 6개 행.

```html
<div class="resume__row">
  <div class="resume__k">학력</div>
  <div class="resume__v">
    <div class="ritem"><span class="rd">2026.02</span><span class="t">숭실대학교 IT글로벌미디어학부 졸업</span></div>
    <div class="ritem"><span class="rd">2019.03</span><span class="t">서울고등학교 이공계 졸업</span></div>
  </div>
</div>

<div class="resume__row">
  <div class="resume__k">자격증</div>
  <div class="resume__v">
    <div class="ritem"><span class="rd">2024.12</span><span class="t">Adobe Premiere Pro 2023</span></div>
    <div class="ritem"><span class="rd">2024.03</span><span class="t">콘텐츠 기획관리사 1급</span></div>
    <div class="ritem"><span class="rd">2024.03</span><span class="t">홍보전략전문가 1급</span></div>
    <div class="ritem"><span class="rd">2020.06</span><span class="t">Adobe Photoshop CC 2015</span></div>
  </div>
</div>

<div class="resume__row">
  <div class="resume__k">활동</div>
  <div class="resume__v">
    <div class="rgroup">게임</div>
    <div class="ritem ritem--hot"><span class="rd">26.06 ~ 26.07</span><span class="t">넥슨 메커톤</span></div>
    <div class="ritem"><span class="rd">26.05 ~ 26.12</span><span class="t">스마일게이트 스토브크루 3기</span></div>
    <div class="ritem"><span class="rd">25.12 ~ 26.02</span><span class="t">NC AI · Varco3D 크리에이터 1기</span></div>
    <div class="ritem ritem--hot"><span class="rd">25.01 ~ 25.12</span><span class="t">게임제작 동아리 겜마루 기획부장</span></div>
    <div class="ritem ritem--hot"><span class="rd">25.01 ~ 25.12</span><span class="t">게임제작 연합동아리 유니데브 대외협력부</span></div>
    <div class="ritem"><span class="rd">24.05 ~ 25.05</span><span class="t">졸업전시 프로젝트 「암흑의 여우숲」</span></div>
    <div class="ritem"><span class="rd">24.05 ~ 24.08</span><span class="t">겜마루 여름공모전 「여우사냥」</span></div>
    <div class="ritem"><span class="rd">24.03 ~ 24.12</span><span class="t">게임제작 동아리 겜마루 일반부원</span></div>
    <div class="ritem"><span class="rd">24.11 (1일)</span><span class="t">컴투스 멘토링 스쿨</span></div>
    <div class="ritem"><span class="rd">24.07 ~ 24.12</span><span class="t">재활용 교육 게임 기획 「다 먹어요 펠리컨」</span></div>
    <div class="ritem"><span class="rd">24.07 ~ 24.12</span><span class="t">메타버스 게임 기획 「Lost Time」</span></div>
    <div class="ritem"><span class="rd">21.07 ~ 21.12</span><span class="t">AR 콘텐츠 기획 「어린왕자 각색」</span></div>
    <div class="rgroup">IT 서비스</div>
    <div class="ritem"><span class="rd">25.02 ~ 25.05</span><span class="t">예비창업패키지 — 사업·서비스 기획</span></div>
    <div class="ritem"><span class="rd">25.03 ~ 25.07</span><span class="t">스냅비츠 화면 정의서 의뢰 — 서비스 기획</span></div>
  </div>
</div>

<div class="resume__row">
  <div class="resume__k">수상 · 장학</div>
  <div class="resume__v">
    <div class="awards">
      <div class="award"><b>펄어비스</b> · <span class="grade">최우수상</span></div>
      <div class="award"><b>카카오</b> · <span class="grade">우수상</span></div>
      <div class="award"><b>벨킨 코리아</b> · <span class="grade">최우수상</span></div>
      <div class="award"><b>WISH</b> · <span class="grade">장려상</span></div>
    </div>
    <div class="ritem"><span class="rd">25.03</span><span class="t">유당장학재단 장학생</span></div>
    <div class="ritem"><span class="rd">25.06</span><span class="t">송영숙 교수 장학생</span></div>
    <div class="ritem"><span class="rd">25.10</span><span class="t">제일하이텍재단 장학생</span></div>
  </div>
</div>

<div class="resume__row">
  <div class="resume__k">게임 엔진</div>
  <div class="resume__v">
    <div class="skills">
      <a class="skill skill--proof" href="projects/foxforest.html">
        <span class="nm">Unity 3D</span><span class="lv">프로젝트로 검증 →</span></a>
      <a class="skill skill--proof" href="projects/onepluone.html">
        <span class="nm">MapleStory Worlds</span><span class="lv">프로젝트로 검증 →</span></a>
    </div>
  </div>
</div>

<div class="resume__row">
  <div class="resume__k">기술 · 도구</div>
  <div class="resume__v">
    <div class="rgroup">협업</div>
    <div class="skills">
      <!-- 패턴: <i>×10, 앞 N개에 class="on" -->
      <div class="skill"><span class="nm">Notion</span><span class="bar"><i class="on"></i>…</span><span class="lv">Lv.10</span></div>
      <div class="skill"><span class="nm">Figma</span> …Lv.10</div>
      <div class="skill"><span class="nm">Slack</span> …Lv.8</div>
      <div class="skill"><span class="nm">Github</span> …Lv.7</div>
    </div>
    <div class="rgroup">문서</div>
    <div class="skills"> Google Sheet 9 · Power Point 9 · Word 9 · 한글 9 · Obsidian 8 </div>
    <div class="rgroup">AI</div>
    <div class="skills"> Midjourney 9 · ImageFX 9 · Kling 8 · VEO3 8 </div>
    <div class="rgroup">영상</div>
    <div class="skills"> VLLO 10 · Capcut 10 · Nuke 6 · Audition 5 </div>
    <div class="rgroup">디자인</div>
    <div class="skills"> Canva 10 · Photoshop 7 </div>
    <div class="rgroup">SNS</div>
    <div class="skills"> Instagram 10 · Youtube 9 · Naver Blog 9 </div>
  </div>
</div>
```

> 스킬 마크업 축약분은 구현 시 Notion 패턴(§2 표)대로 전부 풀어 쓴다. `<i>` 10개 반복이 장황하므로
> **구현 스크립트로 생성**하는 걸 권장: scratchpad에서 파이썬으로 `(이름, 레벨)` 표 → HTML 문자열 생성 후 삽입.
> 런타임 JS 생성은 금지(no-JS에서 레벨바가 사라진다).

## 5. lede 문구 교체

현재 "대표 항목 선별" 전제의 문구를 볼륨 반영으로 교체:

```
게임 기획을 향해 쌓아온 활동·수상·기술입니다. 최신 순으로 정렬했고, 강조 표시는 핵심 활동입니다.
```

## 6. 영향 범위 (건드리지 말 것)

- `이름`·`연락처` 행, `.resume` 그리드 골격, 목차 앵커 `#resume` — 불변
- 프로젝트 페이지·셸·캐러셀 — 무관 (index 전용 CSS 추가만)
- 기존 `.resume__v ul` 규칙은 남겨둔다(다른 페이지 미사용 확인됨, 지워도 되지만 불필요한 리스크)

## 7. 검증 체크리스트 (구현 세션)

1. 데스크톱 1280px: 날짜 칩 세로 정렬 축 형성(min-width 통일 확인), 하이라이트 3건만 엠버.
2. 스킬 레벨바: `on` 개수 = §2 표의 레벨값 (22종 전수 대조 — 스크립트 생성이면 표에서 직접 검증).
3. 게임 엔진 2카드 클릭 → 해당 프로젝트 페이지 이동.
4. 390px: `.skills` 1열, `.awards` 1열, 날짜 칩 줄바꿈 없이 유지, **가로 스크롤 0**(기존 프로브 스크립트).
5. 대비: `.rd`(11.5px sub on .055 bg)·`.lv`·`.rgroup` — 본문이 아닌 보조 라벨이므로 AA 큰글씨 기준 대비 확인, 미달 시 `--text-sub` 상향.
6. 콘솔 0, 참조 HTTP 200(신규 링크 2건 포함).
7. **도구 함정(전례):** 스크린샷은 스크롤 영역을 못 잡는다 — `__iso` 기법으로 #resume만 최상단 노출 후 캡처. CSS 캐시는 `?v=` 버스팅. 가상 마우스 hover 잔류 주의.
8. 완료 후 CLAUDE.md §2-11 기록 + 본 문서 상태를 "구현 완료"로 갱신.

## 8. 사용자 확인 항목 (구현 후 보고에 포함)

1. **볼륨 확대** — 이전 "대표 선별" 결정을 뒤집고 게임 활동 12건 전부 노출했다. 줄이려면 `.ritem` 행 삭제만 하면 된다.
2. **하이라이트 3건 선정**(넥슨 메커톤·겜마루 기획부장·유니데브 대외협력부 — 노션의 강조를 따름). 바꾸려면 `ritem--hot` 이동.
3. **툴 아이콘 없음** 결정 — 원하면 simple-icons 모노크롬(단색) 옵션 있음. 컬러 아이콘은 디자인 시스템과 충돌이라 비추천.
4. 스킬 레벨 수치는 노션 자기평가 그대로 — 수정 원하면 §2 표만 고쳐서 재생성.
