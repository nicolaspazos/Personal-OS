# NICOLAS OS

A single-screen, cinematic **personal operating system** — a HUD-style command center for the
day, built around **Glint Sites** (the agency) and **personal growth**. Momentum-first: habits,
streaks, and progress sit front and center.

Inspired by the AI Edge *Claude Design Playbook* + *Personal OS Build Cheat Sheet*, but
deliberately kept **simple and local-first** — no servers, no accounts, no API keys, no monthly
cost. It runs from a single HTML file and remembers everything in your browser.

```
HOME      session · operator + streak · habits · priorities · calendar · active project
WORK      Glint Sites pipeline (kanban) · active project · key blockers
GROWTH    momentum (streak + chain) · reading · vitals · weekly & monthly goals
REVIEW    weekly review (wins, what slipped, open loops, follow-ups, next week)
```

---

## How to open it

**Easiest:** double-click `index.html`. It opens in your browser and just works.

**Best (recommended):** serve the folder so the browser treats it as a real site (fonts + storage
behave better). From this folder:

```bash
# Python (already on your machine)
python -m http.server 4173
# then open  http://localhost:4173
```

Pin that tab. Open it in the morning and at night.

> Your data lives in **this browser** (`localStorage`). It never leaves your machine. Use a
> different browser/profile = a fresh OS. Back it up anytime from **⚙ → Export**.

### Run as a desktop app (Windows)

Double-click **`Nicolas OS.exe`** on your Desktop. It quietly starts the local server and opens your
OS in your browser — close the little console window to quit. The exe is **standalone** (no Python
needed) and serves the live repo, so your `config.js` edits still apply.

Prefer no exe? Double-click **`Launch Nicolas OS.bat`** in this folder instead (needs Python).
Either way it runs on a fixed port (`8787`), so your saved data persists across launches.

> Rebuild the exe anytime: `pip install pyinstaller` then
> `pyinstaller --onefile --name "Nicolas OS" launch_nicolas_os.py`.

---

## Make it yours — edit `config.js`

`config.js` is the only file you ever need to touch. Open it, change the text/numbers, save,
refresh. Everything is labeled and commented. You can change:

- **Who you are** — name, role (Founder · Glint Sites), focus states
- **Habits** — the 8 momentum habits (toggles + counters), categories, streak threshold
- **Tasks** — the starting priority list (you add/complete/remove live after that)
- **Active project** — current build + checklist
- **Pipeline** — Glint Sites leads/clients (tiers, heat)
- **Calendar** — today's time blocks (the NOW marker is automatic)
- **Reading, goals, vitals, blockers, the weekly-review prompts**

Bracketed bits like `[Client]` / `[Lead]` are placeholders — swap in real names.

> The clock, date, day-of-year, greeting, week strip, and your **timezone/city** are all
> detected automatically. Nothing to set.

---

## What's interactive (and saved)

| Action | Where |
|---|---|
| Tick habits / bump counters | HABITS — updates the ring, daily score, streak & chain |
| Add / complete / delete tasks | PRIORITIES |
| Set "today's one thing" | SESSION |
| Pick your focus state | OPERATOR |
| Tick the project checklist | ACTIVE PROJECT (progress ring recalculates) |
| Add leads · move tiers · cycle heat · remove | WORK pipeline |
| Add / check / remove goals | GROWTH |
| +/- reading progress · water · steps · sleep | GROWTH |
| Write your weekly review (auto-saves) | REVIEW |

**Streak logic:** a day counts toward your streak once you hit `streakThreshold` (default 70%) of
your habits. Today stays "in progress" until you cross it — then the streak ticks up. The chain of
dots shows your last 14 days. Daily habits/vitals reset at **your local midnight**.

---

## Two themes

Top-right toggle (or **⚙ → Switch Theme**):

- **JARVIS** — arc-reactor cyan on near-black (default)
- **BATMAN** — Batcomputer amber/gold on deeper black

Your choice is remembered.

---

## Settings (⚙, top-right)

- **Export / Import** — download or restore your whole OS as a JSON backup
- **Switch theme · Replay boot**
- **Reset today** — clears just today's habits/vitals/focus
- **Wipe all data** — back to the `config.js` defaults

---

## Files

```
index.html    structure (the 4 views)
styles.css    the HUD design system + both themes
config.js     ← your data. edit this.
app.js        logic: clock, persistence, interactions, boot
.claude/launch.json   local preview server config (optional)
```

No build step. No dependencies except two web fonts (Orbitron + JetBrains Mono) loaded from
Google Fonts — and it falls back to system mono if you're offline.

---

## Want to go further?

The *Cheat Sheet* PDF describes the "full" version (Next.js + Supabase + a Telegram voice-capture
bot + AI that reads your finances). This local build covers ~90% of the daily value at 0% of the
cost and setup. If you ever want the voice-capture pipeline or cross-device sync, that's the
natural next step — the module shapes here map straight onto it.

*Built around how you actually work. The tool is fast; your taste is the bottleneck. Use it, then
tweak `config.js` whenever something bugs you.*
