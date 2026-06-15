
================================================================
   NEWMAN API TEST RUNNER — COMPLETE INSTRUCTIONS GUIDE
   For: MOHAP/EDE API Test Automation
================================================================

   Who is this for?
   ----------------
   This guide is written for someone who has never used Newman
   or run API tests from the command line before. Follow every
   step in order and you will have a full HTML test report
   generated on your machine.

================================================================
   CONTENTS
================================================================

   SECTION 1  —  What Is This?
   SECTION 2  —  Folder Structure (Know What You Have)
   SECTION 3  —  One-Time Setup (Do This Only Once)
   SECTION 4  —  Run the Tests & Generate the Report
   SECTION 5  —  Open & Read the Report
   SECTION 6  —  Command Flags Explained
   SECTION 7  —  Common Errors & Fixes
   SECTION 8  —  Quick Cheat Sheet (Copy-Paste Ready)

================================================================
   SECTION 1 — WHAT IS THIS?
================================================================

   Newman is a command-line tool made by Postman that lets you
   run your Postman API collections directly from the terminal
   (CMD) without opening the Postman app.

   Newman_Report is a custom HTML reporter that converts the
   raw test results into a beautiful, interactive web page
   showing:

     - How many tests passed or failed
     - Response times for every API call
     - The full response body and headers
     - Visual charts showing API health at a glance

   YOU NEED:
     - A Windows machine (these instructions use CMD)
     - Internet access (to download Node.js and Newman)
     - The newman_Report folder (you already have it)

================================================================
   SECTION 2 — FOLDER STRUCTURE (KNOW WHAT YOU HAVE)
================================================================

   Your project folder should look like this:

   D:\Automation\Newman\newman_Report\
   │
   ├── index.js                   ← Reporter engine (do not edit)
   ├── package.json               ← Reporter identity file
   ├── ReadMeForInstructions.txt  ← This file
   ├── README.md                  ← Developer reference
   │
   ├── collections\
   │     └── MOH_Internal_API.postman_collection.json
   │                              ← The Postman test collection
   │
   ├── environments\
   │     └── MOHAP-EDE_OldAPI.postman_environment.json
   │                              ← Environment variables (URLs, keys)
   │
   ├── reports\
   │     └── report.html          ← Generated report (created after run)
   │
   └── src\
         └── template.js          ← HTML template (do not edit)

   KEY FILES YOU WILL USE:
     Collection  →  collections\MOH_Internal_API.postman_collection.json
     Environment →  environments\MOHAP-EDE_OldAPI.postman_environment.json
     Report      →  reports\report.html  (this gets created/updated on run)

================================================================
   SECTION 3 — ONE-TIME SETUP (DO THIS ONLY ONCE)
================================================================

   ┌─────────────────────────────────────────────────────────┐
   │  Open CMD (Command Prompt) as Administrator:            │
   │  Press  Windows Key → type "cmd" → Right-click →       │
   │  "Run as administrator"                                 │
   └─────────────────────────────────────────────────────────┘

   ────────────────────────────────────────────────────────────
   STEP 3.1 — Check if Node.js is already installed
   ────────────────────────────────────────────────────────────

   Paste this in CMD and press Enter:

        node --version

   ✅ Good result:  v20.20.0  (or any v14 and above)
   ❌ Bad result:   'node' is not recognized...

   If you got the bad result, install Node.js:
     1. Go to:  https://nodejs.org
     2. Download the LTS version
     3. Run the installer — keep all defaults and click Next
     4. Restart CMD and run  node --version  again

   ────────────────────────────────────────────────────────────
   STEP 3.2 — Check if Newman is already installed
   ────────────────────────────────────────────────────────────

   Paste this in CMD and press Enter:

        newman --version

   ✅ Good result:  6.2.2  (or any version 5 and above)
   ❌ Bad result:   'newman' is not recognized...

   If Newman is not installed, paste this and press Enter:

        npm install -g newman

   Wait for it to finish, then verify:

        newman --version

   ────────────────────────────────────────────────────────────
   STEP 3.3 — Register the Newman_Report reporter
   ────────────────────────────────────────────────────────────

   This tells Newman where to find the custom HTML reporter.
   You ONLY need to do this once (or again if you move the folder).

   Paste these two commands one at a time:

        cd D:\Automation\Newman\newman_Report

        npm link

   ✅ Good result:  added 1 package, and audited 3 packages...
   ❌ Bad result:   npm ERR! — see Troubleshooting in Section 7

   ════════════════════════════════════════════════════════════
   ✅ SETUP IS COMPLETE. You will never need to repeat Section 3
      unless you reinstall Node.js or move this folder.
   ════════════════════════════════════════════════════════════

================================================================
   SECTION 4 — RUN THE TESTS & GENERATE THE REPORT
================================================================

   ────────────────────────────────────────────────────────────
   STEP 4.1 — Open CMD and navigate to the project folder
   ────────────────────────────────────────────────────────────

   Paste this in CMD and press Enter:

        cd D:\Automation\Newman\newman_Report

   ────────────────────────────────────────────────────────────
   STEP 4.2 — Run the full test command
   ────────────────────────────────────────────────────────────

   Copy the ENTIRE block below and paste it into CMD, then
   press Enter. (It is one single command — paste it all at once)

   ┌─────────────────────────────────────────────────────────┐

   newman run collections\MOH_Internal_API.postman_collection.json --environment environments\MOHAP-EDE_OldAPI.postman_environment.json --reporters Newman_Report --reporter-Newman_Report-export reports\report.html --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"

   └─────────────────────────────────────────────────────────┘

   WHAT HAPPENS NEXT:
     - Newman starts executing every API request in the collection
     - You will see requests flying by in the terminal
     - When done, you will see:
           ✅ Report saved → D:\Automation\Newman\newman_Report\reports\report.html
     - Exit code 1 is NORMAL if any test assertions failed —
       it does NOT mean the reporter broke. The HTML report
       is still generated successfully.

   ────────────────────────────────────────────────────────────
   STEP 4.3 — Optional: See CLI output AND generate HTML
   ────────────────────────────────────────────────────────────

   If you want to see live results in the terminal window AND
   also get the HTML report, use this command instead:

   ┌─────────────────────────────────────────────────────────┐

   newman run collections\MOH_Internal_API.postman_collection.json --environment environments\MOHAP-EDE_OldAPI.postman_environment.json --reporters Newman_Report,cli --reporter-Newman_Report-export reports\report.html --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"

   newman run collections\MOH_External_API.postman_collection.json --environment environments\MOHAP-EDE_OldAPI.postman_environment.json --reporters Newman_Report,cli --reporter-Newman_Report-export reports\report.html --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"

   └─────────────────────────────────────────────────────────┘

================================================================
   SECTION 5 — OPEN & READ THE REPORT
================================================================

   After the run finishes, open the report in your browser.

   ────────────────────────────────────────────────────────────
   Option A — Open from CMD (fastest)
   ────────────────────────────────────────────────────────────

   Paste this in CMD and press Enter:

        start reports\report.html

   ────────────────────────────────────────────────────────────
   Option B — Open from File Explorer
   ────────────────────────────────────────────────────────────

     1. Open File Explorer
     2. Go to:  D:\Automation\Newman\newman_Report\reports\
     3. Double-click  report.html

   ────────────────────────────────────────────────────────────
   WHAT YOU WILL SEE IN THE REPORT
   ────────────────────────────────────────────────────────────

   ┌──────────────────────────────────────────────────────────┐
   │  HERO HEADER                                             │
   │  Title, run date, duration, environment name            │
   ├──────────────────────────────────────────────────────────┤
   │  STAT CARDS (6 tiles)                                    │
   │  Tests Passed │ Tests Failed │ APIs Passed │ APIs Failed │
   │  Avg Response Time │ Total Duration                      │
   ├──────────────────────────────────────────────────────────┤
   │  CHARTS                                                  │
   │  Left  → Test Case pass/fail percentage (donut chart)   │
   │  Right → API health grouped by failure severity         │
   │  TIP: Click a legend item to show/hide that segment     │
   ├──────────────────────────────────────────────────────────┤
   │  API REQUESTS LIST                                       │
   │  🟢 Green  = All tests passed                           │
   │  🟡 Yellow = 1–2 test failures                          │
   │  🔴 Red    = More than 2 test failures                  │
   │                                                          │
   │  Click any request card to expand it and see:           │
   │    • Test results (pass/fail per assertion)              │
   │    • Response body (with Copy button)                    │
   │    • Response headers                                    │
   │    • Request headers and body                           │
   ├──────────────────────────────────────────────────────────┤
   │  FILTER BAR                                              │
   │  Filter by All / Passed / Warning / Critical             │
   │  Search box to find a specific API by name or URL       │
   └──────────────────────────────────────────────────────────┘

================================================================
   SECTION 6 — COMMAND FLAGS EXPLAINED
================================================================

   Understanding what each part of the run command does:

   newman
     └─ The CLI tool that runs Postman collections

   run collections\MOH_Internal_API.postman_collection.json
     └─ Path to the Postman collection file to execute

   --environment environments\MOHAP-EDE_OldAPI.postman_environment.json
     └─ Path to the environment file containing base URLs,
        credentials, and other variables used in the requests

   --reporters Newman_Report
     └─ Use the custom Newman_Report HTML reporter.
        Use  Newman_Report,cli  to also show live output in CMD.

   --reporter-Newman_Report-export reports\report.html
     └─ Where to save the generated HTML report file.
        You can change this path to save it anywhere you want.

   --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"
     └─ The title shown in the report header.
        Change the text inside the quotes to whatever you need.

   ──────────────────────────────────────────────────
   ADDITIONAL USEFUL FLAGS (add any of these to the command)
   ──────────────────────────────────────────────────

   --bail
     Stop the run immediately on the first failure.
     Example:  ... --bail

   --timeout-request 10000
     Wait up to 10 seconds for each API response (default: 5s).
     Useful for slow APIs. Change the number (in milliseconds).
     Example:  ... --timeout-request 10000

   --iteration-count 3
     Run the entire collection 3 times back to back.
     Example:  ... --iteration-count 3

   --delay-request 500
     Wait 500ms between each request (good for rate-limited APIs).
     Example:  ... --delay-request 500

================================================================
   SECTION 7 — COMMON ERRORS & FIXES
================================================================

   ────────────────────────────────────────────────────────────
   ERROR: 'newman' is not recognized as an internal or
          external command
   ────────────────────────────────────────────────────────────
   CAUSE:  Newman is not installed, or Node.js is not in PATH.
   FIX:    Run:  npm install -g newman
           If that also fails, reinstall Node.js from nodejs.org
           and restart CMD.

   ────────────────────────────────────────────────────────────
   ERROR: could not find "Newman_Report" reporter
   ────────────────────────────────────────────────────────────
   CAUSE:  The reporter was not linked with npm link.
   FIX:    Run these two commands again:
                cd D:\Automation\Newman\newman_Report
                npm link

   ────────────────────────────────────────────────────────────
   ERROR: Cannot find module './src/template'
   ────────────────────────────────────────────────────────────
   CAUSE:  The src\template.js file is missing or misplaced.
   FIX:    Check that the file exists at:
           D:\Automation\Newman\newman_Report\src\template.js

   ────────────────────────────────────────────────────────────
   ERROR: No such file or directory — collection or environment
   ────────────────────────────────────────────────────────────
   CAUSE:  Wrong path to the collection or environment file.
   FIX:    Make sure CMD is inside the newman_Report folder.
           Run:  cd D:\Automation\Newman\newman_Report
           Then re-run the test command.

   ────────────────────────────────────────────────────────────
   EXIT CODE 1 — Tests failed but report still generated
   ────────────────────────────────────────────────────────────
   CAUSE:  One or more API test assertions failed.
           This is EXPECTED behavior, not a tool error.
   FIX:    Open the report to see which APIs failed and why.
           Look for 🔴 Red (Critical) cards in the report.

   ────────────────────────────────────────────────────────────
   ERROR: npm ERR! code EACCES  (permission denied)
   ────────────────────────────────────────────────────────────
   CAUSE:  CMD is not running as Administrator.
   FIX:    Close CMD. Re-open it by right-clicking and choosing
           "Run as administrator". Then retry.

================================================================
   SECTION 8 — QUICK CHEAT SHEET (COPY-PASTE READY)
================================================================

   Keep this section handy. These are the only commands you
   need day-to-day.

   ┌─────────────────────────────────────────────────────────┐
   │  1. NAVIGATE TO THE PROJECT FOLDER                      │
   └─────────────────────────────────────────────────────────┘

        cd D:\Automation\Newman\newman_Report

   ┌─────────────────────────────────────────────────────────┐
   │  2. RUN TESTS — HTML REPORT ONLY                        │
   └─────────────────────────────────────────────────────────┘

   newman run collections\MOH_Internal_API.postman_collection.json --environment environments\MOHAP-EDE_OldAPI.postman_environment.json --reporters Newman_Report --reporter-Newman_Report-export reports\report.html --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"

   ┌─────────────────────────────────────────────────────────┐
   │  3. RUN TESTS — CLI OUTPUT + HTML REPORT                │
   └─────────────────────────────────────────────────────────┘

   newman run collections\MOH_Internal_API.postman_collection.json --environment environments\MOHAP-EDE_OldAPI.postman_environment.json --reporters Newman_Report,cli --reporter-Newman_Report-export reports\report.html --reporter-Newman_Report-title "MOHAP/EDE API Test Run Report"

   ┌─────────────────────────────────────────────────────────┐
   │  4. OPEN THE REPORT                                     │
   └─────────────────────────────────────────────────────────┘

        start reports\report.html

   ┌─────────────────────────────────────────────────────────┐
   │  5. RE-REGISTER REPORTER (only if you moved the folder) │
   └─────────────────────────────────────────────────────────┘

        cd D:\Automation\Newman\newman_Report
        npm link

   ┌─────────────────────────────────────────────────────────┐
   │  6. VERIFY EVERYTHING IS INSTALLED CORRECTLY            │
   └─────────────────────────────────────────────────────────┘

        node --version        ← should show v14 or higher
        npm --version         ← should show 6 or higher
        newman --version      ← should show 5 or higher

================================================================
   VERSIONS CONFIRMED WORKING ON THIS MACHINE
================================================================

     Node.js  →  v20.20.0
     npm      →  10.8.2
     Newman   →  6.2.2

================================================================
   END OF INSTRUCTIONS
   For issues contact Rajath or refer to README.md
================================================================
