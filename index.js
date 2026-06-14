'use strict';

const fs = require('fs');
const path = require('path');
const generateHTML = require('./src/template');

function BeautifulReporter(emitter, reporterOptions, options) {

  // Safely extract environment name
  let envName = 'None';
  if (options.environment) {
    if (typeof options.environment === 'string') {
      envName = path.basename(options.environment);
    } else if (options.environment.name) {
      envName = options.environment.name;
    } else if (options.environment.id) {
      envName = options.environment.id;
    } else {
      envName = 'Environment';
    }
  }

  const results = {
    collectionName: '',
    totalDuration: 0,
    startTime: new Date().toISOString(),
    environment: envName,
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      totalRequests: 0,
      passedRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      totalRequestSize: 0,
      totalResponseSize: 0,
    },
    requests: [],
    failures: [],
  };

  // Store per-item assertions keyed by item name
  const itemAssertions = {};

  // Store per-item HTTP data captured from the 'request' event
  // (args.request / args.response here carry fully resolved values — real URL, real timing)
  const itemExecData = {};

  emitter.on('start', (err, args) => {
    try {
      results.collectionName =
        reporterOptions.title ||
        options.collection?.info?.name ||
        'Postman Collection';
    } catch (e) {
      results.collectionName = reporterOptions.title || 'Postman Collection';
    }
  });

  emitter.on('request', (err, args) => {
    if (err) return;
    const res = args.response;
    const req = args.request;
    const itemName = args.item ? args.item.name : '__unknown__';

    results.summary.totalRequests += 1;
    if (res) {
      results.summary.totalResponseTime += res.responseTime || 0;
      results.summary.totalResponseSize += res.responseSize || 0;
    }

    // Capture resolved URL, method, timing, and body from the live HTTP exchange
    let url = '';
    let method = 'GET';
    let requestHeaders = {};
    let requestBody = '';
    let responseCode = 0;
    let responseTime = 0;
    let responseSize = 0;
    let responseBody = '';
    let responseHeaders = {};

    if (req) {
      try { url = req.url ? req.url.toString() : ''; } catch {}
      method = req.method || 'GET';
      if (req.headers && req.headers.members) {
        req.headers.members.forEach(h => { requestHeaders[h.key] = h.value; });
      }
      if (req.body) {
        try { requestBody = req.body.toString(); } catch {}
      }
    }

    if (res) {
      responseCode = res.code || res.status || 0;
      responseTime = res.responseTime || 0;
      responseSize = res.responseSize || 0;
      try {
        const raw = res.stream ? res.stream.toString() : '';
        try { responseBody = JSON.stringify(JSON.parse(raw), null, 2); }
        catch { responseBody = raw; }
      } catch { responseBody = '[Unable to decode response]'; }
      if (res.headers && res.headers.members) {
        res.headers.members.forEach(h => { responseHeaders[h.key] = h.value; });
      }
    }

    itemExecData[itemName] = { url, method, requestHeaders, requestBody, responseCode, responseTime, responseSize, responseBody, responseHeaders };
  });

  // Capture every assertion as it fires
  emitter.on('assertion', (err, args) => {
    results.summary.total += 1;

    const itemName = args.item ? args.item.name : '__unknown__';
    if (!itemAssertions[itemName]) itemAssertions[itemName] = [];

    if (err) {
      results.summary.failed += 1;
      itemAssertions[itemName].push({
        name: args.assertion || err.test || 'Unknown test',
        passed: false,
        error: err.message || err.test || String(err),
      });
    } else {
      results.summary.passed += 1;
      itemAssertions[itemName].push({
        name: args.assertion || 'Unknown test',
        passed: true,
        error: null,
      });
    }
  });

  emitter.on('item', (err, args) => {
    if (err) return;

    const item = args.item;
    const itemName = item ? item.name : '__unknown__';

    // Primary source: data captured from the 'request' event (resolved values)
    const exec = itemExecData[itemName] || {};
    const itemRequest = item && item.request;

    const assertions = itemAssertions[itemName] || [];
    const failedCount = assertions.filter(a => !a.passed).length;
    const passedCount = assertions.filter(a => a.passed).length;

    let status = 'pass';
    if (failedCount > 2) status = 'critical';
    else if (failedCount > 0) status = 'warning';

    // Fall back to item definition only when request event data is absent
    let requestUrl = exec.url || '';
    if (!requestUrl && itemRequest && itemRequest.url) {
      try { requestUrl = itemRequest.url.toString() || ''; } catch {}
    }
    const requestMethod = exec.method || (itemRequest && itemRequest.method) || 'GET';

    if (failedCount > 0) {
      results.summary.failedRequests += 1;
    } else {
      results.summary.passedRequests += 1;
    }

    results.requests.push({
      id: `req_${results.requests.length + 1}`,
      name: itemName || `Request ${results.requests.length + 1}`,
      status,
      method: requestMethod,
      url: requestUrl,
      responseCode:    exec.responseCode    || 0,
      responseTime:    exec.responseTime    || 0,
      responseSize:    exec.responseSize    || 0,
      requestHeaders:  exec.requestHeaders  || {},
      requestBody:     exec.requestBody     || '',
      responseHeaders: exec.responseHeaders || {},
      responseBody:    exec.responseBody    || '',
      assertions,
      passedCount,
      failedCount,
      totalAssertions: assertions.length,
    });
  });

  emitter.on('done', (err, summary) => {
    try {
      results.totalDuration =
        summary.run.timings?.completed - summary.run.timings?.started || 0;
    } catch { results.totalDuration = 0; }

    if (summary.run.failures) {
      results.failures = summary.run.failures.map(f => ({
        source: f.source?.name || 'Unknown',
        error: f.error?.message || String(f.error),
      }));
    }

    const outputFile = reporterOptions.export || 'newman-report.html';
    const html = generateHTML(results);

    try {
      fs.writeFileSync(outputFile, html, 'utf8');
      console.log(`\n✅ Report saved → ${path.resolve(outputFile)}\n`);
    } catch (writeErr) {
      console.error('❌ Could not write report:', writeErr.message);
    }
  });
}

module.exports = BeautifulReporter;
