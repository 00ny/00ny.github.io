#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""scan_budget.py — SCAN_FLOW_PLAN §0 스캔 경로 예산 계측기.

공식:  L0 + Σ(각 섹션 h2 + sec-key) + max(섹션별 노출 상세) ≤ 1,100자

────────────────────────────────────────────────────────────────────────
글자수 정의
  주석·<script>·<style> 제거 → 태그 제거 → 엔티티 복원 → 공백 전부 제거.
  엔티티를 복원하므로 `&middot;`는 1자로 센다(화면에 보이는 대로).

  ※ 설계서 §0의 실측치(onepluone 5,676 등)는 ⓐ <head>의 <title>을 포함하고
    ⓑ 엔티티를 복원하지 않아(`&middot;`=8자) 페이지당 13~56자(0.2~1.1%) 높다.
    `--legacy` 로 그 값을 그대로 재현해 대조할 수 있다. 예산 계산에는
    화면에 보이는 값(엔티티 복원·body 한정)을 쓴다.

────────────────────────────────────────────────────────────────────────
섹션 경계 규칙 (7편 마크업이 제각각이라 아래 규칙으로 통일한다)

  1. 대상 범위는 <body> 안쪽. <main>·<div> 같은 래퍼는 무시하고,
     "다른 <section> 안에 있지 않은 <section>"만 최상위 섹션으로 잡는다
     (onepluone 은 <main>, foxforest 는 </div></div><section> 형태라
      래퍼를 기준으로 삼으면 무너진다).
  2. 섹션 종류 판별:
       · GALLERY : 안에 class="gal…" 을 품은 섹션  → L2, 예산 전면 제외
                   (hzd/endfield 는 요약본·원본 2개, 나머지는 원본 1개)
       · TOC     : class 또는 id 에 toc 가 있는 섹션 → L0 의 '지도'로 취급,
                   L1 에서 제외(§2 집필규칙 5: 목차엔 sec-key 를 달지 않는다)
       · META    : class 에 metaband — nidalee 의 5초 스캔 메타. L0 부품.
       · CONTENT : 나머지 전부 → L1
  3. L0 = <body> 시작부터 **첫 CONTENT 섹션 직전**까지의 모든 텍스트.
     site-bar(신원 스트립)·hero·원작 배지·리드·수치·킬러 훅·슬라이드 스트립·
     목차(section.toc 이든 nav.toc 이든)가 자동으로 여기 들어온다.
     onepluone·foxforest 처럼 목차가 <nav> 인 경우도 같은 규칙으로 잡힌다.
  4. 마지막 CONTENT/GALLERY 섹션 뒤의 꼬리(proj-nav·footer)는 어느 층도 아니다.
  5. h2 는 각 섹션의 **첫 h2**. foxforest 는 <h2 class="sec"><span class="n">01</span>
     형태라 번호 2자가 h2 글자수에 포함된다(화면에 보이므로 의도한 계산).
  6. 노출 상세 = 섹션 전체 − h2 − sec-key − <details> 안쪽.
     <summary> 는 접힌 상태에서도 보이므로 노출 상세에 남긴다.
"""

import argparse
import html as htmlmod
import os
import re
import sys

PROJ_DIR = "/Users/baehyeon/Desktop/portfolio/projects"

PAGES = [
    "onepluone", "foxforest", "unreal-level", "hzd-quest",
    "endfield-level", "hesti-character", "nidalee-character",
]

BUDGET = 1100

# 설계서 §0 실측치(레거시 계산). --legacy 대조용.
REF_LEGACY = {
    "onepluone": 5676, "foxforest": 4926, "unreal-level": 5520,
    "hzd-quest": 6788, "endfield-level": 6592, "hesti-character": 8840,
    "nidalee-character": 9232,
}

TAG_RE = re.compile(r"</?([a-zA-Z][a-zA-Z0-9-]*)((?:\"[^\"]*\"|'[^']*'|[^>\"'])*)>", re.S)


# ── 텍스트화 ────────────────────────────────────────────────────────────
def strip_noise(s):
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r"<script\b[^>]*>.*?</script>", "", s, flags=re.S | re.I)
    s = re.sub(r"<style\b[^>]*>.*?</style>", "", s, flags=re.S | re.I)
    return s


def chars(fragment, unescape=True):
    """태그 제거 후 공백 제외 글자수."""
    t = TAG_RE.sub(" ", fragment)
    if unescape:
        t = htmlmod.unescape(t)
    return len(re.sub(r"\s+", "", t))


# ── 태그 스캐너 ─────────────────────────────────────────────────────────
def match_end(s, tag, open_start):
    """open_start 의 <tag …> 에 대응하는 </tag> 뒤 인덱스."""
    depth = 0
    for m in TAG_RE.finditer(s, open_start):
        if m.group(1).lower() != tag:
            continue
        if m.group(0).startswith("</"):
            depth -= 1
            if depth == 0:
                return m.end()
        else:
            if m.group(2).rstrip().endswith("/"):
                continue
            depth += 1
    return len(s)


def top_level(s, tag):
    """다른 동명 태그 안에 있지 않은 <tag> 들의 (start, end) 목록."""
    out, pos = [], 0
    while True:
        m = re.compile(r"<%s\b" % tag, re.I).search(s, pos)
        if not m:
            return out
        end = match_end(s, tag, m.start())
        out.append((m.start(), end))
        pos = end


def attr(open_tag, name):
    m = re.search(r'%s\s*=\s*"([^"]*)"' % name, open_tag, re.I)
    return m.group(1) if m else ""


# ── 페이지 분석 ─────────────────────────────────────────────────────────
def analyze(path):
    raw = open(path, encoding="utf-8").read()
    doc = strip_noise(raw)
    m = re.search(r"<body[^>]*>(.*)</body>", doc, flags=re.S)
    body = m.group(1) if m else doc

    secs = []
    for a, b in top_level(body, "section"):
        frag = body[a:b]
        open_tag = frag[:frag.find(">") + 1]
        cls, sid = attr(open_tag, "class"), attr(open_tag, "id")
        tokens = (cls + " " + sid).lower()

        if re.search(r'class\s*=\s*"[^"]*\bgal\b', frag):
            kind = "GALLERY"
        elif "toc" in tokens.split() or "toc" in tokens.replace("-", " ").split():
            kind = "TOC"
        elif "metaband" in tokens:
            kind = "META"
        else:
            kind = "CONTENT"

        h2m = re.search(r"<h2\b[^>]*>(.*?)</h2>", frag, flags=re.S | re.I)
        h2_txt = h2m.group(1) if h2m else ""

        keym = re.search(r'<p\b[^>]*class\s*=\s*"[^"]*\bsec-key\b[^"]*"[^>]*>(.*?)</p>',
                         frag, flags=re.S | re.I)
        key_txt = keym.group(1) if keym else ""

        # 노출 상세: 섹션 − h2 − sec-key − details 안쪽(summary 는 남김)
        rest = frag
        if h2m:
            rest = rest.replace(h2m.group(0), " ", 1)
        if keym:
            rest = rest.replace(keym.group(0), " ", 1)
        folded = 0
        for da, db in top_level(rest, "details"):
            folded += chars(rest[da:db])
        tmp, cut = [], 0
        for da, db in top_level(rest, "details"):
            inner = rest[da:db]
            sm = re.search(r"<summary\b[^>]*>.*?</summary>", inner, flags=re.S | re.I)
            keep = sm.group(0) if sm else ""
            tmp.append((da, db, keep))
        for da, db, keep in reversed(tmp):
            cut += chars(rest[da:db]) - chars(keep)
            rest = rest[:da] + keep + rest[db:]

        secs.append({
            "id": sid or "(no-id)", "kind": kind,
            "h2": chars(h2_txt), "key": chars(key_txt),
            "detail": chars(rest), "total": chars(frag),
            "folded": folded, "has_key": bool(keym),
            "h2_text": re.sub(r"\s+", " ", htmlmod.unescape(TAG_RE.sub("", h2_txt))).strip(),
            "start": a,
        })

    first_content = next((s["start"] for s in secs if s["kind"] == "CONTENT"), len(body))
    l0 = chars(body[:first_content])

    content = [s for s in secs if s["kind"] == "CONTENT"]
    head_sum = sum(s["h2"] + s["key"] for s in content)
    worst = max(content, key=lambda s: s["detail"]) if content else None
    scan = l0 + head_sum + (worst["detail"] if worst else 0)

    return {
        "l0": l0, "secs": secs, "content": content,
        "head_sum": head_sum, "worst": worst, "scan": scan,
        "body_total": chars(body),
        # 설계서 실측치 재현: 문서 전체(<title> 포함) · 엔티티 미복원 · 단순 태그 제거
        "legacy": len(re.sub(r"\s+", "", re.sub(r"<[^>]+>", " ", doc))),
        "gallery_chars": sum(s["total"] for s in secs if s["kind"] == "GALLERY"),
    }


# ── 출력 ────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="스캔 경로 예산 계측 (SCAN_FLOW_PLAN §0)")
    ap.add_argument("pages", nargs="*", help="페이지 슬러그(생략 시 7편 전부)")
    ap.add_argument("-v", "--verbose", action="store_true", help="섹션별 전체 내역")
    ap.add_argument("--legacy", action="store_true", help="설계서 실측치와 대조")
    ap.add_argument("--dir", default=PROJ_DIR)
    args = ap.parse_args()

    targets = args.pages or PAGES
    rows, fails = [], 0

    print(f"스캔 경로 = L0 + Σ(h2+sec-key) + max(노출 상세)   예산 {BUDGET}자")
    print("─" * 84)
    print(f"{'페이지':<20}{'L0':>6}{'Σ제목+키':>10}{'최대 상세 섹션':>26}{'합계':>8}  판정")
    print("─" * 84)

    for slug in targets:
        p = os.path.join(args.dir, slug + ".html")
        if not os.path.exists(p):
            print(f"{slug:<20}  파일 없음"); continue
        r = analyze(p)
        rows.append((slug, r))
        w = r["worst"]
        wtxt = f"#{w['id']} ({w['detail']})" if w else "-"
        ok = r["scan"] <= BUDGET
        if not ok:
            fails += 1
        verdict = "PASS" if ok else f"FAIL +{r['scan'] - BUDGET}"
        print(f"{slug:<20}{r['l0']:>6}{r['head_sum']:>10}{wtxt:>26}{r['scan']:>8}  {verdict}")

    print("─" * 84)
    print(f"PASS {len(rows)-fails} / FAIL {fails}")

    ex = "  ".join(f"{s}:{r['gallery_chars']}" for s, r in rows)
    print(f"L2 제외분(갤러리 섹션 전체) — {ex}")

    print("\n■ 감량 후보 — 노출 상세 상위 3섹션")
    for slug, r in rows:
        top = sorted(r["content"], key=lambda s: -s["detail"])[:3]
        items = "  ".join(f"#{s['id']}:{s['detail']}" for s in top)
        nokey = sum(1 for s in r["content"] if not s["has_key"])
        print(f"  {slug:<19}{items}   [sec-key 미작성 {nokey}/{len(r['content'])}]")

    if args.verbose:
        for slug, r in rows:
            print(f"\n═══ {slug}  (body {r['body_total']}자 / L2 갤러리 {r['gallery_chars']}자 제외)")
            print(f"  L0 {r['l0']}자  ·  콘텐츠 섹션 {len(r['content'])}개")
            print(f"  {'섹션':<16}{'종류':<9}{'h2':>5}{'key':>5}{'노출상세':>9}{'접힘':>7}  제목")
            for s in r["secs"]:
                mark = "" if s["kind"] == "CONTENT" else "  (예산 제외)"
                print(f"  {('#'+s['id'])[:15]:<16}{s['kind']:<9}{s['h2']:>5}{s['key']:>5}"
                      f"{s['detail'] if s['kind']=='CONTENT' else 0:>9}{s['folded']:>7}"
                      f"  {s['h2_text'][:34]}{mark}")

    if args.legacy:
        print("\n■ 설계서 §0 실측치 대조 (레거시 계산: <title> 포함 · 엔티티 미복원)")
        for slug, r in rows:
            ref = REF_LEGACY.get(slug)
            d = "" if ref is None else f"  ref {ref}  Δ{r['legacy']-ref:+d}"
            print(f"  {slug:<19}legacy {r['legacy']:>6}   body(rendered) {r['body_total']:>6}{d}")

    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
