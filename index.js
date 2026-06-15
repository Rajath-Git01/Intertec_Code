'use strict';

const fs   = require('fs');
const path = require('path');
const generateHTML = require('./src/template');

function BeautifulReporter(emitter, reporterOptions, options) {

  // ── Environment name ──────────────────────────────────────────────
  let envName = 'None';
  try {
    if (options.environment) {
      if (typeof options.environment === 'string') {
        envName = path.basename(options.environment);
      } else {
        envName = options.environment.name || options.environment.id || 'Environment';
      }
    }
  } catch {}

  // ── Result accumulator ────────────────────────────────────────────
  const results = {
    collectionName: '',
    totalDuration:  0,
    startTime:      new Date().toISOString(),
    environment:    envName,
    summary: {
      total: 0, passed: 0, failed: 0, skipped: 0,
      totalRequests: 0, passedRequests: 0, failedRequests: 0,
      totalResponseTime: 0, totalRequestSize: 0, totalResponseSize: 0,
    },
    requests: [],
    failures: [],
  };

  // ── Per-item rolling buffers ──────────────────────────────────────
  // Newman event order per item: beforeItem → request → assertion(s) → item
  // Rolling buffers avoid name-collision issues and cross-item data bleed.
  let currentExec       = {};
  let currentAssertions = [];

  // ── EVENTS ────────────────────────────────────────────────────────

  emitter.on('start', (err, args) => {
    try {
      results.collectionName =
        reporterOptions.title          ||
        options.collection?.info?.name ||
        'Postman Collection';
    } catch {
      results.collectionName = reporterOptions.title || 'Postman Collection';
    }
  });

  // Reset rolling buffers before every item — prevents stale data leaking
  emitter.on('beforeItem', () => {
    currentExec       = {};
    currentAssertions = [];
  });

  emitter.on('request', (err, args) => {
    const res      = args?.response;
    const req      = args?.request;

    results.summary.totalRequests += 1;
    if (res) {
      results.summary.totalResponseTime += res.responseTime || 0;
      results.summary.totalResponseSize += res.responseSize || 0;
    }

    // Resolved URL
    let url = '';
    try { url = req?.url?.toString() || ''; } catch {}

    // HTTP method
    const method = req?.method || 'GET';

    // Request headers
    const requestHeaders = {};
    try {
      req?.headers?.members?.forEach(h => { requestHeaders[h.key] = h.value; });
    } catch {}

    // Request body — handle raw, form-data, urlencoded body types
    let requestBody = '';
    try {
      if (req?.body) {
        const mode = req.body.mode;
        if (mode === 'formdata') {
          const members = req.body.formdata?.members || req.body.formdata || [];
          requestBody = members
            .map(p => `${p.key}: ${p.value !== undefined ? p.value : '[file]'}`)
            .join('\n');
        } else if (mode === 'urlencoded') {
          const members = req.body.urlencoded?.members || req.body.urlencoded || [];
          requestBody = members.map(p => `${p.key}=${p.value || ''}`).join('&');
        } else {
          requestBody = req.body.toString();
        }
      }
    } catch {}

    // Response
    let responseCode = 0, responseTime = 0, responseSize = 0;
    let responseBody = '', responseHeaders = {};

    if (err) {
      // Network / connection-level error — no HTTP response
      responseBody = `[Request Error] ${err.message || String(err)}`;
    } else if (res) {
      responseCode = res.code || res.status || 0;
      responseTime = res.responseTime || 0;
      responseSize = res.responseSize || 0;

      try {
        const raw = res.stream?.toString() || '';
        let decoded = raw;
        try { decoded = JSON.stringify(JSON.parse(raw), null, 2); } catch {}
        // Cap at 100 KB before storing — prevents memory exhaustion on large responses
        responseBody = decoded.length > 102400
          ? decoded.substring(0, 102400) + '\n\n[ ... truncated at capture — response exceeds 100 KB ... ]'
          : decoded;
      } catch { responseBody = '[Unable to decode response]'; }

      try {
        res.headers?.members?.forEach(h => { responseHeaders[h.key] = h.value; });
      } catch {}
    }

    currentExec = {
      url, method, requestHeaders, requestBody,
      responseCode, responseTime, responseSize, responseBody, responseHeaders,
    };
  });

  emitter.on('assertion', (err, args) => {
    results.summary.total += 1;

    if (err) {
      results.summary.failed += 1;
      currentAssertions.push({
        name:   args?.assertion || err.test || 'Unknown test',
        passed: false,
        error:  err.message || err.test || String(err),
      });
    } else {
      results.summary.passed += 1;
      currentAssertions.push({
        name:   args?.assertion || 'Unknown test',
        passed: true,
        error:  null,
      });
    }
  });

  emitter.on('item', (err, args) => {
    // Never skip an item — if there was a script/execution error,
    // add it as a failed assertion so it appears in the report
    if (err) {
      results.summary.total  += 1;
      results.summary.failed += 1;
      currentAssertions.push({
        name:   err.test || err.name || 'Script Error',
        passed: false,
        error:  err.message || String(err),
      });
    }

    const item        = args?.item;
    const itemRequest = item?.request;
    const itemName    = item?.name || `Request ${results.requests.length + 1}`;

    // URL: prefer exec (resolved), fall back to item definition
    let requestUrl = currentExec.url || '';
    if (!requestUrl) {
      try { requestUrl = itemRequest?.url?.toString() || ''; } catch {}
    }

    // Method: prefer exec, fall back to item definition
    const requestMethod = currentExec.method || itemRequest?.method || 'GET';

    const assertions  = [...currentAssertions];
    const failedCount = assertions.filter(a => !a.passed).length;
    const passedCount = assertions.filter(a =>  a.passed).length;

    let status = 'pass';
    if (failedCount > 2)      status = 'critical';
    else if (failedCount > 0) status = 'warning';

    // Only count toward pass/fail totals if an HTTP request actually fired
    if (currentExec.url || currentExec.responseCode) {
      if (failedCount > 0) results.summary.failedRequests += 1;
      else                  results.summary.passedRequests += 1;
    }

    results.requests.push({
      id:              `req_${results.requests.length + 1}`,
      name:            itemName,
      status,
      method:          requestMethod,
      url:             requestUrl,
      responseCode:    currentExec.responseCode    || 0,
      responseTime:    currentExec.responseTime    || 0,
      responseSize:    currentExec.responseSize    || 0,
      requestHeaders:  currentExec.requestHeaders  || {},
      requestBody:     currentExec.requestBody     || '',
      responseHeaders: currentExec.responseHeaders || {},
      responseBody:    currentExec.responseBody    || '',
      assertions,
      passedCount,
      failedCount,
      totalAssertions: assertions.length,
    });

    // Clear buffers — ready for the next item
    currentExec       = {};
    currentAssertions = [];
  });

  emitter.on('done', (err, summary) => {
    try { // ← outer catch ensures any crash still prints a visible error

    try {
      const started   = summary?.run?.timings?.started   || 0;
      const completed = summary?.run?.timings?.completed || 0;
      results.totalDuration = Math.max(0, completed - started);
    } catch { results.totalDuration = 0; }

    try {
      if (summary?.run?.failures?.length) {
        results.failures = summary.run.failures.map(f => ({
          source: f.source?.name || 'Unknown',
          error:  f.error?.message || String(f.error),
        }));
      }
    } catch { results.failures = []; }

    // ── Dynamic filename: Title_DD-MM_HH-MM-AM/PM_Report.html ──────
    const now  = new Date();
    const dd   = String(now.getDate()).padStart(2, '0');
    const mo   = String(now.getMonth() + 1).padStart(2, '0');
    let   hrs  = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12 || 12;
    const hh  = String(hrs).padStart(2, '0');

    const safeTitle = (results.collectionName || 'Report')
      .replace(/[/\\:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

    const fileName   = `${safeTitle}_${dd}-${mo}_${hh}-${mins}-${ampm}_Report.html`;
    const exportBase = reporterOptions.export || 'newman-report.html';
    const outputDir  = path.dirname(exportBase);
    const outputFile = path.join(outputDir, fileName);

    try { fs.mkdirSync(outputDir, { recursive: true }); } catch {}

    try {
      const html = generateHTML(results);
      fs.writeFileSync(outputFile, html, 'utf8');
      console.log(`\n✅ Report saved → ${path.resolve(outputFile)}\n`);
    } catch (writeErr) {
      console.error('❌ Could not write report:', writeErr.message);
    }

    } catch (fatalErr) { // ← outer catch
      console.error('❌ Reporter crashed in done handler:', fatalErr.message || String(fatalErr));
    }
  });
}

module.exports = BeautifulReporter;
