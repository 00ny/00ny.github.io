#!/usr/bin/env python3
"""projects/*.html 에 공통 셸을 (재)주입한다 — 몇 번을 돌려도 결과가 같다.

  python3 tools/inject_shell.py            # 반영
  python3 tools/inject_shell.py --check    # 고칠 것이 있는지만 보고(파일 안 씀)

본문은 절대 건드리지 않는다. 손대는 곳은 네 군데뿐이다.
  1) <head> 의 공용 style.css 링크
  2) site-bar 의 "NN / MM · 라벨"
  3) proj-nav 의 이전/다음 (체인 순서 = CHAIN)
  4) </body> 앞 공용 스크립트 4종

★ 관리자(portfolio-admin)의 '반영하기'도 2)3)을 자기 DB 기준으로 다시 쓴다.
  DB 에 없는 페이지는 체인에서 빠지므로, 여기 CHAIN 을 늘렸으면 관리자 쪽에도
  같은 프로젝트를 등록해야 한다. 안 그러면 다음 반영이 이 결과를 되돌린다.
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VER = "20260822d"  # 공용 자산 캐시 무효화 문자열. 공용 파일을 고친 날짜로 갱신할 것.

# (파일명, 이전/다음에 쓰는 짧은 이름, site-bar 라벨)
CHAIN = [
    ("onepluone.html",         "원쁠원",          "창작 · 전투/데이터 기획"),
    ("foxforest.html",         "여우숲",          "창작 · 시스템/콘텐츠 통합 기획"),
    ("unreal-level.html",      "언리얼 맵 3종",   "창작 · 레벨 디자인"),
    ("hzd-quest.html",         "가마솥 SIGMA",    "역기획 · 퀘스트 디자인"),
    ("endfield-level.html",    "무릉 천정원 지하", "역기획 · 레벨 디자인"),
    ("hesti-character.html",   "헤스티",          "제안 · 캐릭터 기획"),
    ("nidalee-character.html", "니달리 / Suzi",   "제안 · 캐릭터 내러티브"),
    ("crimson-balrog.html",    "크림슨 발록",     "창작 · 소셜 추리 콘텐츠 기획 · 1인 제작"),
]
SCRIPTS = ["shellnav.js", "smooth-scroll.js", "analytics.js", "guard.js"]
# 쓰는 페이지에만 있는 공용 자산. 없다고 주입하면 안 되고, 있으면 ?v= 는 맞춰야 한다.
BUMP_ONLY = ["docviewer.js", "shotlb.js"]


def nav_link(side, item):
    """side: 'prev' | 'next'. item 이 없으면 빈 칸(비활성)."""
    dir_ = "← 이전" if side == "prev" else "다음 →"
    if item is None:
        return (f'<span class="proj-nav__link proj-nav__link--{side} proj-nav__link--empty" aria-hidden="true">\n'
                f'<span class="proj-nav__dir">{dir_}</span>\n'
                f'<span class="proj-nav__title">—</span>\n</span>')
    return (f'<a class="proj-nav__link proj-nav__link--{side}" href="{item[0]}">\n'
            f'<span class="proj-nav__dir">{dir_}</span>\n'
            f'<span class="proj-nav__title">{item[1]}</span>\n</a>')


def fix(text, i):
    fname, _, label = CHAIN[i]
    no, total = f"{i + 1:02d}", f"{len(CHAIN):02d}"
    notes = []

    # 1) 공용 CSS — 없을 때만 넣는다(중복 주입 금지). 있으면 버전 문자열만 맞춘다.
    if "assets/style.css" not in text:
        text = re.sub(r'(<link rel="stylesheet")',
                      f'<link rel="stylesheet" href="../assets/style.css?v={VER}">\n\\1', text, count=1)
        notes.append("style.css 링크 주입")
    else:
        text, n = re.subn(r'(href="\.\./assets/style\.css)(\?v=[^"]*)?"', rf'\1?v={VER}"', text)
        if n:
            notes.append(f"style.css ?v= → {VER}")

    # 2) site-bar — 번호 자리에 무엇이 들어 있든(숫자든 '신규'든) 통째로 다시 쓴다.
    new_bar = f'<span class="site-bar__where">{no} / {total} · {label}</span>'
    text, n = re.subn(r'<span class="site-bar__where">[^<]*</span>', new_bar, text, count=1)
    if not n:
        notes.append("!! site-bar__where 없음 — 수동 확인 필요")

    # 3) proj-nav 이전/다음
    prev_i = CHAIN[i - 1] if i > 0 else None
    next_i = CHAIN[i + 1] if i + 1 < len(CHAIN) else None
    new_nav = ('<nav class="proj-nav" aria-label="프로젝트 이동"><div class="proj-nav__in">\n'
               + nav_link("prev", prev_i) + "\n"
               + '<a class="proj-nav__index" href="../index.html">전체 프로젝트 ⌂</a>\n'
               + nav_link("next", next_i) + "\n</div></nav>")
    text, n = re.subn(r'<nav class="proj-nav"[\s\S]*?</nav>', lambda m: new_nav, text, count=1)
    if not n:
        notes.append("!! proj-nav 없음 — 수동 확인 필요")

    # 4) 공용 스크립트 — 없는 것만 </body> 앞에 붙인다
    for s in SCRIPTS:
        if f"assets/{s}" in text:
            text = re.sub(rf'(src="\.\./assets/{re.escape(s)})(\?v=[^"]*)?"', rf'\1?v={VER}"', text)
        else:
            text = text.replace("</body>", f'<script src="../assets/{s}?v={VER}" defer></script>\n</body>', 1)
            notes.append(f"{s} 주입")
    for s in BUMP_ONLY:
        text = re.sub(rf'(src="\.\./assets/{re.escape(s)})(\?v=[^"]*)?"', rf'\1?v={VER}"', text)
    return text, notes


def main():
    check = "--check" in sys.argv
    changed = []
    for i, (fname, _, _) in enumerate(CHAIN):
        p = ROOT / "projects" / fname
        if not p.exists():
            print(f"  없음  {fname}")
            continue
        src = p.read_text(encoding="utf-8")
        out, notes = fix(src, i)
        if out != src:
            changed.append(fname)
            if not check:
                p.write_text(out, encoding="utf-8")
        print(f"  {'변경' if out != src else '동일'}  {fname}" + (f"   {' · '.join(notes)}" if notes else ""))
    print(f"\n{'고칠 파일' if check else '고친 파일'} {len(changed)}개")


if __name__ == "__main__":
    main()
