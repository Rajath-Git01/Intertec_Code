# 📊 Newman Beautiful Reporter

A stunning light-theme HTML test report for Postman collections run via Newman CLI.

---

## 📁 Folder Structure

Place this folder anywhere on your machine. Recommended location:

```
📂 newman_Report/        ← This folder
├── index.js                         ← Reporter entry point
├── package.json                     ← Package metadata
├── README.md                        ← This file
└── 📂 src/
    └── template.js                  ← HTML report generator
```

---

## 🚀 Step-by-Step Setup

### Step 1 — Install Node.js (if not already installed)

Download from: https://nodejs.org  
Choose the **LTS** version. After install, verify:

```bash
node --version     # should show v14+ e.g. v20.11.0
npm --version      # should show 6+
```

---

### Step 2 — Install Newman globally

```bash
npm install -g newman
```

Verify installation:
```bash
newman --version   # should show 5+ e.g. 5.3.2
```

---

### Step 3 — Link this reporter

Navigate into this reporter folder and link it globally so Newman can find it:

```bash
cd /path/to/newman_Report
npm link
```

> ✅ This registers the reporter globally on your machine.
> You only need to do this ONCE.

---

### Step 4 — Export your Postman Collection

In Postman:
1. Click on your collection name in the sidebar
2. Click the **⋯ (three dots)** → **Export**
3. Choose **Collection v2.1** → Save as `my-collection.json`

Optionally export your environment:
1. Go to **Environments** in the sidebar
2. Click **⋯** → **Export** → Save as `my-environment.json`

---

### Step 5 — Run Newman with the Newman_Report Reporter

```bash
# Basic run (no environment)
newman run my-collection.json \
  --reporters Newman_Report \
  --reporter-Newman_Report-export report.html

# With environment file
newman run my-collection.json \
  --environment my-environment.json \
  --reporters Newman_Report \
  --reporter-Newman_Report-export report.html

# With custom report title (shown in the hero header)
newman run my-collection.json \
  --environment my-environment.json \
  --reporters Newman_Report \
  --reporter-Newman_Report-export report.html \
  --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"

# With multiple reporters (CLI output + HTML)
newman run my-collection.json \
  --environment my-environment.json \
  --reporters cli,Newman_Report \
  --reporter-Newman_Report-export report.html \
  --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"

# Custom output path
newman run my-collection.json \
  --environment my-environment.json \
  --reporters Newman_Report \
  --reporter-Newman_Report-export ./reports/my-report.html \
  --reporter-Newman_Report-title "My API Test Run"
```

---

## 📂 Full Example File Layout

```
📂 my-project/
├── 📂 newman_Report/    ← The reporter (linked globally)
│   ├── index.js
│   ├── package.json
│   └── 📂 src/
│       └── template.js
├── my-collection.json               ← Exported from Postman
├── my-environment.json              ← Optional environment
└── 📂 reports/
    └── report.html                  ← Generated report
```

---

## 🎨 What the Report Includes

| Section             | Details                                                      |
|---------------------|--------------------------------------------------------------|
| **Hero Header**     | Collection name, date, duration, environment info            |
| **Stat Cards**      | Tests passed/failed, APIs passed/failed, avg response time   |
| **Pie Chart 1**     | % of test cases passed vs failed                             |
| **Pie Chart 2**     | API health — passed / ≤2 failures / >2 failures              |
| **Filter Bar**      | Filter by All / Passed / Warning / Critical + search box     |
| **Request Cards**   | Color-coded: 🟢 Green (pass) · 🟡 Yellow (≤2 fail) · 🔴 Red (>2 fail) |
| **Test Cases**      | Expandable list of all assertions with pass/fail per request |
| **Response Panel**  | Response body, headers, request headers, request body        |
| **Copy Button**     | One-click copy for response body                             |

---

## 🔁 Re-running After Changes

If you edit `index.js` or `src/template.js`, just re-run Newman — no re-linking needed.

If you move the folder, run `npm link` again from the new location.

---

## ❓ Troubleshooting

**Reporter not found error:**
```
Error: No reporter found for "Newman_Report"
```
→ Make sure you ran `npm link` inside the reporter folder.
→ Make sure the folder is named exactly `newman_Report` and the package name in `package.json` is `Newman_Report`.

**Cannot find module error:**
```
Error: Cannot find module './src/template'
```
→ Make sure the `src/template.js` file exists inside the reporter folder.

**Node.js not found:**
→ Re-install from https://nodejs.org and restart your terminal.

---

## 💡 Tips

- Run with `--bail` to stop on first failure: `newman run ... --bail`
- Use `--timeout-request 10000` for slow APIs (10s timeout)
- Use `--iteration-count 3` to run the collection 3 times
- Combine with CI/CD: the report is a single self-contained HTML file
- Set a custom header title with `--reporter-Newman_Report-title "Your Title Here"`

---

## 📋 Quick Reference Card

```bash
# 1. Install Newman (once)
npm install -g newman

# 2. Link reporter (once, from reporter folder)
cd newman_Report && npm link

# 3. Run your collection
newman run collection.json \
  --environment env.json \
  --reporters cli,Newman_Report \
  --reporter-Newman_Report-export report.html \
  --reporter-Newman_Report-title "Your Report Title"

# 4. Open report
open report.html          # macOS
start report.html         # Windows
xdg-open report.html      # Linux
```
