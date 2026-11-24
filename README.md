# Trevor D'Costa, portfolio

Live at https://dcostat04.github.io/trevorportfolio/ · Plain HTML, CSS and JS, no build step.

## Updating experience, education or certifications

Everything in **Experience**, the **At a glance** panel and **resume.html** comes from one file: `data/profile.json`.

- **Quick edit:** open `data/profile.json` on GitHub, click the pencil, edit, commit. The site updates in about a minute.
- **From LinkedIn:** LinkedIn > Settings > Data privacy > Get a copy of your data. Unzip it, then run
  `python3 tools/linkedin_sync.py path/to/export-folder`. It updates titles, companies, dates, education and
  certifications while keeping your resume bullets. Never commit the export itself.

Case studies in `work/` are written by hand on purpose.
