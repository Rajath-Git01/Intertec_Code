'use strict';

function generateHTML(data) {
  const {
    collectionName,
    totalDuration,
    startTime,
    environment,
    createdBy,
    summary,
    requests,
  } = data;

  const passRate = summary.total > 0
    ? ((summary.passed / summary.total) * 100).toFixed(1)
    : '0.0';

  const apiPassRate = summary.totalRequests > 0
    ? ((summary.passedRequests / summary.totalRequests) * 100).toFixed(1)
    : '0.0';

  const avgResponseTime = summary.totalRequests > 0
    ? Math.round(summary.totalResponseTime / summary.totalRequests)
    : 0;

  const durationSec = (totalDuration / 1000).toFixed(2);

  const formattedDate = new Date(startTime).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  // Build response code distribution
  const rcFamilyPalettes = {
    '1': ['#a5f3fc', '#67e8f9', '#22d3ee'],
    '2': ['#4ade80', '#22c55e', '#16a34a', '#86efac'],
    '3': ['#38bdf8', '#0ea5e9', '#0284c7'],
    '4': ['#fbbf24', '#f59e0b', '#d97706', '#fb923c', '#f97316'],
    '5': ['#fca5a5', '#f87171', '#ef4444', '#dc2626'],
  };
  const rcFamilyIdx = {};
  const rcMap = {};
  requests.forEach(req => {
    const code = String(req.responseCode || 'N/A');
    rcMap[code] = (rcMap[code] || 0) + 1;
  });
  const rcEntries = Object.entries(rcMap).sort((a, b) => {
    if (a[0] === 'N/A') return 1;
    if (b[0] === 'N/A') return -1;
    return parseInt(a[0]) - parseInt(b[0]);
  });
  const rcColors = rcEntries.map(([code]) => {
    const f = String(code)[0];
    const pal = rcFamilyPalettes[f] || ['#9ca3af', '#6b7280', '#4b5563'];
    rcFamilyIdx[f] = rcFamilyIdx[f] || 0;
    const color = pal[rcFamilyIdx[f] % pal.length];
    rcFamilyIdx[f]++;
    return color;
  });
  const rcLegendHTML = rcEntries.map(([code, count], idx) => {
    const pct = requests.length > 0 ? ((count / requests.length) * 100).toFixed(1) : '0.0';
    return `
        <div class="legend-item" data-chart="rc" data-idx="${idx}">
          <div class="legend-dot" style="background:${rcColors[idx]}"></div>
          <span class="legend-label">${escapeHtml(code)}</span>
          <span class="legend-value">${count}</span>
          <span class="legend-pct">${pct}%</span>
        </div>`;
  }).join('');

  // Build request cards HTML
  const requestCardsHTML = requests.map((req, i) => {
    const statusClass = req.status === 'pass' ? 'pass'
      : req.status === 'warning' ? 'warning' : 'critical';

    const statusLabel = req.status === 'pass' ? '✓ PASSED'
      : req.status === 'warning' ? '⚠ WARNING' : '✕ CRITICAL';

    const methodClass = req.method.toLowerCase();

    const assertionsHTML = req.assertions.length > 0
      ? req.assertions.map(a => `
          <div class="assertion-item ${a.passed ? 'assertion-pass' : 'assertion-fail'}">
            <span class="assertion-icon">${a.passed ? '✓' : '✕'}</span>
            <div class="assertion-content">
              <span class="assertion-name">${escapeHtml(a.name)}</span>
              ${!a.passed && a.error ? `<span class="assertion-error">${escapeHtml(a.error)}</span>` : ''}
            </div>
          </div>`).join('')
      : '<div class="no-assertions">No assertions defined for this request</div>';

    const reqHeadersHTML = Object.keys(req.requestHeaders).length > 0
      ? Object.entries(req.requestHeaders).map(([k, v]) =>
          `<tr><td class="header-key">${escapeHtml(k)}</td><td class="header-val">${escapeHtml(v)}</td></tr>`
        ).join('')
      : '<tr><td colspan="2" class="empty-row">No request headers</td></tr>';

    const resHeadersHTML = Object.keys(req.responseHeaders).length > 0
      ? Object.entries(req.responseHeaders).map(([k, v]) =>
          `<tr><td class="header-key">${escapeHtml(k)}</td><td class="header-val">${escapeHtml(v)}</td></tr>`
        ).join('')
      : '<tr><td colspan="2" class="empty-row">No response headers</td></tr>';

    const rawBody    = req.responseBody || '';
    const truncated  = rawBody.length > 50000;
    const responseBodyContent = rawBody
      ? escapeHtml(rawBody.substring(0, 50000)) + (truncated ? '\n\n[ ... truncated — response exceeds 50,000 characters ... ]' : '')
      : 'No response body';

    return `
    <div class="request-card ${statusClass}${req.totalAssertions === 0 ? ' no-tests' : ''}" id="${req.id}" style="--card-idx:${i}">
      <div class="request-header" onclick="toggleCard('${req.id}')">
        <div class="request-left">
          <div class="request-index">${i + 1}</div>
          <span class="method-badge ${methodClass}">${req.method}</span>
          <div class="request-info">
            <div class="request-name">${escapeHtml(req.name)}</div>
            <div class="request-url">${escapeHtml(req.url || 'No URL')}</div>
          </div>
        </div>
        <div class="request-right">
          <div class="request-stats">
            <span class="stat-badge response-code code-${Math.floor((req.responseCode || 0) / 100)}xx">
              ${req.responseCode || 'N/A'}
            </span>
            <span class="stat-badge time-badge">${req.responseTime}ms</span>
            <span class="stat-badge assertion-badge">
              ${req.passedCount}/${req.totalAssertions} tests
            </span>
          </div>
          <div class="status-pill ${statusClass}">${statusLabel}</div>
          <div class="chevron" id="chevron-${req.id}">▼</div>
        </div>
      </div>

      <div class="request-body" id="body-${req.id}" style="display:none;">
        <!-- Assertions Section -->
        <div class="section-block">
          <div class="section-title">
            <span class="section-icon">🧪</span>
            Test Cases
            <span class="section-count">${req.totalAssertions} total · ${req.passedCount} passed · ${req.failedCount} failed</span>
          </div>
          <div class="assertions-list">
            ${assertionsHTML}
          </div>
        </div>

        <!-- Response Dropdown -->
        <div class="section-block">
          <div class="section-title dropdown-toggle" onclick="toggleDropdown('response-${req.id}')">
            <span class="section-icon">📡</span>
            Response
            <span class="dropdown-arrow" id="darrow-response-${req.id}">▶</span>
          </div>
          <div class="dropdown-content" id="response-${req.id}" style="display:none;">
            <div class="response-tabs">
              <button class="rtab active" onclick="switchTab(this, 'rb-${req.id}')">Body</button>
              <button class="rtab" onclick="switchTab(this, 'rh-${req.id}')">Headers</button>
              <button class="rtab" onclick="switchTab(this, 'reqb-${req.id}')">Request</button>
            </div>
            <div id="rb-${req.id}" class="rtab-content active">
              <div class="response-meta">
                <span class="meta-chip">Status: <strong>${req.responseCode}</strong></span>
                <span class="meta-chip">Time: <strong>${req.responseTime}ms</strong></span>
                <span class="meta-chip">Size: <strong>${formatBytes(req.responseSize)}</strong></span>
              </div>
              <div class="code-block">
                <div class="code-btn-group">
                  <button class="copy-btn" onclick="copyCode('code-${req.id}')">Copy</button>
                  <button class="copy-btn download-btn" data-codeid="code-${req.id}" data-report="${escapeHtml(collectionName)}" data-api="${escapeHtml(req.name)}" onclick="downloadCode(this)">Download</button>
                </div>
                <pre id="code-${req.id}" class="code-content">${responseBodyContent}</pre>
              </div>
            </div>
            <div id="rh-${req.id}" class="rtab-content" style="display:none;">
              <table class="headers-table">
                <thead><tr><th>Header</th><th>Value</th></tr></thead>
                <tbody>${resHeadersHTML}</tbody>
              </table>
            </div>
            <div id="reqb-${req.id}" class="rtab-content" style="display:none;">
              <div class="section-subtitle">Request Headers</div>
              <table class="headers-table">
                <thead><tr><th>Header</th><th>Value</th></tr></thead>
                <tbody>${reqHeadersHTML}</tbody>
              </table>
              ${req.requestBody ? `
              <div class="section-subtitle" style="margin-top:16px;">Request Body</div>
              <div class="code-block">
                <pre class="code-content">${escapeHtml(req.requestBody).substring(0, 10000)}</pre>
              </div>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(collectionName)} — Test Report</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
  <style>
    /* ─── RESET & BASE ─────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-deep:    #edf0f5;
      --bg-panel:   #f4f6fa;
      --bg-card:    #ffffff;
      --bg-inner:   #eef1f7;
      --bg-code:    #f7f9fc;

      --border:     rgba(0,0,0,0.08);
      --border-med: rgba(0,0,0,0.15);

      --text-primary:   #1a2332;
      --text-secondary: #4a5a72;
      --text-muted:     #8090aa;

      --pass-color:     #16a34a;
      --pass-bg:        rgba(22,163,74,0.08);
      --pass-border:    rgba(22,163,74,0.25);
      --pass-glow:      rgba(22,163,74,0.12);

      --warn-color:     #d97706;
      --warn-bg:        rgba(217,119,6,0.08);
      --warn-border:    rgba(217,119,6,0.25);
      --warn-glow:      rgba(217,119,6,0.12);

      --crit-color:     #dc2626;
      --crit-bg:        rgba(220,38,38,0.08);
      --crit-border:    rgba(220,38,38,0.25);
      --crit-glow:      rgba(220,38,38,0.12);

      --accent-blue:    #2563eb;
      --accent-indigo:  #4f46e5;
      --accent-cyan:    #0891b2;
      --accent-purple:  #7c3aed;

      --gradient-hero: linear-gradient(135deg, #1e3a5f 0%, #0f2846 40%, #1a1040 100%);
      --gradient-card: linear-gradient(145deg, #ffffff 0%, #f4f7fc 100%);

      --radius-sm: 6px;
      --radius-md: 12px;
      --radius-lg: 20px;

      --shadow-sm: 0 1px 4px rgba(0,0,0,0.07);
      --shadow-md: 0 4px 16px rgba(0,0,0,0.10);
      --shadow-lg: 0 8px 32px rgba(0,0,0,0.14);

      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
    }

    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

    html { scroll-behavior: smooth; overflow-y: scroll; }
    body {
      font-family: var(--font-sans);
      background: var(--bg-deep);
      color: var(--text-primary);
      min-height: 100vh;
      line-height: 1.6;
      font-size: 14px;
    }

    /* ─── HERO HEADER ───────────────────────────────────── */
    .hero {
      background: var(--gradient-hero);
      border-bottom: 1px solid rgba(59,130,246,0.2);
      padding: 48px 40px 40px;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -100px; right: -100px;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero::after {
      content: '';
      position: absolute;
      bottom: -80px; left: 20%;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-inner {
      max-width: 1300px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }
    .hero-eyebrow {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .hero-badge {
      background: linear-gradient(135deg, var(--accent-indigo), var(--accent-blue));
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 20px;
    }
    .hero-date {
      color: rgba(255,255,255,0.62);
      font-size: 12px;
    }
    .hero h1 {
      font-size: clamp(22px, 3vw, 38px);
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #67e8f9 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 10px;
      line-height: 1.2;
    }
    .hero-sub {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 16px;
    }
    .hero-meta {
      display: flex;
      align-items: center;
      gap: 7px;
      color: rgba(255,255,255,0.72);
      font-size: 13px;
    }
    .hero-meta .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--accent-cyan);
    }

    /* ─── LAYOUT ─────────────────────────────────────────── */
    .main-content {
      max-width: 1300px;
      margin: 0 auto;
      padding: 36px 40px 60px;
    }

    /* ─── STAT CARDS ─────────────────────────────────────── */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 36px;
    }
    .stat-card {
      background: var(--gradient-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 22px 20px;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s, border-color 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      border-color: var(--border-med);
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: var(--card-accent, linear-gradient(90deg, var(--accent-blue), var(--accent-indigo)));
    }
    .stat-card.green  { --card-accent: linear-gradient(90deg, #22c55e, #4ade80); }
    .stat-card.red    { --card-accent: linear-gradient(90deg, #ef4444, #f87171); }
    .stat-card.amber  { --card-accent: linear-gradient(90deg, #f59e0b, #fcd34d); }
    .stat-card.cyan   { --card-accent: linear-gradient(90deg, #06b6d4, #67e8f9); }
    .stat-card.purple { --card-accent: linear-gradient(90deg, #a855f7, #c084fc); }
    .stat-card.blue   { --card-accent: linear-gradient(90deg, #3b82f6, #60a5fa); }

    .stat-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 10px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -1px;
      line-height: 1;
      color: var(--text-primary);
    }
    .stat-sub {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 6px;
    }

    /* ─── SECTION HEADING ────────────────────────────────── */
    .section-heading {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-heading::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    /* ─── CHARTS GRID ────────────────────────────────────── */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 36px;
    }
    @media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 640px)  { .charts-grid { grid-template-columns: 1fr; } }

    .rc-legend {
      max-height: 190px;
      overflow-y: auto;
    }
    .rc-legend::-webkit-scrollbar { width: 5px; }
    .rc-legend::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 4px; }

    .chart-card {
      background: var(--gradient-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 28px 24px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .chart-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .chart-card::after {
      content: '';
      position: absolute;
      top: -60px; right: -60px;
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%);
      pointer-events: none;
    }
    .chart-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
    }
    .chart-subtitle {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 24px;
    }
    .chart-wrapper {
      position: relative;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chart-center-overlay {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
      z-index: 1;
    }
    .chart-center-value {
      font-size: 30px;
      font-weight: 800;
      color: #1a2332;
      line-height: 1.1;
      letter-spacing: -0.5px;
      font-family: var(--font-sans);
    }
    .chart-center-label {
      font-size: 10px;
      font-weight: 600;
      color: #8090aa;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      margin-top: 6px;
      font-family: var(--font-sans);
    }
    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.18s, opacity 0.18s;
      user-select: none;
    }
    .legend-item:hover { background: rgba(0,0,0,0.04); }
    .legend-item.legend-dimmed { opacity: 0.32; }
    .legend-dot {
      width: 14px; height: 14px;
      border-radius: 5px;
      flex-shrink: 0;
      box-shadow: 0 2px 5px rgba(0,0,0,0.14);
    }
    .legend-label {
      font-size: 13px;
      color: var(--text-secondary);
      flex: 1;
    }
    .legend-value {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .legend-pct {
      font-size: 12px;
      color: var(--text-muted);
      min-width: 42px;
      text-align: right;
    }

    /* ─── FILTER BAR ─────────────────────────────────────── */
    .filter-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }
    .filter-btn {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 20px;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      padding: 7px 16px;
      transition: all 0.2s;
      font-family: var(--font-sans);
    }
    .filter-btn:hover { border-color: var(--border-med); color: var(--text-primary); }
    .filter-btn.active {
      background: linear-gradient(135deg, var(--accent-indigo), var(--accent-blue));
      border-color: transparent;
      color: #fff;
    }
    .filter-btn.pass.active  { background: linear-gradient(135deg, #16a34a, #22c55e); }
    .filter-btn.warn.active  { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .filter-btn.crit.active  { background: linear-gradient(135deg, #dc2626, #ef4444); }
    .search-box {
      margin-left: auto;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 20px;
      color: var(--text-primary);
      font-size: 12px;
      padding: 7px 16px;
      outline: none;
      transition: border-color 0.2s;
      width: 220px;
      font-family: var(--font-sans);
    }
    .search-box:focus { border-color: var(--accent-blue); }
    .search-box::placeholder { color: var(--text-muted); }

    /* ─── REQUEST CARDS ──────────────────────────────────── */
    .requests-list { display: flex; flex-direction: column; gap: 10px; }

    .request-card {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      border-left: 4px solid transparent;
      overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .request-card.pass   { border-left-color: var(--pass-color);  }
    .request-card.warning{ border-left-color: var(--warn-color);  }
    .request-card.critical{ border-left-color: var(--crit-color); }
    .request-card.no-tests { background: #fffde7; border-left-color: #f9a825; }

    .request-card:hover {
      box-shadow: var(--shadow-md);
    }
    .request-card.pass:hover    { box-shadow: 0 4px 20px var(--pass-glow);  }
    .request-card.warning:hover { box-shadow: 0 4px 20px var(--warn-glow);  }
    .request-card.critical:hover{ box-shadow: 0 4px 20px var(--crit-glow);  }

    .request-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      cursor: pointer;
      user-select: none;
      gap: 12px;
    }
    .request-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }
    .request-index {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: var(--bg-inner);
      border: 1px solid var(--border-med);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      flex-shrink: 0;
    }
    .request-info { min-width: 0; flex: 1; }
    .request-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .request-url {
      font-size: 11px;
      color: var(--text-muted);
      font-family: var(--font-mono);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .request-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .request-stats { display: flex; align-items: center; gap: 6px; }

    /* Method badges */
    .method-badge {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 4px 9px;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }
    .method-badge.get    { background:rgba(22,163,74,0.10);   color:#16a34a;  border:1px solid rgba(22,163,74,0.3); }
    .method-badge.post   { background:rgba(37,99,235,0.10);   color:#2563eb;  border:1px solid rgba(37,99,235,0.3); }
    .method-badge.put    { background:rgba(217,119,6,0.10);   color:#d97706;  border:1px solid rgba(217,119,6,0.3); }
    .method-badge.patch  { background:rgba(124,58,237,0.10);  color:#7c3aed;  border:1px solid rgba(124,58,237,0.3); }
    .method-badge.delete { background:rgba(220,38,38,0.10);   color:#dc2626;  border:1px solid rgba(220,38,38,0.3); }

    /* Stat badges */
    .stat-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 4px;
      font-family: var(--font-mono);
    }
    .response-code { background: var(--bg-inner); color: var(--text-secondary); }
    .code-2xx { color: var(--pass-color); background: var(--pass-bg); }
    .code-3xx { color: var(--accent-cyan);  background: rgba(6,182,212,0.1); }
    .code-4xx { color: var(--warn-color); background: var(--warn-bg); }
    .code-5xx { color: var(--crit-color); background: var(--crit-bg); }
    .time-badge { background: rgba(99,102,241,0.1); color: var(--accent-indigo); }
    .assertion-badge { background: var(--bg-inner); color: var(--text-secondary); }

    /* Status pills */
    .status-pill {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 12px;
    }
    .status-pill.pass     { background: var(--pass-bg);  color: var(--pass-color);  border: 1px solid var(--pass-border); }
    .status-pill.warning  { background: var(--warn-bg);  color: var(--warn-color);  border: 1px solid var(--warn-border); }
    .status-pill.critical { background: var(--crit-bg);  color: var(--crit-color);  border: 1px solid var(--crit-border); }

    .chevron {
      font-size: 12px;
      color: var(--text-muted);
      transition: transform 0.2s;
      width: 20px; text-align: center;
    }
    .chevron.open { transform: rotate(180deg); }

    /* ─── REQUEST BODY PANEL ──────────────────────────────── */
    .request-body {
      border-top: 1px solid var(--border);
      background: var(--bg-inner);
      padding: 0;
    }
    .section-block {
      border-bottom: 1px solid var(--border);
      padding: 20px 24px;
    }
    .section-block:last-child { border-bottom: none; }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .section-icon { font-size: 14px; }
    .section-count {
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
      margin-left: 4px;
    }
    .section-subtitle {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 10px;
    }

    /* Dropdown toggle */
    .dropdown-toggle { cursor: pointer; margin-bottom: 0; }
    .dropdown-toggle:hover { color: var(--accent-blue); }
    .dropdown-arrow {
      margin-left: auto;
      font-size: 11px;
      transition: transform 0.2s;
    }
    .dropdown-arrow.open { transform: rotate(90deg); }
    .dropdown-content { margin-top: 14px; }

    /* ─── ASSERTIONS ──────────────────────────────────────── */
    .assertions-list { display: flex; flex-direction: column; gap: 6px; }
    .assertion-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      background: var(--bg-card);
      border: 1px solid var(--border);
    }
    .assertion-item.assertion-pass {
      border-color: rgba(34,197,94,0.2);
      background: rgba(34,197,94,0.04);
    }
    .assertion-item.assertion-fail {
      border-color: rgba(239,68,68,0.25);
      background: rgba(239,68,68,0.06);
    }
    .assertion-icon {
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .assertion-pass .assertion-icon { color: var(--pass-color); }
    .assertion-fail .assertion-icon { color: var(--crit-color); }
    .assertion-content { flex: 1; min-width: 0; }
    .assertion-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      display: block;
    }
    .assertion-error {
      display: block;
      font-size: 11px;
      color: #f87171;
      font-family: var(--font-mono);
      margin-top: 4px;
      word-break: break-word;
    }
    .no-assertions {
      font-size: 13px;
      color: var(--text-muted);
      font-style: italic;
      padding: 10px 0;
    }

    /* ─── RESPONSE TABS ───────────────────────────────────── */
    .response-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }
    .rtab {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 14px;
      margin-bottom: -1px;
      transition: color 0.2s, border-color 0.2s;
      font-family: var(--font-sans);
    }
    .rtab:hover { color: var(--text-primary); }
    .rtab.active { color: var(--accent-blue); border-bottom-color: var(--accent-blue); }

    .response-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    .meta-chip {
      font-size: 11px;
      color: var(--text-secondary);
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 3px 10px;
      border-radius: 4px;
    }
    .meta-chip strong { color: var(--text-primary); }

    /* ─── CODE BLOCK ──────────────────────────────────────── */
    .code-block {
      background: var(--bg-code);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: var(--radius-sm);
      position: relative;
      overflow: hidden;
    }
    .code-btn-group {
      position: absolute;
      top: 10px; right: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 1;
    }
    .copy-btn {
      background: rgba(0,0,0,0.05);
      border: 1px solid rgba(0,0,0,0.12);
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: var(--font-sans);
      transition: all 0.2s;
    }
    .copy-btn:hover { background: rgba(0,0,0,0.10); color: var(--text-primary); }
    .download-btn { background: rgba(37,99,235,0.07); border-color: rgba(37,99,235,0.2); color: var(--accent-blue); }
    .download-btn:hover { background: rgba(37,99,235,0.15); color: var(--accent-blue); }
    .code-content {
      font-family: var(--font-mono);
      font-size: 12px;
      color: #3a4660;
      line-height: 1.7;
      overflow: auto;
      max-height: 400px;
      padding: 16px;
      white-space: pre;
      tab-size: 2;
    }

    /* ─── HEADERS TABLE ───────────────────────────────────── */
    .headers-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .headers-table th {
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
    }
    .headers-table td {
      padding: 8px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      vertical-align: top;
      word-break: break-word;
    }
    .header-key {
      color: var(--accent-cyan);
      font-family: var(--font-mono);
      white-space: nowrap;
      width: 35%;
    }
    .header-val { color: var(--text-secondary); }
    .empty-row { color: var(--text-muted); text-align: center; padding: 16px; font-style: italic; }

    /* ─── FOOTER ──────────────────────────────────────────── */
    .report-footer {
      text-align: center;
      padding: 30px 20px;
      color: var(--text-muted);
      font-size: 12px;
      border-top: 1px solid var(--border);
    }
    .report-footer span { color: var(--text-secondary); }

    /* ─── SCROLLBAR ───────────────────────────────────────── */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: var(--bg-panel); border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.22); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.38); }

    /* ─── ANIMATIONS ──────────────────────────────────────── */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .request-card { animation: fadeInUp 0.3s ease both; animation-delay: calc(var(--card-idx, 0) * 0.02s); }

    .hidden { display: none !important; }
  </style>
</head>
<body>

<!-- ─── HERO ─────────────────────────────────────────── -->
<header class="hero">
  <div class="hero-inner">
    <div class="hero-eyebrow">
      <span class="hero-badge">Newman · Test Report</span>
      <span class="hero-date">${formattedDate}</span>
    </div>
    <h1>${escapeHtml(collectionName)}</h1>
    <div class="hero-sub">
      <div class="hero-meta"><div class="dot"></div>Environment: ${escapeHtml(environment)}</div>
      <div class="hero-meta"><div class="dot"></div>Duration: ${durationSec}s</div>
      <div class="hero-meta"><div class="dot"></div>${requests.length} Requests</div>
      <div class="hero-meta"><div class="dot"></div>${summary.total} Assertions</div>
    </div>
  </div>
</header>

<!-- ─── MAIN ──────────────────────────────────────────── -->
<main class="main-content">

  <!-- STAT CARDS -->
  <div class="stat-grid">
    <div class="stat-card green">
      <div class="stat-label">Tests Passed</div>
      <div class="stat-value">${summary.passed}</div>
      <div class="stat-sub">${passRate}% pass rate</div>
    </div>
    <div class="stat-card red">
      <div class="stat-label">Tests Failed</div>
      <div class="stat-value">${summary.failed}</div>
      <div class="stat-sub">of ${summary.total} total tests</div>
    </div>
    <div class="stat-card blue">
      <div class="stat-label">APIs Passed</div>
      <div class="stat-value">${summary.passedRequests}</div>
      <div class="stat-sub">${apiPassRate}% of requests</div>
    </div>
    <div class="stat-card amber">
      <div class="stat-label">APIs Failed</div>
      <div class="stat-value">${summary.failedRequests}</div>
      <div class="stat-sub">of ${summary.totalRequests} requests</div>
    </div>
    <div class="stat-card cyan">
      <div class="stat-label">Avg Response</div>
      <div class="stat-value">${avgResponseTime}<span style="font-size:16px;font-weight:500;color:var(--text-secondary)">ms</span></div>
      <div class="stat-sub">response time</div>
    </div>
    <div class="stat-card purple">
      <div class="stat-label">Duration</div>
      <div class="stat-value">${durationSec}<span style="font-size:16px;font-weight:500;color:var(--text-secondary)">s</span></div>
      <div class="stat-sub">total run time</div>
    </div>
  </div>

  <!-- CHARTS -->
  <div class="section-heading">Analytics</div>
  <div class="charts-grid">
    <!-- Test Cases Pie -->
    <div class="chart-card">
      <div class="chart-title">Test Case Results</div>
      <div class="chart-subtitle">Pass / Fail breakdown across all assertions</div>
      <div class="chart-wrapper">
        <canvas id="testChart"></canvas>
        <div class="chart-center-overlay">
          <div class="chart-center-value">${passRate}%</div>
          <div class="chart-center-label">PASS RATE</div>
        </div>
      </div>
      <div class="chart-legend">
        <div class="legend-item" data-chart="test" data-idx="0">
          <div class="legend-dot" style="background:linear-gradient(135deg,#15803d,#22c55e,#4ade80)"></div>
          <span class="legend-label">Passed Tests</span>
          <span class="legend-value">${summary.passed}</span>
          <span class="legend-pct">${passRate}%</span>
        </div>
        <div class="legend-item" data-chart="test" data-idx="1">
          <div class="legend-dot" style="background:linear-gradient(135deg,#b91c1c,#ef4444,#fca5a5)"></div>
          <span class="legend-label">Failed Tests</span>
          <span class="legend-value">${summary.failed}</span>
          <span class="legend-pct">${(100 - parseFloat(passRate)).toFixed(1)}%</span>
        </div>
      </div>
    </div>

    <!-- APIs Pie -->
    <div class="chart-card">
      <div class="chart-title">API Health Status</div>
      <div class="chart-subtitle">Requests grouped by failure severity</div>
      <div class="chart-wrapper">
        <canvas id="apiChart"></canvas>
        <div class="chart-center-overlay">
          <div class="chart-center-value">${summary.totalRequests}</div>
          <div class="chart-center-label">TOTAL APIs</div>
        </div>
      </div>
      <div class="chart-legend">
        <div class="legend-item" data-chart="api" data-idx="0">
          <div class="legend-dot" style="background:linear-gradient(135deg,#15803d,#22c55e,#4ade80)"></div>
          <span class="legend-label">All Tests Passed</span>
          <span class="legend-value">${requests.filter(r => r.status === 'pass').length}</span>
          <span class="legend-pct">${summary.totalRequests > 0 ? ((requests.filter(r => r.status === 'pass').length / summary.totalRequests) * 100).toFixed(0) : 0}%</span>
        </div>
        <div class="legend-item" data-chart="api" data-idx="1">
          <div class="legend-dot" style="background:linear-gradient(135deg,#b45309,#f59e0b,#fde68a)"></div>
          <span class="legend-label">≤2 Failures</span>
          <span class="legend-value">${requests.filter(r => r.status === 'warning').length}</span>
          <span class="legend-pct">${summary.totalRequests > 0 ? ((requests.filter(r => r.status === 'warning').length / summary.totalRequests) * 100).toFixed(0) : 0}%</span>
        </div>
        <div class="legend-item" data-chart="api" data-idx="2">
          <div class="legend-dot" style="background:linear-gradient(135deg,#b91c1c,#ef4444,#fca5a5)"></div>
          <span class="legend-label">&gt;2 Failures</span>
          <span class="legend-value">${requests.filter(r => r.status === 'critical').length}</span>
          <span class="legend-pct">${summary.totalRequests > 0 ? ((requests.filter(r => r.status === 'critical').length / summary.totalRequests) * 100).toFixed(0) : 0}%</span>
        </div>
      </div>
    </div>

    <!-- Response Code Pie -->
    <div class="chart-card">
      <div class="chart-title">Response Code Distribution</div>
      <div class="chart-subtitle">HTTP status codes returned across all requests</div>
      <div class="chart-wrapper">
        <canvas id="rcChart"></canvas>
        <div class="chart-center-overlay">
          <div class="chart-center-value">${rcEntries.length}</div>
          <div class="chart-center-label">STATUS CODES</div>
        </div>
      </div>
      <div class="chart-legend rc-legend">
        ${rcLegendHTML}
      </div>
    </div>
  </div>

  <!-- REQUEST LIST -->
  <div class="section-heading">API Requests</div>
  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterRequests('all', this)">All (${requests.length})</button>
    <button class="filter-btn pass" onclick="filterRequests('pass', this)">✓ Passed (${requests.filter(r => r.status === 'pass').length})</button>
    <button class="filter-btn warn" onclick="filterRequests('warning', this)">⚠ Warning (${requests.filter(r => r.status === 'warning').length})</button>
    <button class="filter-btn crit" onclick="filterRequests('critical', this)">✕ Critical (${requests.filter(r => r.status === 'critical').length})</button>
    <input type="text" class="search-box" placeholder="🔍 Search requests…" oninput="searchRequests(this.value)" />
  </div>

  <div class="requests-list" id="requestsList">
    ${requestCardsHTML}
  </div>

</main>

<footer class="report-footer">
  Generated by <span>Newman_Report</span> · ${formattedDate} &nbsp;·&nbsp; Created By <span>${escapeHtml(createdBy)}</span>
</footer>

<!-- ─── SCRIPTS ──────────────────────────────────────── -->
<script>
// ── Chart.js Doughnut Charts ──────────────────────────
(function() {
  const PASS     = ${summary.passed};
  const FAIL     = ${summary.failed};
  const API_PASS = ${requests.filter(r => r.status === 'pass').length};
  const API_WARN = ${requests.filter(r => r.status === 'warning').length};
  const API_CRIT = ${requests.filter(r => r.status === 'critical').length};
  const RC_LABELS = ${JSON.stringify(rcEntries.map(([code]) => code))};
  const RC_COUNTS = ${JSON.stringify(rcEntries.map(([, count]) => count))};
  const RC_COLORS = ${JSON.stringify(rcColors)};

  Chart.defaults.color = '#4a5a72';
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  Chart.defaults.devicePixelRatio = 4;

  // 3-stop arc gradient for rich colour depth on each segment
  function arcGrad(ctx, light, mid, deep) {
    const g = ctx.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0,    light);
    g.addColorStop(0.48, mid);
    g.addColorStop(1,    deep);
    return g;
  }

  // Fresh options object per chart — prevents Chart.js from mutating shared state
  function makeOpts(labelSuffix) {
    return {
      cutout: '74%',
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 4,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#1a2332',
          bodyColor: '#4a5a72',
          borderColor: 'rgba(0,0,0,0.14)',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 10,
          boxPadding: 6,
          titleFont: { size: 13, weight: '700', family: "'Plus Jakarta Sans', sans-serif" },
          bodyFont:  { size: 12,               family: "'Plus Jakarta Sans', sans-serif" },
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0.0';
              return \`  \${ctx.label}: \${ctx.raw}\${labelSuffix} (\${pct}%)\`;
            }
          }
        }
      },
      animation: { animateRotate: true, duration: 1200, easing: 'easeOutCubic' }
    };
  }

  // Init after font + layout settle — guarantees crisp arc rendering
  document.fonts.ready.then(function() { requestAnimationFrame(function() {

    // ── Test Cases Chart ───────────────────────────────
    const tcCtx = document.getElementById('testChart').getContext('2d');
    const testChartInst = new Chart(tcCtx, {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed'],
        datasets: [{
          data: [PASS, FAIL],
          backgroundColor: [
            arcGrad(tcCtx, '#4ade80', '#22c55e', '#15803d'),
            arcGrad(tcCtx, '#fca5a5', '#ef4444', '#b91c1c')
          ],
          borderColor: '#ffffff',
          borderWidth: 4,
          borderRadius: 6,
          hoverOffset: 18,
          hoverBorderWidth: 0,
        }]
      },
      options: makeOpts(''),
    });

    // ── API Health Chart ───────────────────────────────
    const acCtx = document.getElementById('apiChart').getContext('2d');
    const apiChartInst = new Chart(acCtx, {
      type: 'doughnut',
      data: {
        labels: ['All Passed', '≤2 Failures', '>2 Failures'],
        datasets: [{
          data: [API_PASS, API_WARN, API_CRIT],
          backgroundColor: [
            arcGrad(acCtx, '#4ade80', '#22c55e', '#15803d'),
            arcGrad(acCtx, '#fde68a', '#f59e0b', '#b45309'),
            arcGrad(acCtx, '#fca5a5', '#ef4444', '#b91c1c')
          ],
          borderColor: '#ffffff',
          borderWidth: 4,
          borderRadius: 6,
          hoverOffset: 18,
          hoverBorderWidth: 0,
        }]
      },
      options: makeOpts(' APIs'),
    });

    // ── Response Code Chart ────────────────────────────
    const rcCtx = document.getElementById('rcChart').getContext('2d');
    const rcChartInst = new Chart(rcCtx, {
      type: 'doughnut',
      data: {
        labels: RC_LABELS,
        datasets: [{
          data: RC_COUNTS,
          backgroundColor: RC_COLORS,
          borderColor: '#ffffff',
          borderWidth: 3,
          borderRadius: 5,
          hoverOffset: 18,
          hoverBorderWidth: 0,
        }]
      },
      options: makeOpts(''),
    });

    // ── Legend click-to-toggle ─────────────────────────
    document.querySelectorAll('.legend-item[data-chart]').forEach(el => {
      el.addEventListener('click', () => {
        const chart = el.dataset.chart === 'test' ? testChartInst
                    : el.dataset.chart === 'api'  ? apiChartInst
                    : rcChartInst;
        chart.toggleDataVisibility(parseInt(el.dataset.idx, 10));
        chart.update();
        el.classList.toggle('legend-dimmed');
      });
    });

  }); });
})();

// ── Toggle Card ───────────────────────────────────────
function toggleCard(id) {
  const body = document.getElementById('body-' + id);
  const chevron = document.getElementById('chevron-' + id);
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (isOpen) chevron.classList.remove('open');
  else chevron.classList.add('open');
}

// ── Toggle Dropdown ───────────────────────────────────
function toggleDropdown(id) {
  const content = document.getElementById(id);
  const arrow = document.getElementById('darrow-' + id);
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) {
    if (isOpen) arrow.classList.remove('open');
    else arrow.classList.add('open');
  }
}

// ── Switch Response Tab ───────────────────────────────
function switchTab(btn, contentId) {
  const panel = btn.closest('.request-body');
  panel.querySelectorAll('.rtab').forEach(b => b.classList.remove('active'));
  panel.querySelectorAll('.rtab-content').forEach(c => c.style.display = 'none');
  btn.classList.add('active');
  document.getElementById(contentId).style.display = 'block';
}

// ── Filter Requests ───────────────────────────────────
function filterRequests(status, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.request-card').forEach(card => {
    if (status === 'all' || card.classList.contains(status)) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// ── Search Requests ───────────────────────────────────
function searchRequests(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.request-card').forEach(card => {
    const name = card.querySelector('.request-name')?.textContent?.toLowerCase() || '';
    const url  = card.querySelector('.request-url')?.textContent?.toLowerCase() || '';
    if (!q || name.includes(q) || url.includes(q)) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// ── Copy Code ─────────────────────────────────────────
function copyCode(id) {
  const text = document.getElementById(id)?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(\`[onclick="copyCode('\${id}')"]\`);
    if (btn) {
      btn.textContent = 'Copied!';
      btn.style.color = '#4ade80';
      setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = ''; }, 2000);
    }
  }).catch(() => {});
}

// ── Download Code ─────────────────────────────────────
function downloadCode(btn) {
  const id = btn.dataset.codeid;
  const text = document.getElementById(id)?.textContent || '';
  const sanitize = s => s.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const filename = sanitize(btn.dataset.report) + '_' + sanitize(btn.dataset.api) + '.txt';
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  btn.textContent = 'Downloaded!';
  btn.style.color = '#4ade80';
  setTimeout(() => { btn.textContent = 'Download'; btn.style.color = ''; }, 2000);
}
</script>

</body>
</html>`;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

module.exports = generateHTML;
