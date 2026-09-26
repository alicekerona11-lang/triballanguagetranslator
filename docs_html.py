"""
Interactive API Documentation generator for /docs endpoint.
Renders an official Government Public Service API Explorer with live test console.
"""

def get_docs_html():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Documentation | Tribal Language Learning &amp; Classroom Communication</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/css/gov-theme.css">
  <link rel="stylesheet" href="/css/components.css">
  <style>
    body { background-color: #F7F9F7; }
    .api-header { background: #075E2A; color: #FFF; padding: 2rem 0; border-bottom: 4px solid #138808; }
    .endpoint-card { background: #FFF; border: 1px solid #D9E2DC; border-radius: 4px; margin-bottom: 1.5rem; overflow: hidden; }
    .endpoint-head { padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
    .endpoint-head.get { background: #EBF5FB; border-left: 5px solid #2980B9; }
    .endpoint-head.post { background: #EAF6EA; border-left: 5px solid #138808; }
    .endpoint-head.put { background: #FEF9E7; border-left: 5px solid #F39C12; }
    .endpoint-head.delete { background: #FDEDEC; border-left: 5px solid #C0392B; }
    .method-badge { font-weight: 800; font-size: 0.8125rem; padding: 0.2rem 0.6rem; border-radius: 3px; color: #FFF; }
    .method-get { background: #2980B9; }
    .method-post { background: #138808; }
    .method-put { background: #F39C12; }
    .method-delete { background: #C0392B; }
    .endpoint-body { padding: 1.25rem; border-top: 1px solid #D9E2DC; display: none; }
    .endpoint-body.open { display: block; }
    .code-block { background: #1A2421; color: #81E6D9; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 0.875rem; overflow-x: auto; }
    .try-btn { background: #138808; color: #FFF; border: none; padding: 0.4rem 0.85rem; border-radius: 3px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>

  <div class="api-header">
    <div class="gov-container">
      <div style="font-size: 0.8125rem; letter-spacing: 0.5px; text-transform: uppercase; color: #B8F2B8;">Public Digital Service API Reference</div>
      <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0.25rem 0;">Tribal Language Platform REST API (v1.0)</h1>
      <p style="color: #E2ECE5; font-size: 0.9375rem;">Role-Based Authentication, Classroom Voice Translation, Offline Sync &amp; Curricula Endpoints</p>
    </div>
  </div>

  <div class="gov-container" style="padding-top: 2rem; padding-bottom: 3rem;">
    
    <div class="gov-panel-green" style="margin-bottom: 2rem;">
      <h3 style="color: var(--gov-green-dark); margin-bottom: 0.5rem;">Authentication &amp; RBAC Information</h3>
      <p style="font-size: 0.9375rem; color: var(--gov-text-primary); margin-bottom: 0.75rem;">
        Protected endpoints require the <code>Authorization: Bearer &lt;token&gt;</code> header. Tokens are signed using RFC 7519 HS256 with role claims (<code>STUDENT</code>, <code>TEACHER</code>, <code>AUTHORITY</code>).
      </p>
      <div style="font-size: 0.8125rem; color: var(--gov-text-secondary);">
        <strong>Demo Credentials:</strong><br>
        • Student: <code>student@example.com</code> / <code>Password@123</code><br>
        • Teacher: <code>teacher@example.com</code> / <code>Password@123</code><br>
        • Authority: <code>authority@example.com</code> / <code>Password@123</code>
      </div>
    </div>

    <!-- Health Check Endpoint -->
    <div class="endpoint-card">
      <div class="endpoint-head get" onclick="toggleEndpoint(this)">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="method-badge method-get">GET</span>
          <strong style="font-family: monospace; font-size: 1.05rem;">/health</strong>
          <span style="font-size: 0.875rem; color: #5B6573;">System Health Check &amp; Database Status</span>
        </div>
        <span style="font-size: 0.8125rem; color: #075E2A; font-weight: 700;">Public</span>
      </div>
      <div class="endpoint-body">
        <p>Returns health status, active SQLite database verification, and server timestamp.</p>
        <button class="try-btn" onclick="executeTry(this, 'GET', '/health', null, false)">Execute Request</button>
        <div class="response-box" style="margin-top: 1rem;"></div>
      </div>
    </div>

    <!-- Auth Login Endpoint -->
    <div class="endpoint-card">
      <div class="endpoint-head post" onclick="toggleEndpoint(this)">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="method-badge method-post">POST</span>
          <strong style="font-family: monospace; font-size: 1.05rem;">/api/auth/login</strong>
          <span style="font-size: 0.875rem; color: #5B6573;">User Authentication &amp; JWT Generation</span>
        </div>
        <span style="font-size: 0.8125rem; color: #075E2A; font-weight: 700;">Public</span>
      </div>
      <div class="endpoint-body">
        <p>Validates credentials against PBKDF2 hashes, verifies assigned role, and returns signed JWT.</p>
        <div style="margin-bottom: 0.75rem;">
          <label style="font-size: 0.8125rem; font-weight: 700;">Request Body (JSON):</label>
          <textarea class="gov-textarea req-body" rows="4">{"email": "teacher@example.com", "password": "Password@123", "role": "TEACHER"}</textarea>
        </div>
        <button class="try-btn" onclick="executeTry(this, 'POST', '/api/auth/login', this.previousElementSibling.querySelector('textarea').value, false)">Execute Request</button>
        <div class="response-box" style="margin-top: 1rem;"></div>
      </div>
    </div>

    <!-- Auth Me Endpoint -->
    <div class="endpoint-card">
      <div class="endpoint-head get" onclick="toggleEndpoint(this)">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="method-badge method-get">GET</span>
          <strong style="font-family: monospace; font-size: 1.05rem;">/api/auth/me</strong>
          <span style="font-size: 0.875rem; color: #5B6573;">Current Authenticated Profile</span>
        </div>
        <span style="font-size: 0.8125rem; color: #C62828; font-weight: 700;">Protected (JWT)</span>
      </div>
      <div class="endpoint-body">
        <p>Returns the verified user object extracted from the decoded JWT token.</p>
        <button class="try-btn" onclick="executeTry(this, 'GET', '/api/auth/me', null, true)">Execute Request</button>
        <div class="response-box" style="margin-top: 1rem;"></div>
      </div>
    </div>

    <!-- Student Dashboard Endpoint -->
    <div class="endpoint-card">
      <div class="endpoint-head get" onclick="toggleEndpoint(this)">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="method-badge method-get">GET</span>
          <strong style="font-family: monospace; font-size: 1.05rem;">/api/student/dashboard</strong>
          <span style="font-size: 0.875rem; color: #5B6573;">Student Learning &amp; Course Progress</span>
        </div>
        <span style="font-size: 0.8125rem; color: #C62828; font-weight: 700;">Role: STUDENT</span>
      </div>
      <div class="endpoint-body">
        <p>Fetches real course progress %, completed lessons, and assigned school details.</p>
        <button class="try-btn" onclick="executeTry(this, 'GET', '/api/student/dashboard', null, true)">Execute Request</button>
        <div class="response-box" style="margin-top: 1rem;"></div>
      </div>
    </div>

    <!-- Teacher Dashboard Endpoint -->
    <div class="endpoint-card">
      <div class="endpoint-head get" onclick="toggleEndpoint(this)">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="method-badge method-get">GET</span>
          <strong style="font-family: monospace; font-size: 1.05rem;">/api/teacher/dashboard</strong>
          <span style="font-size: 0.875rem; color: #5B6573;">Teacher Classes &amp; Student Progress Roster</span>
        </div>
        <span style="font-size: 0.8125rem; color: #C62828; font-weight: 700;">Role: TEACHER</span>
      </div>
      <div class="endpoint-body">
        <p>Fetches assigned classes, enrolled student progress percentages, and cached offline materials.</p>
        <button class="try-btn" onclick="executeTry(this, 'GET', '/api/teacher/dashboard', null, true)">Execute Request</button>
        <div class="response-box" style="margin-top: 1rem;"></div>
      </div>
    </div>

    <!-- Authority Dashboard Endpoint -->
    <div class="endpoint-card">
      <div class="endpoint-head get" onclick="toggleEndpoint(this)">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="method-badge method-get">GET</span>
          <strong style="font-family: monospace; font-size: 1.05rem;">/api/authority/dashboard</strong>
          <span style="font-size: 0.875rem; color: #5B6573;">State-wide Metrics &amp; Administrative Roster</span>
        </div>
        <span style="font-size: 0.8125rem; color: #C62828; font-weight: 700;">Role: AUTHORITY</span>
      </div>
      <div class="endpoint-body">
        <p>Returns live database metrics for registered schools, teachers, students, and learning materials.</p>
        <button class="try-btn" onclick="executeTry(this, 'GET', '/api/authority/dashboard', null, true)">Execute Request</button>
        <div class="response-box" style="margin-top: 1rem;"></div>
      </div>
    </div>

    <!-- Translation Endpoint -->
    <div class="endpoint-card">
      <div class="endpoint-head post" onclick="toggleEndpoint(this)">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="method-badge method-post">POST</span>
          <strong style="font-family: monospace; font-size: 1.05rem;">/api/translate</strong>
          <span style="font-size: 0.875rem; color: #5B6573;">Classroom Speech &amp; Text Translation Engine</span>
        </div>
        <span style="font-size: 0.8125rem; color: #C62828; font-weight: 700;">Protected (JWT)</span>
      </div>
      <div class="endpoint-body">
        <p>Executes bidirectional Hindi ↔ Santali Ol Chiki translation and logs translation record to database.</p>
        <div style="margin-bottom: 0.75rem;">
          <textarea class="gov-textarea req-body" rows="3">{"text": "नमस्ते बच्चों, अपनी किताबें खोलिए।", "source_lang": "hi", "target_lang": "sat"}</textarea>
        </div>
        <button class="try-btn" onclick="executeTry(this, 'POST', '/api/translate', this.previousElementSibling.querySelector('textarea').value, true)">Execute Request</button>
        <div class="response-box" style="margin-top: 1rem;"></div>
      </div>
    </div>

    <!-- Sync Queue Endpoint -->
    <div class="endpoint-card">
      <div class="endpoint-head post" onclick="toggleEndpoint(this)">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="method-badge method-post">POST</span>
          <strong style="font-family: monospace; font-size: 1.05rem;">/api/sync</strong>
          <span style="font-size: 0.875rem; color: #5B6573;">Batch Offline Synchronization Queue</span>
        </div>
        <span style="font-size: 0.8125rem; color: #C62828; font-weight: 700;">Protected (JWT)</span>
      </div>
      <div class="endpoint-body">
        <p>Receives local device queue batches and commits updates to SQLite in an atomic transaction.</p>
        <div style="margin-bottom: 0.75rem;">
          <textarea class="gov-textarea req-body" rows="4">{"items": [{"action": "COMPLETE_LESSON", "lesson_id": "LES-02", "progress": 100}]}</textarea>
        </div>
        <button class="try-btn" onclick="executeTry(this, 'POST', '/api/sync', this.previousElementSibling.querySelector('textarea').value, true)">Execute Request</button>
        <div class="response-box" style="margin-top: 1rem;"></div>
      </div>
    </div>

  </div>

  <script>
    function toggleEndpoint(head) {
      const body = head.nextElementSibling;
      body.classList.toggle('open');
    }

    async function executeTry(btn, method, url, body, requireAuth) {
      const box = btn.nextElementSibling;
      box.innerHTML = '<div style="color: #5B6573;">Executing...</div>';
      const headers = { 'Content-Type': 'application/json' };
      if (requireAuth) {
        const token = localStorage.getItem('gov_auth_token') || sessionStorage.getItem('gov_auth_token');
        if (token) {
          headers['Authorization'] = 'Bearer ' + token;
        } else {
          box.innerHTML = '<div class="code-block" style="color: #F87171;">Error: No authentication token found in browser storage. Please log in via the application first, or use /api/auth/login.</div>';
          return;
        }
      }

      try {
        const opts = { method, headers };
        if (body && method !== 'GET') opts.body = body;
        const res = await fetch(url, opts);
        const data = await res.json();
        if (url === '/api/auth/login' && data.token) {
          sessionStorage.setItem('gov_auth_token', data.token);
        }
        box.innerHTML = `
          <div style="margin-bottom: 0.4rem; font-weight: 700; font-size: 0.8125rem; color: ${res.ok ? '#138808' : '#C62828'};">
            HTTP Status: ${res.status} ${res.statusText}
          </div>
          <pre class="code-block">${JSON.stringify(data, null, 2)}</pre>
        `;
      } catch (err) {
        box.innerHTML = `<div class="code-block" style="color: #F87171;">Network Error: ${err.message}</div>`;
      }
    }
  </script>
</body>
</html>"""
