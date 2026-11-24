#!/usr/bin/env python3
"""Update data/profile.json from a LinkedIn data export.

LinkedIn offers no API that lets a personal site read your profile, so this is the
closest thing to automatic sync:

  1. LinkedIn > Settings > Data privacy > Get a copy of your data >
     tick Positions, Education and Certifications (or "the works") > Request archive.
  2. Unzip it, then run:   python3 tools/linkedin_sync.py path/to/unzipped-folder
  3. Review the diff, commit and push. The site, the At a glance panel and
     resume.html all update from data/profile.json.

What it changes: titles, companies, locations, dates, education and certifications.
What it keeps: your hand-written resume bullets and case-study links (matched by
company and title), plus everything else in profile.json.

Only the three CSV files are read. Never commit the export itself: it contains
messages, connections and your phone number.
"""
import csv, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROFILE = ROOT / "data" / "profile.json"
MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


def ym(value):
    """'Jun 2026' -> '2026-06'; '2025' -> '2025'; '' -> ''."""
    v = (value or "").strip()
    m = re.match(r"([A-Za-z]{3})[a-z]*\s+(\d{4})", v)
    if m:
        return f"{m.group(2)}-{MONTHS[m.group(1).lower()]:02d}"
    m = re.search(r"(\d{4})", v)
    return m.group(1) if m else ""


def read(folder, name):
    path = Path(folder) / name
    if not path.exists():
        return None
    text = path.read_text(encoding="utf-8-sig")
    lines = text.splitlines()
    # Some exports start with a "Notes:" preamble before the header row.
    while lines and "," not in lines[0]:
        lines.pop(0)
    return list(csv.DictReader(lines))


def key(company, title):
    norm = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
    return norm(company)[:8] + "|" + norm(title)[:14]


def main(folder):
    profile = json.loads(PROFILE.read_text(encoding="utf-8"))
    old = {key(e["company"], e["title"]): e for e in profile.get("experience", [])}
    old_by_company = {}
    for e in profile.get("experience", []):
        old_by_company.setdefault(key(e["company"], "").split("|")[0], e)

    positions = read(folder, "Positions.csv")
    if positions is not None:
        new = []
        for p in positions:
            company, title = p.get("Company Name", "").strip(), p.get("Title", "").strip()
            if not company or not title:
                continue
            prev = old.get(key(company, title))
            entry = {
                "title": title,
                "company": prev["company"] if prev else company,
                "location": (p.get("Location") or (prev or {}).get("location", "")).split(",")[0].strip(),
                "start": ym(p.get("Started On")),
                "end": ym(p.get("Finished On")),
            }
            if prev:
                for k in ("case_study", "bullets"):
                    if k in prev:
                        entry[k] = prev[k]
            else:
                guess = old_by_company.get(key(company, "").split("|")[0])
                if guess and "case_study" in guess:
                    entry["case_study"] = guess["case_study"]
                entry["bullets"] = []
                print(f"  new role: {title} at {company} (add resume bullets in profile.json)")
            new.append(entry)
        new.sort(key=lambda e: (e["end"] == "", e["end"] or "9999", e["start"]), reverse=True)
        profile["experience"] = new
        print(f"Positions: {len(new)}")

    education = read(folder, "Education.csv")
    if education is not None:
        prev = {re.sub(r"\W", "", e["school"].lower())[:6]: e for e in profile.get("education", [])}
        out = []
        for e in education:
            school = e.get("School Name", "").strip()
            p = prev.get(re.sub(r"\W", "", school.lower())[:6], {})
            out.append({
                "degree": e.get("Degree Name", "").strip() or p.get("degree", ""),
                "school": p.get("school", school),
                "detail": p.get("detail", (e.get("Notes") or "").strip()),
                "start": ym(e.get("Start Date"))[:4],
                "end": ym(e.get("End Date"))[:4],
            })
        profile["education"] = sorted(out, key=lambda e: e["end"], reverse=True)
        print(f"Education: {len(out)}")

    certs = read(folder, "Certifications.csv")
    if certs is not None:
        profile["certifications"] = [
            {"name": c.get("Name", "").strip(), "issuer": c.get("Authority", "").strip()}
            for c in certs if c.get("Name")]
        print(f"Certifications: {len(profile['certifications'])}")

    PROFILE.write_text(json.dumps(profile, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {PROFILE.relative_to(ROOT)}. Review with: git diff data/profile.json")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
