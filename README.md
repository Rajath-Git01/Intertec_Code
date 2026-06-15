# 📊 Newman Collection Runner and Reporter

A light-theme, interactive HTML test report for Postman collections run via Newman CLI.  
Built for the **MOHAP/EDE API Test Automation** project.

> 👋 **New to Newman?** See `ReadMeForInstructions.txt` in this folder for step-by-step beginner instructions with copy-paste commands.

---

## 📁 Actual Folder Structure

```
📂 newman_Report/
├── index.js                          ← Reporter engine (Newman event hooks)
├── package.json                      ← Package identity (name: newman-reporter-Newman_Report)
├── README.md                         ← This file (developer reference)
├── ReadMeForInstructions.txt         ← Beginner-friendly run guide
│
├── 📂 src/
│   └── template.js                   ← HTML/CSS/JS report generator
│
├── 📂 collections/
│   └── MOH_Internal_API.postman_collection.json   ← Postman collection
│
├── 📂 environments/
│   └── MOHAP-EDE_OldAPI.postman_environment.json  ← UAT environment variables
│
└── 📂 reports/
    └── report.html                   ← Generated report (created/updated on each run)
```

---

## 🚀 Step-by-Step Setup

### Step 1 — Install Node.js (if not already installed)

Download from: https://nodejs.org  
Choose the **LTS** version. After install, verify:

```bash
node --version     # confirmed working: v20.20.0
npm --version      # confirmed working: 10.8.2
```

---

### Step 2 — Install Newman globally

```bash
npm install -g newman
```

Verify:

```bash
newman --version   # confirmed working: 6.2.2
```

---

### Step 3 — Link the reporter

Run this **once** from inside this folder to register the reporter globally:

```bash
cd D:\Automation\Newman\newman_Report
npm link
```

> ✅ You only need to do this once — or again if you move the folder.

---

### Step 4 — Export your Postman Collection (if using a new collection)

In Postman:
1. Click your collection → **⋯ (three dots)** → **Export**
2. Choose **Collection v2.1** → save into the `collections\` folder

Export your environment:
1. **Environments** → **⋯** → **Export** → save into the `environments\` folder

> The collection and environment for this project are already in place — skip this step for the existing MOHAP/EDE suite.

---

### Step 5 — Run Newman with the Newman_Report Reporter

**Run with HTML report only (recommended):**

```bash
newman run collections\MOH_Internal_API.postman_collection.json ^
  --environment environments\MOHAP-EDE_OldAPI.postman_environment.json ^
  --reporters Newman_Report ^
  --reporter-Newman_Report-export reports\report.html ^
  --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"
```

**Run with live CLI output AND HTML report:**

```bash
newman run collections\MOH_Internal_API.postman_collection.json ^
  --environment environments\MOHAP-EDE_OldAPI.postman_environment.json ^
  --reporters Newman_Report,cli ^
  --reporter-Newman_Report-export reports\report.html ^
  --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"
```

**Generic template (for any collection):**

```bash
newman run collections\<your-collection>.json ^
  --environment environments\<your-environment>.json ^
  --reporters Newman_Report ^
  --reporter-Newman_Report-export reports\report.html ^
  --reporter-Newman_Report-title "Your Custom Report Title"
```

> **Note on exit code 1:** Newman exits with code 1 when any test assertion fails.  
> This is **normal** — the HTML report is still generated successfully.  
> Look for `✅ Report saved →` in the terminal to confirm success.

---

## 📂 Full File Layout

```
📂 newman_Report/
├── index.js
├── package.json
├── README.md
├── ReadMeForInstructions.txt
├── 📂 src/
│   └── template.js
├── 📂 collections/
│   └── MOH_Internal_API.postman_collection.json
├── 📂 environments/
│   └── MOHAP-EDE_OldAPI.postman_environment.json
└── 📂 reports/
    └── report.html
```

---

## 🎨 What the Report Includes

| Section | Details |
|---|---|
| **Hero Header** | Custom title, run date/time, total duration, environment name |
| **Stat Cards** | Tests passed · Tests failed · APIs passed · APIs failed · Avg response time · Total duration |
| **Chart — Test Cases** | Doughnut chart: pass/fail % across all assertions |
| **Chart — API Health** | Doughnut chart: requests grouped by pass / ≤2 failures / >2 failures |
| **Interactive Legends** | Click any legend item to show/hide that chart segment |
| **Filter Bar** | Filter cards by All / Passed / Warning / Critical + live search by name or URL |
| **Request Cards** | Color-coded: 🟢 Pass · 🟡 Warning (1–2 fails) · 🔴 Critical (>2 fails) — click to expand |
| **Test Cases Panel** | All assertions per request with pass/fail and error message |
| **Response Panel** | Tabbed: Body (with Copy button) · Response Headers · Request Headers + Body |

**Design:**
- Light theme with soothing `#edf0f5` background and white cards
- **Plus Jakarta Sans** UI font — high clarity, eye-friendly
- **JetBrains Mono** for all code/response bodies
- 4× device pixel ratio canvas rendering for crisp chart arcs on any display
- HTML-rendered center text in charts (native browser hinting — fully crisp)

---

## ⚙️ All Reporter Flags

| Flag | Description |
|---|---|
| `--reporters Newman_Report` | Use this reporter (HTML only) |
| `--reporters Newman_Report,cli` | CLI output + HTML report simultaneously |
| `--reporter-Newman_Report-export <path>` | Where to save the HTML report file |
| `--reporter-Newman_Report-title "..."` | Custom title shown in the report hero header |

**Useful Newman flags to combine:**

| Flag | Description |
|---|---|
| `--bail` | Stop on first failure |
| `--timeout-request 10000` | Per-request timeout in ms (default ~5000) |
| `--iteration-count 3` | Run the collection N times |
| `--delay-request 500` | Wait N ms between requests |

---

## 🔁 Re-running After Changes

- Edit `index.js` or `src/template.js` → just re-run Newman, no re-linking needed.
- Move the folder → run `npm link` again from the new location.
- Change the report title → update `--reporter-Newman_Report-title "..."` in the command.

---

## ❓ Troubleshooting

**Reporter not found:**
```
could not find "Newman_Report" reporter
```
→ Run `npm link` from inside the `newman_Report` folder.  
→ Confirm `package.json` has `"name": "newman-reporter-Newman_Report"`.

**Cannot find module:**
```
Error: Cannot find module './src/template'
```
→ Confirm `src\template.js` exists inside the reporter folder.

**Node.js not found:**
→ Re-install from https://nodejs.org and restart your terminal.

**Permission denied (`EACCES`):**
→ Open CMD as Administrator (right-click → Run as administrator).

**UUID showing in report header instead of title:**
→ Pass `--reporter-Newman_Report-title "Your Title"` in the run command.

---

## 💡 Tips

- Use `ReadMeForInstructions.txt` for plain-English, copy-paste-ready commands
- `--bail` stops the entire run on the first failure — useful for fast feedback
- `--timeout-request 10000` prevents hangs on slow UAT APIs
- The generated `reports\report.html` is fully self-contained — share it by copying just that one file
- Re-run anytime; the old report is overwritten with fresh results

---

## 📋 Quick Reference Card

```bash
# Navigate to the project folder
cd D:\Automation\Newman\newman_Report

# Register reporter (once only)
npm link

# Run tests — MOHAP/EDE collection
newman run collections\MOH_Internal_API.postman_collection.json --environment environments\MOHAP-EDE_OldAPI.postman_environment.json --reporters Newman_Report --reporter-Newman_Report-export reports\report.html --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"

# Open the report
start reports\report.html
```

---

## 🔧 Versions Confirmed Working

| Tool | Version |
|---|---|
| Node.js | v20.20.0 |
| npm | 10.8.2 |
| Newman | 6.2.2 |
| Package | newman-reporter-Newman_Report v1.0.0 |
