# 배현 · 게임기획 포트폴리오

신입 게임 기획 직군 지원용 포트폴리오 사이트. → **https://00ny.github.io**

빌드 도구 없는 순수 정적 사이트다. 파일을 고치고 push하면 1~2분 뒤 반영된다.

---

## 구조

```
00ny.github.io/
├── index.html                    ← 랜딩: 목차 → 캐러셀(3문장 회전 헤드라인) → 이력서 → 기획서 5편(+긴장 곡선) → 언리얼 → 분석·리뷰 → 유튜브 → 기술·도구 → 다른 기록 → 지금 하는 게임
├── assets/
│   ├── style.css                 ← 공통 셸 + index 전용 스타일 (단일 소스)
│   ├── img/<슬러그>/NN.jpg|webp   ← 추출된 이미지 223장
│   ├── img/<슬러그>/carousel.jpg  ← 캐러셀 전용 세로 2:3 크롭 (여우숲·헤스티)
│   ├── img/hesti-character/thumb.jpg ← 카드 썸네일용 16:9 크롭
│   └── video/onepluone/01.mp4    ← 추출된 영상 1개
└── projects/
    ├── onepluone.html            ← 01 창작 · 원쁠원 (MapleStory Worlds)
    ├── foxforest.html            ← 02 창작 · 여우숲 (Unity 3D)
    ├── hzd-quest.html            ← 03 역기획 · 가마솥 SIGMA (호라이즌 제로 던)
    ├── endfield-level.html       ← 04 역기획 · 무릉 천정원 지하 (엔드필드)
    └── hesti-character.html      ← 05 제안 · 헤스티 (엔드필드 신규 오퍼레이터)
```

프로젝트 순서는 **원쁠원 → 여우숲 → 가마솥 SIGMA → 무릉 천정원 지하 → 헤스티** (창작 2 → 역기획 2 → 제안 1).
헤스티는 엔드필드 분석에서 파생된 제안이라 엔드필드 뒤에 온다.

이 순서는 **세 곳에 중복**돼 있다. 바꾸려면 셋을 함께 고쳐야 한다.

| 위치 | 무엇 |
|---|---|
| `index.html`의 `.cr-stage` | 캐러셀 카드 순서 (첫 번째가 시작 카드) |
| `index.html`의 `.cards` | 3개 영역 안의 카드 순서 |
| `projects/*.html`의 `.proj-nav` | 이전/다음 체인 + 사이트 바의 `01 / 05` 번호 |

## 이 사이트가 굴러가는 방식

### 1. 페이지는 자기 스타일을 소유한다

각 프로젝트 페이지는 완성된 문서다. 본문 스타일은 **그 파일의 `<style>` 블록이 소유**한다.
`assets/style.css`는 페이지 본문에 관여하지 않고 두 가지만 담당한다.

- **공통 셸** — 모든 프로젝트 페이지 상단의 사이트 바, 하단의 이전/다음/인덱스 네비
- **index 전용** — 목차 바, 3D 캐러셀 히어로, 카드, 태그칩, 외부 링크, 이력서(벤토 패널 `.rz`), 분석·리뷰(`.anx`)

`style.css`가 페이지 `<style>`보다 먼저 로드되므로, 충돌 시 페이지가 이긴다. 의도된 순서다.

### 2. 셸은 페이지의 토큰을 상속받는다

셸은 색을 하드코딩하지 않고 각 페이지가 정의한 CSS 변수를 그대로 쓴다.

```css
.proj-nav__dir { color: var(--accent); }   /* 페이지마다 그 페이지의 색이 된다 */
.site-bar__in  { max-width: var(--maxw); } /* 페이지마다 그 페이지의 폭에 정렬된다 */
```

덕분에 **같은 셸 마크업이 페이지마다 자동으로 그 페이지의 accent 색과 판독 폭에 맞춰진다.**
원쁠원만 `--maxw:880px`이고 나머지는 `1120px`인데, 셸이 각각에 정렬되는 이유가 이것이다.

### 3. 디자인 토큰 — 5개 페이지 공통 스키마

> **⚠ 2026-07-17: 전 사이트 Cinematic Dark로 전환됨.** 아래 표의 토큰 **이름**은 그대로지만 **값이 다크**다
> (`--paper:#0E0F13` / `--ink:rgba(255,255,255,.90)` / `--card:#16181E` / `--slate:#20252E` …).
> index는 `.home`에 다크 토큰을 스코프하고, 프로젝트 5개는 각 `:root`를 다크로 재정의했다. accent는 페이지별 밝은 버전.
> 다크 값·전환 방법의 전체 근거는 [CLAUDE.md](CLAUDE.md) §2-10에 있다.

모든 페이지의 `:root`가 같은 이름을 쓴다(값은 위 주석대로 현재 다크).

| 토큰 | 역할 |
|---|---|
| `--paper` `--ink` `--muted` `--line` `--card` | 지면 · 본문 · 보조 · 선 · 카드 |
| `--accent` `--accent-soft` | **구조·규칙** (프로젝트마다 다름) |
| `--patch` `--patch-soft` | **평가·개선(PROPOSED) 전용** — 다른 용도로 쓰지 말 것 |
| `--link` | **링크 전용** — 다른 용도로 쓰지 말 것 |
| `--slate` `--observed` | 어두운 면(히어로·표 헤더·푸터) · 관찰(OBSERVED) 계열 |
| `--font-title` `--font-body` `--font-mono` | Hahmlet · Pretendard · IBM Plex Mono |
| `--maxw` | 그 페이지의 판독 폭 |

**색이 곧 의미다.** accent = 구조·규칙, patch(레드) = 평가·제안, link(블루) = 링크. 이 경계를 지켜야 페이지가 읽힌다.

프로젝트별 `--accent`:

| 페이지 | accent | 근거 | paper 대비 |
|---|---|---|---|
| 여우숲 | `#4A6B2A` 모스 그린 | 숲 | 5.70:1 |
| 원쁠원 | `#2E8B47` 그린 | 1+1 | 3.99:1 |
| 가마솥 SIGMA | `#B06A28` 앰버 | — | 3.96:1 |
| 무릉 천정원 지하 | `#20707F` 딥 틸 | 물 | 5.31:1 |
| 헤스티 | `#B25B12` 성화 오렌지 | 열기 | 4.45:1 |
| index | `#3C4A5A` slate | 무채색 — 카드의 프로젝트 색이 돋보이도록 | 8.43:1 |

> 원쁠원·가마솥의 accent는 WCAG AA(4.5:1) 미달이다. 기존 페이지의 정체성 색이라 유지했다.
> 본문 텍스트로는 쓰이지 않고 라벨·아이브로우에 쓰인다. 고칠 경우 각 페이지 `:root`의 `--accent` 한 줄만 바꾸면 된다.

### 4. 레거시 별칭

여우숲과 원쁠원은 구세대 변수명이 본문 인라인 `style`과 CSS에 남아 있다. 이름만 최신 스키마로 옮기고, 옛 이름은 `:root`에서 별칭으로 연결해 두었다.

```css
--amber2: var(--accent);    /* 여우숲: h3 소제목 6곳 */
--teal:   var(--observed);  /* 여우숲: 이벤트 테이블 모듈 셀 9곳 */
--mono:   var(--font-mono); /* 원쁠원: CSS 13곳 */
```

**이 줄들을 지우면 해당 요소의 색이 깨진다.** 지우려면 본문의 인라인 `style`을 먼저 정리해야 한다.

### 5. index의 3D 캐러셀

히어로의 카드 5장은 **CSS 위치 매트릭스 + 인라인 JS**로 돈다. 외부 라이브러리 없음.

- JS는 active 인덱스만 관리하고, 각 카드에 `data-pos`(-2~2)를 부여한다.
  실제 배치·회전은 CSS의 `.cr-card[data-pos="N"]` 규칙이 한다. **JS에 좌표를 넣지 말 것.**
- 카드의 문구는 마크업의 `data-title` / `data-tagline` / `data-kind` / `data-field`가 원본이다.
  중앙 타이틀(`.cr-title`)과 배경 블러(`.cr-bg`)는 여기서 파생된다. 문구를 고치려면 `data-*`만 고치면 된다.
- 카테고리는 제목만큼 중요한 정보로 취급한다: `data-kind`(창작/역기획/제안)는 **흰 채움 칩**,
  `data-field`(Unity 3D / MSW / 퀘스트·레벨·캐릭터)는 **외곽선 칩**. 제목 바로 위에 나란히 놓인다.
- `.cr-title::before`는 스크림이다. 원쁠원 노을처럼 **밝은 카드 위에서 칩·제목·설명이 묻히지 않게** 하는
  라디얼 그라디언트다. 지우면 밝은 카드에서 설명이 안 읽힌다.
- 조작: 화살표 · 측면 카드 클릭(중앙으로 이동만) · 중앙 카드 클릭(페이지 이동) · 드래그/스와이프 40px · ←/→ 키.

건드릴 때 걸리는 함정 세 가지:

1. **`:hover` 규칙은 반드시 위치 매트릭스 뒤에.** 둘 다 특정도가 같아 순서로 승부가 난다.
2. **`object-position`의 세로값은 대부분 무효다.** 카드는 세로 2:3인데 소스 이미지는 가로형이라,
   `object-fit:cover`가 높이를 맞추고 **가로만** 자른다. 즉 가로값만 듣는다.
   세로 프레이밍을 바꾸려면 `object-position`이 아니라 **이미지를 잘라야** 한다(→ `carousel.jpg`가 존재하는 이유).
3. **`.cr-hero`의 `overflow:hidden`을 풀지 말 것.** `.cr-bg`가 `scale(1.15)`로 확대돼 있어
   클리핑을 풀면 페이지에 가로 스크롤이 생긴다. no-JS 폴백도 높이만 풀고 클리핑은 유지한다.

JS가 죽으면 `.cr-stage`에 `is-ready`가 안 붙고, 카드 5장이 세로로 쌓여 전부 링크로 남는다.

## 유지보수

| 하고 싶은 것 | 고칠 곳 |
|---|---|
| 이력서 내용 고치기 | `index.html`의 `#resume` — 주제별 벤토 패널(`.rz-card`). 항목은 `.ritem`(날짜칩+내용) 복제 |
| 프로필 사진 교체 | `assets/img/profile/bae.jpg` 덮어쓰기(3:4 인물, 480px 권장). **img에 `width/height` 속성이 있으면 CSS `height:auto`가 있어야 `aspect-ratio`가 산다** |
| 히어로 문장 3개 교체 | `index.html` 하단 `<script>`의 `SENTS` 배열(+마크업 기본 문장 = 1번 문장과 동일하게). 방법은 [히어로-문구-바꾸기.md](히어로-문구-바꾸기.md) |
| **리뷰 추가**(스토브 글이 늘 때) | ① 글의 **첫 번째 이미지(대표 이미지)** URL을 추출해 `assets/img/reviews/<슬러그>.jpg`로 저장(800px·JPEG q85) ② `#analysis`의 `.rvw-grid`에 `.rvw` 카드 복사 → href·`.rvw-thumb` src·문구 교체(2열 자동 개행) |
| 유튜브 영상·수치 갱신 | `index.html` 하단 `<script>`의 `YT_VIDEOS`(id·title·views 조회수)와 `YT_SUBS`(구독자)만 수정 — **수동 갱신 방식**(실시간은 YouTube API 키 필요해 미채택) |
| **플레이 기록 갱신**(LV·전투력) | `index.html` 하단 `<script>`의 `PLAY_GAMES` 표 + `PLAY_ASOF` 날짜만 수정 (마크업 수정 불필요) |
| 언리얼 레벨 영상·평면도 교체 | `index.html`의 `#unreal` — 영상은 `.ytb-frame iframe`의 `src`, 평면도는 `.umap-plan`의 이미지(`assets/img/unreal-level/`) |
| 긴장 곡선 카드 교체 | `index.html`의 `#tension` — `.tsn-card`의 이미지(`assets/img/tension/`)·판정(`.tsn-verdict`)·PDF(`assets/doc/`). '실패' 강조는 `.tsn-verdict--fail` |
| 지금 하는 게임 갱신 | `index.html`의 `#play` — `.play-card`의 LV·전투력, `.play-asof` 기준일, `.play-etc` 목록만 수정 |
| 캐러셀 문구 교체 | `index.html`의 `.cr-card`의 `data-title` / `data-tagline` / `data-kind` / `data-field` |
| 프로젝트 순서·시작 카드 | 위 "구조"의 표 3곳을 함께 (캐러셀 · 카드 · 셸 체인) |
| 카드 문구·썸네일 교체 | `index.html`의 `.cards` |
| 프로젝트 추가·순서 변경 | `index.html` 카드 + 5개 페이지의 `.proj-nav` 링크(수작업) |
| 사이트 바/하단 네비 디자인 | `assets/style.css` 한 곳 |
| 특정 페이지 본문 디자인 | 그 페이지의 `<style>` |
| 페이지 accent 색 | 그 페이지 `:root`의 `--accent` (+ `--accent-soft`) |

## 이미지 규칙

원본 HTML은 이미지를 base64로 인라인해 5개 합계 **30.8MB**였다. 전량 추출해 `assets/`로 분리한 결과 **HTML 261KB + 미디어 22MB**가 됐다. 브라우저가 이미지를 캐시하고 `loading="lazy"`로 지연 로드하므로, 모바일 첫 화면 부담이 크게 줄었다.

**이미지를 다시 base64로 인라인하지 말 것.** 새 이미지는 `assets/img/<슬러그>/`에 넣고 상대경로(`../assets/img/...`)로 참조한다.

일부 페이지는 이미지 경로를 **JS 배열**로 들고 있다(`foxforest.html`의 `IMGS`, `onepluone.html`의 `PLAN_IMGS`). 갤러리 이미지를 바꿀 때는 이 배열도 함께 고쳐야 한다.

## 로컬에서 보기

```bash
python3 -m http.server 4173
# http://localhost:4173
```

`file://`로 직접 열면 상대경로 이미지 일부가 막힐 수 있으니 서버로 확인한다.

## 배포

```bash
git add -A
git commit -m "메시지"
git push origin main
```

GitHub Pages가 `main`/root를 서빙한다. 추가 설정 없음.
