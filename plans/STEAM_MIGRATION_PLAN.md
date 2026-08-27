# Steam 테마 이관 설계서 — 관리자 동기화를 전제로

> 2026-08-28 작성. 발주 원문:
> **"이제 관리자와의 동기화를 고려하여 이관을 준비한다. 즉, 사이트를 지금 화면으로 입혀도 — 망가지지 않도록, 관리자와의 연결을 고려해라."**
>
> 대상: `mockups/home-steam.html`(Steam 라이브러리 테마) → 실사이트.
> 관련 문서: [STEAM_THEME_PLAN.md](STEAM_THEME_PLAN.md) · `CLAUDE.md` §2-24(마커 규칙) · §2-27(마커 18쌍) · §2-28(마커 19쌍·교훈).
> **이 문서는 설계서다. 구현은 별도 승인 후.**

---

## 0. 조사에서 나온 결정적 사실 4개

이관안 전체가 이 4개 위에 서 있다. 먼저 읽을 것.

### 0-1. ★ 목업은 **현재 `index.html` 을 iframe 으로 먹고 있다**

`mockups/home-steam.html` 의 내비 탭 4개(`라이브러리 / 배현 / 유튜브 / 게임 리뷰 / 플레이 이력` 중 뒤 4개)는
자체 구현이 아니라 **기존 index 섹션을 same-origin iframe 으로 띄운다.**

```
vSiteResume   iframe data-src="../index.html#resume"
vSiteYoutube  iframe data-src="../index.html#youtube"
vSiteAnalysis iframe data-src="../index.html#analysis"
vSitePlay     iframe data-src="../index.html#play"
vProfile      a href="../index.html#resume"  (전체 이력서 →)
```

게다가 `armFrame()` 은 iframe 안에서 `gateYes` 버튼을 눌러 방지턱을 열고 `scrollIntoView` 로 앵커에 착지시킨다 —
**index.html 의 내부 구조(gate·scroll-margin-top)에 의존하는 코드다.**

→ **Steam 을 그대로 `index.html` 로 올리면 iframe 이 자기 자신을 가리킨다.**
즉 "index 를 Steam 으로 교체" 는 **기존 index 를 다른 파일명으로 살려 두는 것과 한 몸**이다. 선택이 아니라 전제다.

이것이 오히려 이관을 **안전하게** 만든다 — 아래 0-2.

### 0-2. 마커 19쌍은 "이사"하면 되고, "재설계"할 필요가 없다

현재 `index.html` 의 마커 19쌍 전부가 **기존 페이지와 함께 새 파일로 통째로 이사**한다.
렌더러·시드·필드 스펙은 **한 줄도 안 바뀐다.** 바뀌는 것은 관리자가 여는 **파일 이름 하나**다.

```ts
// publish.service.ts (현재)
const indexPath = path.join(PORTFOLIO_DIR, 'index.html');
```

→ 이 라운드는 `verify_publish.sh` 의 **바이트 동일 게이트를 그대로 통과할 수 있다.**
구조가 바뀌는 이관에서 "완료의 증거"를 잃지 않는 유일한 경로다.

### 0-3. 목업은 공용 자산을 하나도 안 쓴다 (완전 독립 단일 파일)

`mockups/home-steam.html` 안에 `assets/style.css` · `smooth-scroll.js` · `analytics.js` · `guard.js` ·
`shellnav.js` · `shotlb.js` · `docviewer.js` 참조가 **0건**이고, `ADMIN:` 마커도 **0쌍**이다.
CSS·JS·SVG 아이콘이 전부 파일 안에 인라인이다.

→ 공용 자산과의 **충돌 위험이 사실상 없다.** 대신 반대 문제가 생긴다:
`analytics.js`(방문 집계·최근 push) 와 `guard.js`(이미지 우클릭 보호) 가 새 첫 화면에서 **빠진다.**
→ 이관 때 **의도적으로 다시 붙여야 한다**(§4 R2). 붙이는 순간 `?v=` 규칙(CLAUDE.md §4 ★)이 발동한다.

### 0-4. 누크발은 DB 에 **있다**. 없는 것은 '카드' 뿐이다

발주서의 "누크발이 DB에 없는 문제"는 정확히는 이렇다 — `seed-data.ts` 에 `crimson-balrog` 행이 **존재**하고,
`carouselHtml` 은 차 있고 **`cardHtml` 이 빈 문자열**, `area:"none"` 이다.
`unreal-level` 은 둘 다 비어 있고 `area:"none"`(체인·상단바 전용).

| slug | area | carouselHtml | cardHtml | 지금 index 에서 |
|---|---|---|---|---|
| crimson-balrog | none | ○ | ✕ | 쇼케이스 캐러셀에만 |
| unreal-level | none | ✕ | ✕ | 어디에도 없음(`#unreal` 은 `.ucta` 정적 링크) |
| 나머지 6 | built/reverse/proposal | ○ | ○ | 캐러셀 + 카드 |

**Steam 화면은 이 둘을 1급 시민으로 승격시킨다** — 사이드바 8항목·그리드 8장·상세 8종에 전부 들어간다.
즉 이관은 `area:"none"` 두 건의 **데이터 공백을 메우는 작업을 포함한다.** 새 컬럼이 필요한 이유의 절반이 여기다.
(단 `renderFootCounts` 는 `kind` 로 세므로 누크발은 이미 푸터 카운트에 잡힌다 — 건드리지 말 것.)

---

## 1. 이관안 비교 — 4안

| | **A. 승격 + 보존**<br>Steam→index, 기존→`sections.html` | **B. 별도 진입점**<br>Steam=`library.html`, index 유지 | **C. 껍데기만 교체**<br>index 한 파일에 Steam 프레임 + 기존 섹션 | **D. 리다이렉트**<br>index=이동 스텁 |
|---|---|---|---|---|
| 사용자 의도 부합 | ◎ 첫 화면이 Steam | △ 한 단계 더 눌러야 함 | ◎ | ○ |
| iframe 자기참조(0-1) | 해결(대상이 다른 파일) | 애초에 없음 | **불가** — iframe 이 사라지고 4탭을 SPA 로 재구현해야 함 | 해결 |
| 마커 19쌍 | **그대로 이사**, 렌더러 무변경 | 무변경 | **전면 재배치** — 19쌍이 Steam 뷰 안으로 흩어짐 | 무변경 |
| 바이트 검증 유지 | ◎ (파일명만 다름) | ◎ | ✕ 불가 | ◎ |
| 관리자 변경 규모 | 상수 1 + 백업/검증 경로 + 신규 마커 | 신규 마커만 | 렌더러 대부분 재작성 | 상수 0 |
| 최악 시 복구 | **파일 2개 되돌리기**(git revert 1커밋) | 링크 1줄 제거 | 통째로 되돌리기 — 중간 상태 없음 | 스텁 삭제 |
| 잔여 부채 | 페이지 2개 유지 | 홈이 둘 = 정체성 분열 | 단일 파일(장점) | SEO·앵커 손해, 화면 깜빡임 |
| 중간 상태에서 사이트 생존 | ◎ 라운드마다 생존 | ◎ | ✕ 전부 아니면 전무 | ○ |

### 권장: **A안 (승격 + 보존)**

근거 셋.

1. **되돌리기가 파일 이름 스왑이다.** 사고가 나면 `git revert` 한 커밋 + 관리자 상수 한 줄로 원상복구된다.
   §2-17(루시 테마)에서 "파일 삭제 = 완전 복원"을 실증한 그 성질을 이관 전체에 적용한 것이다.
2. **바이트 게이트를 잃지 않는다.** 구조가 바뀌는 작업에서 "안전하다"는 판정을 계속 기계로 낼 수 있다.
3. **기존 페이지는 짐이 아니라 부품이다.** Steam SPA 는 이력서·스킬·유튜브·플레이·리뷰를 **재구현하지 않고 iframe 으로 빌려 쓴다**(0-1).
   기존 페이지를 지우면 그 4탭이 죽는다. 즉 A안은 "옛것을 못 버려서" 가 아니라 **목업 설계가 그것을 요구해서** 나온 결론이다.

C안(단일 파일)이 이론적으로 가장 깨끗하지만, 4탭 재구현 + 마커 19쌍 재배치 + 바이트 게이트 상실이 한 라운드에 몰린다.
"중간 상태에서도 사이트가 살아 있게" 라는 발주 요건과 정면으로 충돌한다. **기각.**
B안은 안전하지만 "지금 화면으로 입혀도" 라는 원문에 미달한다. **A안 실패 시의 후퇴선으로만 보관.**

> **A안의 부산물**: `sections.html` 은 그 자체로 유용하다 — "전체 문서를 한 화면에서 스크롤로 훑기" 는
> 채용 담당자가 실제로 하는 행동이고, PDF·인쇄에도 그쪽이 낫다. Steam 홈 하단 상태 띠나 `배현 ▾` 드롭다운에
> `전체 페이지로 보기` 한 줄을 두면 정체성 분열 없이 공존한다.

---

## 2. 마커 대응표 (현재 19쌍 → 이관 후)

### 2-1. 이사 — 19쌍 전부 (파일만 바뀜, 내용·이름·렌더러 무변경)

| 마커 | 소유 대상 | 이관 후 위치 |
|---|---|---|
| `HERO_STATS` | 첫 화면 좌측 요약 이력(스탯 타일 + 이력 줄) | sections.html (그대로) |
| `HERO_BUTTONS` | 첫 화면 우측 직군별/엔진별 버튼 7행 | sections.html (그대로) |
| `UPDATE_NOTE` | 사이 띠 알림 칩 | sections.html (그대로) |
| `CAROUSEL` / `CAROUSEL_BG` | `#showcase` 3D 캐러셀 카드·배경 에코 | sections.html (그대로) |
| `PROJECTS_REVERSE` / `_PROPOSAL` / `_BUILT` | 섹션별 프로젝트 카드 | sections.html (그대로) |
| `FOOT_COUNTS` | 푸터 "제작 N · 역기획서 N …" | sections.html (그대로) |
| `UNREAL` | `#unreal` 맵 카드(**현재 비어 있음**) | sections.html (그대로) |
| `REVIEWS` | `#analysis` 리뷰 카드 4장 | sections.html (그대로) |
| `SKILLS` | `#skills` 레벨바 | sections.html (그대로) |
| `RESUME_GAME/_AWARDS/_IT/_EXTRA/_EDU` | 이력서 벤토 5칸 | sections.html (그대로) |
| `PLAY` (js) | `PLAY_GAMES` 데이터 | sections.html (그대로) |
| `YT` (js) | `YT_VIDEOS` 데이터 | sections.html (그대로) |

**삭제 0쌍. 자리 이동 0쌍(파일 내 위치 불변). 유지 19쌍.**
발주서가 우려한 "HERO_BUTTONS 소멸" 은 A안에서 **일어나지 않는다** — 그 마커는 sections.html 에 살아 있다.
(Steam 홈이 안정화되고 사용자가 sections.html 축소를 결정하면 그때 은퇴시킨다. §7 결정 5.)

`analytics.js` 의 `GC_CODE` · `CLARITY_ID` 2쌍은 파일이 안 바뀌므로 무영향.

### 2-2. 신설 — Steam `index.html` 에 들어갈 마커 8쌍 (제안)

**모두 `replaceRegionOptional` 로 배선한다** — 마커가 아직 없어도 반영 전체가 실패하지 않고 `skippedRegions` 로 드러난다.
(§2-28 의 `UPDATE_NOTE`·`CLARITY_ID` 가 쓴 그 방식. 관리자와 포트폴리오가 따로 배포되는 구조라 필수다.)

| 신설 마커 | 소유 대상 | 데이터 출처 | 우선순위 |
|---|---|---|---|
| `STEAM_STATUS` | 바닥 상태 띠 `라이브 2 · 프로젝트 8 · 최근 업데이트` | projects + 설정 | 1 (가장 단순) |
| `STEAM_UPDATES` | 「새로운 업데이트」 3카드 + 🔔 드롭다운 | `midstrip_note` 항목 **재사용** | 2 |
| `STEAM_SIDEBAR` | 좌측 목록 전체(즐겨찾기·제작·역기획서·제안서·리뷰 그룹) | projects + `review` | 3 |
| `STEAM_SHOWCASE` | 전시대 `sc-card` 카드 | projects (신규 verbatim 컬럼) | 4 |
| `STEAM_GRID` | 「모든 프로젝트」 `gc` 카드 8장 | projects (신규 verbatim 컬럼) | 5 |
| `STEAM_DETAILS` | 상세 뷰 8종 `.view.dv` | projects (신규 verbatim 컬럼) | 6 (가장 큼) |
| `STEAM_REVIEWS` (js) | `REVIEWS` 객체 4건 | `review` 항목 **재사용** | 7 |
| `STEAM_PROFILE` | 프로필 뷰 스탯 타일 + 기록 줄 | `hero_stat` · `hero_edu` **재사용** | 8 |

**한 데이터, 두 출력.** `midstrip_note` · `review` · `hero_stat` · `hero_edu` 는 **같은 DB 항목이 두 파일에 서로 다른 모양으로** 나간다.
관리자에서 한 번 고치면 sections.html 의 카드와 Steam 의 칩이 함께 갱신된다 — 이게 "동기화를 고려한 이관" 의 실질이다.
새 섹션·새 입력 폼을 만들지 않는다.

### 2-3. 마커를 **두지 않을** 것 (의도적)

| 대상 | 이유 |
|---|---|
| 상세의 `제작 여정` 피드 · `노트 MINE/NOT MINE` · `내 평가` 산문 | 거의 안 바뀐다. 마커에 넣으면 편집 폼이 산문 수십 줄을 textarea 로 삼킨다. `card-fields.ts` 의 설계 판단(§2-28 ⑦) 그대로 — **모르는 마크업을 건드리지 않는다** |
| 입장 연출 · 프레임(상단바·내비·필터 패널) | 디자인이지 콘텐츠가 아니다 |
| 내비 탭 4개의 iframe src | 구조다. 바뀌면 코드가 바뀌어야 한다 |
| 방명록 모달 UI | 수신처 URL 만 설정값(§4 R5) |

---

## 3. 관리자 변경 목록 (파일·함수 단위)

### 3-1. 필수 · 소규모 (R1 에서 즉시)

| 파일 | 변경 |
|---|---|
| `backend/src/publish/publish.service.ts` | `const indexPath = path.join(PORTFOLIO_DIR, 'index.html')` → **`SECTIONS_FILE` 상수**(기본 `sections.html`, env 로 덮어쓰기 가능) |
| `backend/src/publish/publish.service.ts` `backup()` | ★ **`index.html` 이름을 하드코딩**해 복사한다 → `sections.html` + 새 `index.html` **둘 다** 백업. 안 고치면 이관 직후부터 조용히 백업 밖으로 떨어진다 |
| `scripts/verify_publish.sh` | 사본 뜰 때 `sections.html` 추가 복사 + `.orig` 비교 대상 추가 |
| `scripts/extract_seed.py` | `SRC = open(.../'index.html')` → `sections.html`. 이후 R4 에서 Steam 파일용 **두 번째 소스**(`SRC2`) 추가 |
| `frontend/lib/xref.ts` | 경로 라벨에 `/sections.html → 전체 페이지` 추가(GoatCounter·Clarity 화면에서 새 경로가 "알 수 없음" 으로 뜨는 것 방지) |

### 3-2. R3~R4 · 데이터 모델

`app.module.ts` 가 `synchronize: true` 라 **컬럼 추가는 마이그레이션 없이 자동 반영된다**(삭제·개명은 아님 — 추가만 할 것).

**`backend/src/projects/project.entity.ts` 추가 컬럼**

```ts
// Steam 사이드바
favorite: boolean       // 즐겨찾기 (원쁠원 · 33원정대)
cat: string             // 'build' | 'rev' | 'prop'  — 색 규약(RULE 2)
sideTag: string         // 한 단어 직군: 퀘스트/레벨/캐릭터/전투/룰/통합  (우측 정렬 태그)
sideLabel: string       // 사이드바 표기(게임명). 비면 title
filterTags: string      // 'make msw live' 처럼 공백 구분 — 필터 패널이 쓴다
steamSort: number       // 사이드바·그리드 순서 (sort/areaSort 와 또 다르다 — §2-27 ⑧ 의 교훈)

// Steam verbatim 마크업 (cardHtml/carouselHtml 과 같은 방식)
sideHtml: string        // 사이드바 <a class="sit"> 한 줄
gridHtml: string        // 「모든 프로젝트」 <a class="gc">
showcaseHtml: string    // 전시대 <article class="sc-card">   ★ cr-card 와 마크업이 다르다 — 재사용 불가
detailHtml: string      // 상세 뷰 <div class="view dv">  전체
```

> **왜 또 verbatim 인가.** `card-fields.ts` 상단 주석의 설계 판단이 그대로 유효하다 —
> ⓐ 바이트 정합이 공짜 ⓑ 프론트가 상세에 새 요소를 넣어도 관리자가 지우지 않는다 ⓒ 마이그레이션 불필요.
> **필드→마크업 재생성 방식은 쓰지 말 것.** 상세 8종은 분류마다 칸 구성이 다르고(RULE 2), 산문이 길다.
> 재생성이면 반영 한 번에 산문이 사라지고 그게 **자동 배포로 실사이트에 나간다.**

**`backend/src/projects/steam-fields.ts` (신규)** — `card-fields.ts` 의 쌍둥이.
`parseSteamFields()` / `applySteamFields()` 로 `detailHtml` 안의 편집 대상만 정밀 치환:

| 필드 | 정규식이 잡을 자리 | 분류 |
|---|---|---|
| `genre` | `<dt>게임 장르</dt><dd>…</dd>` | 공통 |
| `funCore` | `<dt>핵심 재미</dt><dd>…</dd>` | 공통 |
| `myRole` | `<dt>나의 역할</dt><dd>…</dd>` | 제작 |
| `playHistory` | `<dt>플레이 이력</dt><dd>…</dd>` / `.dm` 플레이 칸 | 역기획·제안·리뷰 |
| `focusTask` | `<dt>내가 집중한 과제</dt><dd>…</dd>` | 역기획·제안 |
| `dmScale` `dmEngine` `dmStatus` | `.dact .dm` 3칸 | 제작 |
| `heroImg` `heroAlt` `heroCap` `heroQuote` | `.dhero` | 공통 |
| `goHref` `goLabel` | `.dgo` (`기획서/역기획서/제안서 상세 열기`) | 공통 |

`applySteamFields` 는 `card-fields.ts` 와 동일하게 **왕복 자기검사**를 붙인다(넣은 값이 다시 읽히는지 확인, 어긋나면 `warnings`).

**`backend/src/items/item.entity.ts`** — 컬럼 변경 없음. `data` 가 jsonb 라 **필드만 추가**하면 된다:
- `review` 항목: `hook`(사이드바 후크 제목) · `play`(플레이 시간) · `img`(파일명) 추가
- `midstrip_note` 항목: 변경 없음 — 그대로 Steam 업데이트 카드로 렌더

**`frontend/lib/sections.ts`** — ★ **스펙에 없는 필드는 편집 폼이 저장 시 통째로 버린다**(§2-28 ⑦, `width="undefined"` 사고).
위에서 추가한 `review` 3필드와 프로젝트 신규 필드를 **반드시 스펙에 등재할 것.** 이걸 빼먹으면 첫 편집에서 값이 증발한다.

**`backend/src/publish/renderers.ts` 신규 함수 8개** — 전부 얇다:

```ts
renderSteamStatus(projects, settings)     // 상태 띠 한 줄
renderSteamUpdates(notes)                 // midstrip_note → .ncard 3장 + 🔔 목록
renderSteamSidebar(projects, reviews)     // 그룹 헤더 + sideHtml join + 개수 자동 계산
renderSteamShowcase(projects)             // showcaseHtml join
renderSteamGrid(projects)                 // gridHtml join
renderSteamDetails(projects)              // detailHtml join
renderSteamReviews(reviews)               // JS 객체 리터럴 (renderPlayData 와 같은 꼴)
renderSteamProfile(heroStats, heroEdu)    // .pv-st 타일 + .pv-l 줄
```

`renderCarousel` 과 같은 함정을 그대로 밟는다 — **빈 문자열 블록을 걸러내지 않고 join 하면 `\n\n` 이 남아 바이트 비교가 깨진다.** 전부 `.filter(h => h.trim() !== '')` 를 붙일 것.

### 3-3. 신규 안전장치 (권장 · R4 전에)

**`assertSane(html, kind)`** — `publish.service.ts` 의 파일 쓰기 **직전**에 호출.

```
① 길이가 직전 파일의 60% 미만이면 throw
② 필수 센티널 전부 존재:  Steam → id="slist" · id="vHome" · </html>
                          sections → id="resume" · id="showcase" · </html>
③ ADMIN 마커 START/END 개수가 짝이 맞는지
```

publish 는 이미 **모든 치환을 메모리에서 끝내고 마지막에 한 번 쓰는** 구조다(§2-27 ⑥).
그 성질 덕에 예외가 나도 파일은 무손상이다 — **이 성질을 깨지 말 것.** `assertSane` 은 그 성질 위에 얹는 마지막 그물이다.

**`scripts/check_steam_sync.mjs`** (신규, `check_youtube_sync.mjs` 의 형제) — 구조 어서션(§5-3).

---

## 4. 이관 라운드 — 7단계

원칙: **모든 중간 상태에서 사이트가 살아 있다.** 각 라운드는 독립 커밋이고, 롤백은 그 커밋 하나를 되돌리는 것이다.

### R0 — 준비 (사이트 변화 0)

- 포트폴리오·관리자 양쪽에 **git 태그** `pre-steam` 를 찍는다. 최종 후퇴선.
- 관리자 설정에서 **`gh_token` 을 비운다** → `deploy()` 가 `no_token` 으로 빠져 **자동 커밋·푸시가 꺼진다.**
  ★ 이관 기간 내내 유지. 지금 구조는 **반영 = 즉시 실사이트 배포**라, 중간 상태의 실수가 그대로 공개된다.
  토큰 값은 사용자가 따로 보관(§7 결정 4).
- `verify_publish.sh` 를 **현재 상태로 1회 통과**시켜 기준선을 만든다(통과 안 되면 이관 시작 금지).
- 롤백: 없음(무변화).

### R1 — 승격 + 보존 · **바이트 게이트가 살아 있는 유일한 라운드**

포트폴리오:
```
git mv index.html sections.html          # 히스토리 보존
cp mockups/home-steam.html index.html    # 목업을 새 첫 화면으로
```
관리자: §3-1 의 5개 파일 변경(상수·backup·verify·extract_seed·xref).

이 시점의 사이트: Steam 홈이 뜨지만 **경로가 전부 `../` 라 이미지·링크가 깨진 상태**다(R2 에서 고친다).
`sections.html` 은 완전히 정상. 관리자 반영은 `sections.html` 만 쓰고 **새 index 를 절대 건드리지 않는다**(마커 0쌍).

- **검증**: `scripts/verify_publish.sh --reseed` → `sections.html` **바이트 동일**.
  파일 이름만 달라졌으므로 이전과 똑같이 통과해야 한다. 통과 못 하면 R1 을 되돌리고 원인부터 잡는다.
- **롤백**: `git revert` 1커밋 + 관리자 상수 되돌리기. 5분.

### R2 — 경로·연결 정리 (Steam 이 실제로 동작하기 시작)

1. `../assets/` → `assets/` · `../projects/` → `projects/` 전량 치환.
2. **iframe 4개 + 프로필 링크**: `../index.html#resume` → `sections.html#resume` (4탭 + `전체 이력서 →`).
   ★ 이 5곳을 놓치면 **iframe 이 자기 자신을 로드해 무한 중첩된다.** 이관 최대 지뢰.
3. 공용 스크립트 재부착 — **필요한 것만**:
   - `assets/analytics.js?v=` **붙인다** → 방문 집계 + `#lastUpdate` 자동 채움.
     ★ 보너스: Steam 상태 띠의 `최근 업데이트 2026.08.28` 하드코딩을 `<span id="lastUpdate">` 로 바꾸면 **analytics.js 가 공짜로 채운다**(GitHub API 마지막 push). 손 관리 항목이 하나 줄어든다.
   - `assets/guard.js?v=` **붙인다** → 이미지 우클릭 보호(§2-23).
   - `smooth-scroll.js` · `shellnav.js` · `shotlb.js` · `docviewer.js` **붙이지 않는다** — SPA 가 자체 스크롤·전환을 갖고, 프로젝트 페이지 전용 부품이다.
4. **`?v=` 갱신** — 공용 자산을 건드렸다면 8개 HTML 전부 그날 날짜로(CLAUDE.md §4 ★, 캐시 사고 전례 4회).
5. **레거시 해시 브리지**(권장): 외부에 뿌려진 `00ny.github.io/#resume` 류를 살린다.
   `show()` 진입부에서 `resume→site-resume` · `youtube→site-youtube` · `analysis→site-analysis` · `play→site-play` ·
   `projects/reverse/proposal/skills/links/tension/unreal → sections.html#<원래>` 로 매핑.
   지금은 `known()` 이 false 라 **조용히 홈으로 떨어진다** — 링크가 죽은 티도 안 난다.
6. `mockups/home-steam.html` 은 **남겨 둔다**(gitignore 라 배포 안 됨). 시안 원본이자 대조군.

- **검증**: 링크·이미지 전수 200 · 콘솔 0 · SPA 라우팅 전수(상세 8 + 리뷰 4 + 탭 4 + 프로필) · 4뷰포트(375·760·1280·1920) 가로 스크롤 0 · iframe 4개 앵커 착지 · 리뷰 iframe(스토브) 실도메인에서 XFO 확인.
- **롤백**: R2 커밋 revert(사이트는 R1 상태 = Steam 깨짐 + sections 정상). 실무적으로는 **R1+R2 를 한 쌍으로 되돌리는 것이 낫다.**
- 관리자: **무접촉.** 반영은 여전히 sections.html 만 쓴다 → 이 라운드에서 관리자가 사이트를 망가뜨릴 수 없다.

### R3 — 데이터 모델 확장 (관리자만 · 사이트 변화 0)

- `project.entity.ts` 신규 컬럼(§3-2) 추가. `synchronize: true` 라 자동 생성.
- `sections.ts` 에 신규 필드 등재(★ 빼먹으면 편집 시 증발).
- `extract_seed.py` 에 **두 번째 소스**(Steam index) 추가 — 사이드바·그리드·전시대·상세를 slug 로 갈라 각 프로젝트 행에 넣는다.
  기존 어서션 정신을 승계해 새 어서션을 건다: 사이드바 항목 수 = 프로젝트 8 + 리뷰 4 / 상세 뷰 id 집합 = `VIEWS` 키 집합.
- 시드 재추출 → DB 재적재.
  ★ **병렬 에이전트 금지** — 같은 DB·같은 `--reseed` 를 공유한다(전역 규칙 + §2-28 ⑫).
- **검증**: `verify_publish.sh --reseed` → `sections.html` 여전히 **바이트 동일**. Steam index 는 아직 마커가 없어 무접촉.
- **롤백**: 관리자 커밋 revert + `pre-steam` 시드로 재적재. 컬럼은 남아도 무해(아무도 안 읽음).

### R4 — 마커 주입 · **2~3쌍씩** (§2-15 의 교훈: 한 위임에 3~4건)

우선순위 순으로 쪼갠다. 각 묶음이 독립 커밋.

| 라운드 | 마커 | 왜 이 순서 |
|---|---|---|
| R4a | `STEAM_STATUS` · `STEAM_UPDATES` | 가장 작다. 배선 자체를 먼저 증명한다 |
| R4b | `STEAM_SIDEBAR` · `STEAM_SHOWCASE` | 목록형. verbatim join 패턴 검증 |
| R4c | `STEAM_GRID` · `STEAM_DETAILS` | 가장 크다. 앞 둘이 통과한 뒤에만 |
| R4d | `STEAM_REVIEWS` · `STEAM_PROFILE` | JS 데이터 + 재사용 항목 |

각 묶음의 절차: **마커 삽입 → `replaceRegionOptional` 로 배선 → 시드 재추출 → 사본 publish → 바이트 동일 확인.**
시드를 현재 마크업에서 뽑았으므로 **바이트 동일이 나와야 정상이다.** 안 나오면 렌더러가 틀린 것.

- **롤백(라운드별)**: 포트폴리오에서 해당 마커 쌍만 제거 → `replaceRegionOptional` 이 조용히 건너뛰고 `skippedRegions` 에 뜬다.
  **사이트는 마커 안 내용을 그대로 유지한 채 살아 있다.** 이것이 Optional 을 쓰는 이유다.

### R5 — 방명록 수신처 연결

- `analytics.js` 의 `GC_CODE` 와 **같은 패턴**: `/* ADMIN:GUESTBOOK_URL START */ var GB=""; /* … END */` 한 줄 마커.
- 설정 `guestbook_url` 을 publish 가 채운다. 비면 모달이 "아직 연결 안 됨" 토스트(현재 목업 동작 유지) — graceful.
- 수신 방식 A(Google Forms 숨은 POST) / B(Formspree) 는 사용자 결정(§7).
- 롤백: 설정값 비우기.

### R6 — 정리 · 은퇴 판단

사용자 결정(§7-5)에 따라:
- `sections.html` 유지 → 끝. (권장)
- 축소 → `HERO_STATS`/`HERO_BUTTONS`/`CAROUSEL*`/`PROJECTS_*` 마커 은퇴, 이력서·스킬·유튜브·플레이·리뷰만 남긴 **iframe 전용 페이지**로.
  ★ 이때 `FOOT_COUNTS`·`renderProjectArea`·`areaOf` 가 함께 죽는다 — 렌더러 정리는 이 라운드에서만.

---

## 5. 검증 게이트

### 5-1. 바이트 동일이 **유지되는** 라운드 (R1·R3·R4)

`scripts/verify_publish.sh --reseed` 그대로. 단 스크립트에 `sections.html` 복사·비교를 추가해야 한다(§3-1).
**이것이 유일한 완료 증거다**(§2-28 ⑦). 통과 못 하면 다음 라운드로 넘어가지 않는다.

### 5-2. 바이트 동일이 **불가능한** 라운드 (R2) — 대안 기준 3개

R2 는 사람이 경로·링크를 바꾸는 라운드라 원본과 다를 수밖에 없다. 대신 이 셋으로 판정한다.

1. **불변 기준**: `sections.html` 은 이 라운드에서도 **바이트 동일**이어야 한다. Steam 을 만지다 옛 페이지를 건드렸다면 여기서 걸린다.
2. **멱등성 게이트** (신규 · 강력): 사본에 publish 를 **연속 2회** 돌려 **2회차 출력이 1회차와 바이트 동일**한지 본다.
   "렌더러가 자기 출력을 다시 먹어도 안정적" 임을 증명한다. 시드 재추출 없이도 돌릴 수 있어 R4 각 묶음에도 쓴다.
3. **구조 어서션** (`check_steam_sync.mjs`):
   - 사이드바 `data-id` 집합 = `VIEWS` 키 ∪ `REVIEWS` 키 (고아·유령 0)
   - 그리드 카드 수 = `#pCount` 표기 수 = 프로젝트 8
   - `.dgo` href 8개가 전부 실재하는 `projects/*.html`
   - iframe `data-src` 4개가 `sections.html#<실재 id>`
   - `?v=` 문자열이 8개 HTML 에서 **한 값으로 통일**
   - 마커 START/END 짝 일치

### 5-3. 런타임 (매 라운드 · browser-verifier 위임)

콘솔 0 · 네트워크 404 0 · 4뷰포트(**375 / 760 / 1280 / 1920**) 가로 스크롤 0
· SPA 전수 클릭(상세 8 · 리뷰 4 · 탭 4 · 프로필 · 홈) · ←→ 히스토리 왕복 · 필터/검색 · 입장 연출 2초 이내·스킵 동작.

★ 760px 를 반드시 포함할 것 — 375 만 재면 놓친다(§2-28 ⑩).
★ 스크린샷이 검게 죽으면 페이지 결함이 아니라 캡처 결함이다 — JS 계측으로 대체(§3 도구 한계 메모).

### 5-4. 커밋 직전 1회 독립 검증

라운드마다 이중으로 재지 않는다(토큰 예산 규칙). 단 **되돌리기 어려운 변경**(R1 파일 이동, R4c 상세 마커, R5 수신처)은 예외로 즉시 잰다.

---

## 6. 위험과 완화

### ★ 최악 시나리오: "반영하기를 눌렀더니 사이트가 빈 화면"

이 경로는 실재한다 — **반영 = 자동 커밋·푸시**라 빈 화면이 곧바로 공개된다. 4겹으로 막는다.

| 겹 | 장치 | 상태 |
|---|---|---|
| 1 | **메모리 전량 치환 후 1회 쓰기** — 예외 시 파일 무손상 | 이미 있음. **깨지 말 것** |
| 2 | **`assertSane`** — 길이 60% · 센티널 · 마커 짝 (§3-3) | **신설 필요** |
| 3 | **자동 배포 차단** — 이관 기간 `gh_token` 비움 | R0 |
| 4 | **자동 백업** — `backups/<stamp>/` | 있음. **★ `sections.html` 을 백업 대상에 추가해야 함**(§3-1) |

복구 절차(사고 시): ① 관리자 `/deploy` 또는 `backups/` 최신 폴더에서 파일 복사 → ② `git checkout -- index.html sections.html` → ③ 원인 파악 전까지 반영 금지.

### 위험 목록

| # | 위험 | 심각도 | 완화 |
|---|---|---|---|
| 1 | **iframe 자기참조** — `../index.html` 5곳을 놓치면 무한 중첩 | 치명 | R2 체크리스트 + `check_steam_sync.mjs` 어서션 |
| 2 | **`backup()`·`verify_publish.sh`·`extract_seed.py` 가 `index.html` 을 하드코딩** — 이관 즉시 sections 가 백업·검증 밖으로 조용히 떨어짐 | 치명 | R1 에서 3개 동시 수정. **분리 금지** |
| 3 | **자동 배포가 중간 상태를 공개** | 높음 | R0 에서 토큰 비우기 |
| 4 | `sections.ts` 스펙 누락 → 첫 편집에서 값 증발(`width="undefined"` 전례) | 높음 | R3 에서 신규 필드 전수 등재 + 왕복 자기검사 |
| 5 | 레거시 해시(`#resume` 등) 조용한 사망 | 중 | R2-5 해시 브리지 |
| 6 | 스토브 리뷰 iframe 이 실도메인에서 차단(로컬과 다를 수 있음) | 중 | 목업에 7초 타임아웃 폴백 이미 있음. R2 에서 실도메인 재확인 |
| 7 | `?v=` 미갱신 캐시 사고(전례 4회) | 중 | R2-4 + 어서션 5-2-3 |
| 8 | 시드 재추출 레이스(DB 통째 비움 전례 2026-08-01) | 중 | 병렬 금지 명시. 시드는 **맨 마지막 한 번** |
| 9 | `renderSteam*` 의 빈 블록 join → `\n\n` 으로 바이트 깨짐 | 낮음 | 전 렌더러에 `.filter(trim!=='')` |
| 10 | GoatCounter 경로 지표 단절(`/sections.html` 신규) | 낮음 | `xref.ts` 라벨 추가. 방문자 수는 홈(`/`) 이 대표값(§2-28 ⑨) |
| 11 | 컨테이너에 소스가 마운트 안 됨 — `npm run build` 가 옛 소스를 다시 빌드하고 성공을 뱉음 | 낮음 | `docker compose build backend && up -d backend`(§2-28 ⑪) |
| 12 | 목업이 다른 에이전트에 의해 계속 바뀌는 중 | 낮음 | **R1 직전에 목업을 동결**하고 그 시점 사본으로 승격 |

### 관리자 마커 규칙 재확인 (§2-24 충돌 규칙 — 이관 후에도 유효)

- 마커 **안** 콘텐츠를 대화로 고치면 다음 반영에 **덮어써진다.** 이관 후에는 그 규칙이 **파일 두 개**에 걸린다.
- 마커 **밖**(Steam 프레임·입장 연출·상세 산문·CSS·JS)은 지금처럼 대화로.
- 마커 안을 대화로 고쳤으면 **시드 재추출**로 DB 를 맞춘다.

---

## 7. 사용자 결정이 필요한 항목

1. **기존 홈의 새 이름.** 후보: `sections.html`(권장 — 성격이 곧 이름) / `full.html` / `archive.html`.
   내비 탭 iframe·프로필 링크·xref 라벨이 이 이름을 쓴다. **한 번 정하면 바꾸기 번거롭다**(외부 링크가 붙기 시작).
2. **기존 홈을 사람에게 노출할지.** 권장: Steam 의 `배현 ▾` 드롭다운 또는 상태 띠에 `전체 페이지로 보기` 한 줄.
   숨기면 iframe 전용이 되어 검색엔진에는 두 홈이 보인다(중복 콘텐츠 소지) — 그때는 `sections.html` 에 `noindex` 를 넣는 판단이 따로 필요.
3. **관리자가 Steam 상세를 어디까지 소유할지.** 권장: **수치·목록·링크만**(장르·핵심 재미·역할·플레이 이력·집중 과제·상태·즐겨찾기·순서). 산문(제작 여정·노트·내 평가)은 대화로.
4. **이관 기간 자동 배포 끄기 동의** — `gh_token` 을 비우고 마지막에 사용자가 직접 되채운다. 동의 없으면 R0 을 진행할 수 없다.
5. **`sections.html` 의 최종 운명**(R6) — 전체 유지 / 이력서·유튜브·플레이·리뷰만 남기고 축소. **R4 완료 후에 결정해도 된다.**
6. **방명록 수신 A(Google Forms) / B(Formspree)** — A 권장(가입 불요·무제한·"나만 본다" 충족).
7. **입장 연출을 실사이트에서도 켤지** — 세션 1회·2초·스킵 가능이지만, 채용 담당자의 첫 2초를 쓴다. 끄려면 `intro` 요소 제거 한 줄.
8. **STEAM_THEME_PLAN §7 질문 스택 4건**(가마솥 플레이 이력 · 리뷰 플레이 시간 · 언리얼 '핵심 재미' 프레임 · 제작 게임 사이드바 표기)은
   **R3 시드 재추출 전에** 확정돼야 한다. 그 뒤에 고치면 시드를 다시 뽑아야 한다.

---

## 8. 한 눈에

```
R0 준비        토큰 비우기 · 태그 · 기준선           사이트 무변화
R1 승격        index→sections, Steam→index         Steam 깨짐 / sections 정상   ← 바이트 게이트 통과
R2 연결        경로·iframe·공용스크립트·해시브리지    Steam 정상 / sections 정상   ← 대안 기준 3개
R3 모델        컬럼·스펙·시드 확장                   사이트 무변화                ← 바이트 게이트 통과
R4 마커        8쌍을 2~3쌍씩 4묶음 (Optional 배선)   묶음마다 정상                ← 묶음마다 바이트 동일
R5 방명록      수신처 마커 1쌍                       정상
R6 정리        sections 은퇴 판단                    사용자 결정
```

**R1~R2 만 끝나도 사이트는 Steam 화면으로 살아 있고, 관리자는 예전 그대로 동작한다.**
R3 이후는 "관리자가 Steam 화면도 고칠 수 있게" 만드는 작업이지, 사이트를 세우는 작업이 아니다.
급하면 R2 에서 멈춰도 된다 — 그것이 이 분할의 목적이다.
