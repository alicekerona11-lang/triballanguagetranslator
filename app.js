/* ==========================================================================
   MAIN APPLICATION ROUTER & REAL DATA INTERACTION CONTROLLER
   Integrated with Authentication, JWT RBAC, SQLite REST API, and Offline Sync.
   ========================================================================== */

const App = {
  currentRole: null,
  currentView: "landing",
  activeLoginRole: "STUDENT",
  flashcardIndex: 0,
  activeLessonId: null,

  init() {
    this.bindEvents();
    this.initFlashcards();

    // Initialize sub-engines
    OfflineManager.init();
    VoiceTranslator.init();

    // Check if previously authenticated session exists
    if (Auth.isAuthenticated()) {
      const user = Auth.getUser();
      Auth.updateAuthUI();
      if (user.role === "STUDENT") {
        this.switchView("student");
        this.loadStudentDashboard();
      } else if (user.role === "TEACHER") {
        this.switchView("teacher");
        this.loadTeacherDashboard();
      } else if (user.role === "AUTHORITY") {
        this.switchView("authority");
        this.loadAuthorityDashboard();
      }
    } else {
      Auth.updateAuthUI();
      // Default view
      this.switchView("landing");
    }
  },

  // ------------------------------------------------------------------------
  // View & Route Navigation
  // ------------------------------------------------------------------------
  switchView(viewId) {
    // Route guard check
    if (!Auth.guardRoute(viewId)) {
      return;
    }

    this.currentView = viewId;

    // Hide all views
    document.querySelectorAll(".gov-view").forEach(v => {
      v.classList.remove("active-view");
    });

    // Show target view
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.add("active-view");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Update main nav active indicators
    document.querySelectorAll(".gov-nav-link").forEach(link => {
      if (link.dataset.view === viewId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Render navigation according to current role
    const user = Auth.getUser();
    this.renderNavForRole(user ? user.role.toLowerCase() : "public");
  },

  openRoleSelection() {
    this.switchView("login");
  },

  openLoginForm(role) {
    this.activeLoginRole = role.toUpperCase();
    this.switchView("login-form");

    const badge = document.getElementById("login-form-role-badge");
    const heading = document.getElementById("login-form-heading");
    const submitBtn = document.getElementById("btn-login-submit");
    const showHideGroup = document.getElementById("auth-pwd-toggle-group");
    const emailInput = document.getElementById("login-email");
    const pwdInput = document.getElementById("login-password");
    const demoInfo = document.getElementById("demo-credentials-info");
    const errorEl = document.getElementById("login-error-msg");

    if (errorEl) errorEl.style.display = "none";
    if (emailInput) emailInput.value = "";
    if (pwdInput) pwdInput.value = "";

    if (badge) badge.textContent = `${this.activeLoginRole} LOGIN`;
    if (heading) heading.textContent = `${this.activeLoginRole.charAt(0) + this.activeLoginRole.slice(1).toLowerCase()} Access Portal`;
    if (submitBtn) submitBtn.textContent = this.activeLoginRole === "AUTHORITY" ? "Secure Login" : "Login";

    // Show password toggle is required on Authority login
    if (showHideGroup) {
      showHideGroup.style.display = this.activeLoginRole === "AUTHORITY" ? "inline-block" : "none";
    }

    // Demo credentials information
    if (demoInfo) {
      if (this.activeLoginRole === "STUDENT") {
        demoInfo.innerHTML = `Demo Student: <code>student@example.com</code> | Password: <code>Password@123</code>`;
      } else if (this.activeLoginRole === "TEACHER") {
        demoInfo.innerHTML = `Demo Teacher: <code>teacher@example.com</code> | Password: <code>Password@123</code>`;
      } else {
        demoInfo.innerHTML = `Demo Authority: <code>authority@example.com</code> | Password: <code>Password@123</code>`;
      }
    }
  },

  fillDemoCredentials() {
    const emailInput = document.getElementById("login-email");
    const pwdInput = document.getElementById("login-password");
    if (this.activeLoginRole === "STUDENT") {
      if (emailInput) emailInput.value = "student@example.com";
      if (pwdInput) pwdInput.value = "Password@123";
    } else if (this.activeLoginRole === "TEACHER") {
      if (emailInput) emailInput.value = "teacher@example.com";
      if (pwdInput) pwdInput.value = "Password@123";
    } else {
      if (emailInput) emailInput.value = "authority@example.com";
      if (pwdInput) pwdInput.value = "Password@123";
    }
  },

  renderNavForRole(role) {
    const navContainer = document.getElementById("gov-main-nav-items");
    if (!navContainer) return;

    let items = [];

    if (role === "teacher") {
      items = [
        { id: "teacher", label: "Dashboard", icon: "dashboard" },
        { id: "translator", label: "Translator", icon: "mic" },
        { id: "materials", label: "Materials", icon: "folder" },
        { id: "help", label: "Help", icon: "help" }
      ];
    } else if (role === "student") {
      items = [
        { id: "student", label: "Dashboard", icon: "dashboard" },
        { id: "flashcards-tab", label: "Flashcards", icon: "cards" },
        { id: "translator", label: "Voice Translator", icon: "mic" },
        { id: "help", label: "Help", icon: "help" }
      ];
    } else if (role === "authority") {
      items = [
        { id: "authority", label: "Dashboard", icon: "dashboard" },
        { id: "auth-users-sec", label: "User Management", icon: "users" },
        { id: "auth-curr-sec", label: "Curriculum", icon: "curriculum" },
        { id: "auth-sync-sec", label: "Synchronization", icon: "sync" }
      ];
    } else {
      // Public
      items = [
        { id: "landing", label: "Portal Home", icon: "home" },
        { id: "login", label: "Login / Role Selection", icon: "building" },
        { id: "translator", label: "Voice Translator", icon: "mic" }
      ];
    }

    navContainer.innerHTML = items.map(item => `
      <li class="gov-nav-item">
        <button type="button" class="gov-nav-link ${this.currentView === item.id ? 'active' : ''}" data-view="${item.id}">
          ${this.getNavIconSvg(item.icon)}
          <span>${item.label}</span>
        </button>
      </li>
    `).join("");

    navContainer.querySelectorAll(".gov-nav-link").forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        if (view === "teacher" || view === "student" || view === "authority" || view === "landing" || view === "translator" || view === "login") {
          this.switchView(view);
        } else if (view === "flashcards-tab") {
          this.switchView("student");
          setTimeout(() => {
            const fcSec = document.getElementById("flashcard-section");
            if (fcSec) fcSec.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else if (view === "auth-users-sec") {
          this.switchView("authority");
          setTimeout(() => {
            const sec = document.getElementById("auth-users-section");
            if (sec) sec.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else if (view === "auth-curr-sec") {
          this.switchView("authority");
          setTimeout(() => {
            const sec = document.getElementById("auth-curriculum-section");
            if (sec) sec.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else if (view === "auth-sync-sec") {
          this.switchView("authority");
          setTimeout(() => {
            const sec = document.getElementById("auth-sync-section");
            if (sec) sec.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else {
          alert(`Viewing section: [${btn.innerText.trim()}]`);
        }
      });
    });
  },

  getNavIconSvg(type) {
    const icons = {
      dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`,
      mic: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
      book: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
      folder: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
      cards: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
      users: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
      curriculum: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
      sync: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
      home: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`,
      help: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
      building: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="2"></line></svg>`
    };
    return icons[type] || icons.dashboard;
  },

  // ------------------------------------------------------------------------
  // Event Binding
  // ------------------------------------------------------------------------
  bindEvents() {
    // Role selection buttons
    const btnStudentRole = document.getElementById("btn-select-student-role");
    if (btnStudentRole) {
      btnStudentRole.addEventListener("click", () => this.openLoginForm("STUDENT"));
    }
    const btnTeacherRole = document.getElementById("btn-select-teacher-role");
    if (btnTeacherRole) {
      btnTeacherRole.addEventListener("click", () => this.openLoginForm("TEACHER"));
    }
    const btnAuthorityRole = document.getElementById("btn-select-authority-role");
    if (btnAuthorityRole) {
      btnAuthorityRole.addEventListener("click", () => this.openLoginForm("AUTHORITY"));
    }

    // Login Form Submit
    const loginForm = document.getElementById("login-auth-form");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        await Auth.login(email, password, this.activeLoginRole);
      });
    }

    // Toggle Password Visibility (Authority)
    const togglePwdBtn = document.getElementById("btn-toggle-password");
    if (togglePwdBtn) {
      togglePwdBtn.addEventListener("click", () => {
        const pwdInput = document.getElementById("login-password");
        if (pwdInput.type === "password") {
          pwdInput.type = "text";
          togglePwdBtn.textContent = "Hide";
        } else {
          pwdInput.type = "password";
          togglePwdBtn.textContent = "Show";
        }
      });
    }

    // Fill Demo Credentials Button
    const btnFillDemo = document.getElementById("btn-fill-demo");
    if (btnFillDemo) {
      btnFillDemo.addEventListener("click", () => this.fillDemoCredentials());
    }

    // Logout Button
    const btnLogout = document.getElementById("btn-header-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => Auth.logout());
    }

    // Forgot Password link
    const forgotLinks = document.querySelectorAll(".link-forgot-password");
    forgotLinks.forEach(l => {
      l.addEventListener("click", (e) => {
        e.preventDefault();
        this.openForgotPasswordModal();
      });
    });

    // Reset Password Form Submit
    const resetForm = document.getElementById("form-reset-password");
    if (resetForm) {
      resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("reset-email").value;
        const newPwd = document.getElementById("reset-new-password").value;
        try {
          const res = await API.post("/api/auth/reset-password", { email, new_password: newPwd });
          alert(res.message);
          this.closeModal("modal-forgot-password");
        } catch (err) {
          alert(`Error: ${err.message}`);
        }
      });
    }

    // Top Login Link in Navbar
    const loginLink = document.getElementById("nav-link-login");
    if (loginLink) {
      loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.openRoleSelection();
      });
    }

    // Landing CTA
    const btnGetStarted = document.getElementById("btn-hero-get-started");
    if (btnGetStarted) {
      btnGetStarted.addEventListener("click", () => this.openRoleSelection());
    }

    // Accessibility Controls
    const btnSm = document.getElementById("btn-font-sm");
    const btnMd = document.getElementById("btn-font-md");
    const btnLg = document.getElementById("btn-font-lg");
    if (btnSm) btnSm.addEventListener("click", () => this.setFontScale("font-scale-sm", btnSm));
    if (btnMd) btnMd.addEventListener("click", () => this.setFontScale("font-scale-md", btnMd));
    if (btnLg) btnLg.addEventListener("click", () => this.setFontScale("font-scale-lg", btnLg));

    const contrastBtn = document.getElementById("btn-contrast-toggle");
    if (contrastBtn) {
      contrastBtn.addEventListener("click", () => {
        document.documentElement.classList.toggle("high-contrast");
        const active = document.documentElement.classList.contains("high-contrast");
        contrastBtn.classList.toggle("active", active);
      });
    }
  },

  setFontScale(cls, btn) {
    document.documentElement.className = document.documentElement.className.replace(/font-scale-\w+/g, "");
    document.documentElement.classList.add(cls);
    document.querySelectorAll(".gov-a11y-btn").forEach(b => {
      if (b.id.startsWith("btn-font-")) b.classList.remove("active");
    });
    btn.classList.add("active");
  },

  // ------------------------------------------------------------------------
  // Live Dashboard Loaders (Real Database API)
  // ------------------------------------------------------------------------
  async loadStudentDashboard() {
    try {
      const data = await API.get("/api/student/dashboard");
      
      // Update Student Greeting & Profile
      const nameEl = document.getElementById("stu-dashboard-name");
      const progValEl = document.getElementById("stu-overall-prog-val");
      const progBarEl = document.getElementById("stu-overall-prog-bar");

      if (nameEl && data.user) {
        nameEl.textContent = `Welcome, ${data.user.name} (Roll No: ${data.student_profile.roll_no || '0501'}) • ${data.student_profile.school_name || 'Tribal Residential School'}`;
      }
      if (progValEl) progValEl.textContent = `${data.overall_progress}%`;
      if (progBarEl) progBarEl.style.width = `${data.overall_progress}%`;

      // Render Lessons List
      const lessonsList = document.getElementById("student-lessons-list");
      if (lessonsList && data.lessons) {
        lessonsList.innerHTML = data.lessons.map(l => `
          <div class="gov-card" style="margin-bottom: 1rem;">
            <div class="gov-card-body" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--gov-green-dark);">${l.lesson_number} • ${l.type}</div>
                <div style="font-size: 1.15rem; font-weight: 700; margin: 0.2rem 0;" class="ol-chiki-text">${l.title_santali}</div>
                <div style="font-size: 0.875rem; color: var(--gov-text-secondary);">${l.title_hindi}</div>
              </div>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <span class="gov-badge ${l.status === 'Completed' ? 'gov-badge-success' : (l.status === 'In Progress' ? 'gov-badge-primary' : 'gov-badge-neutral')}">
                  ${l.status} (${l.progress}%)
                </span>
                <button type="button" class="gov-btn ${l.status === 'Completed' ? 'gov-btn-secondary' : 'gov-btn-primary'} gov-btn-sm" onclick="App.openLessonViewer('${l.id}')">
                  ${l.status === 'Completed' ? 'Review Lesson' : 'Open Lesson'}
                </button>
              </div>
            </div>
          </div>
        `).join("");
      }
    } catch (err) {
      console.error("Error loading student dashboard:", err);
    }
  },

  async openLessonViewer(lessonId) {
    this.activeLessonId = lessonId;
    try {
      const data = await API.get(`/api/student/lessons/${lessonId}`);
      const l = data.lesson;

      document.getElementById("modal-lesson-num").textContent = l.lesson_number;
      document.getElementById("modal-lesson-santali").textContent = l.title_santali;
      document.getElementById("modal-lesson-hindi").textContent = l.title_hindi;
      document.getElementById("modal-lesson-body").textContent = l.content;
      document.getElementById("modal-lesson-duration").textContent = `Estimated duration: ${l.duration}`;

      this.openModal("modal-lesson-viewer");
    } catch (err) {
      alert(`Could not load lesson: ${err.message}`);
    }
  },

  async markLessonCompleted() {
    if (!this.activeLessonId) return;

    // Check if offline
    if (OfflineManager.state === "offline") {
      OfflineManager.addToSyncQueue({
        action: "COMPLETE_LESSON",
        lesson_id: this.activeLessonId,
        progress: 100
      });
      this.closeModal("modal-lesson-viewer");
      alert("Offline Mode: Progress saved locally. Changes will automatically synchronize when connectivity returns.");
      this.loadStudentDashboard();
      return;
    }

    try {
      const res = await API.post(`/api/student/lessons/${this.activeLessonId}/complete`, {});
      alert(`Success: ${res.message}`);
      this.closeModal("modal-lesson-viewer");
      // Reload dashboard data live from DB
      this.loadStudentDashboard();
    } catch (err) {
      alert(`Error completing lesson: ${err.message}`);
    }
  },

  async loadTeacherDashboard() {
    try {
      const data = await API.get("/api/teacher/dashboard");

      // Update Teacher Profile Info
      const teaNameEl = document.getElementById("tea-meta-name");
      const teaSchoolEl = document.getElementById("tea-meta-school");
      const teaClassEl = document.getElementById("tea-meta-class");

      if (teaNameEl && data.user) teaNameEl.textContent = data.user.name;
      if (teaSchoolEl && data.teacher_profile) teaSchoolEl.textContent = data.teacher_profile.school_name || "Tribal Residential School";
      if (teaClassEl) teaClassEl.textContent = data.active_class;

      // Render Students Roster
      const tbody = document.getElementById("teacher-students-tbody");
      if (tbody && data.students) {
        tbody.innerHTML = data.students.map(s => `
          <tr>
            <td>
              <strong>${s.name}</strong>
              <div style="font-size: 0.75rem; color: var(--gov-text-secondary);">Roll: ${s.roll_no}</div>
            </td>
            <td style="min-width: 140px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 700; margin-bottom: 3px;">
                <span>${s.progress}%</span>
              </div>
              <div class="gov-progress-bar">
                <div class="gov-progress-fill" style="width: ${s.progress}%;"></div>
              </div>
            </td>
            <td>${s.last_active}</td>
            <td>
              <span class="gov-badge ${s.status === 'Needs Review' ? 'gov-badge-warning' : (s.status === 'Excellent' ? 'gov-badge-success' : 'gov-badge-primary')}">
                ${s.status}
              </span>
            </td>
            <td>
              <button class="gov-btn gov-btn-secondary gov-btn-sm" onclick="alert('Viewing comprehensive assessment portfolio for ${s.name}')">
                View Log
              </button>
            </td>
          </tr>
        `).join("");
      }
    } catch (err) {
      console.error("Error loading teacher dashboard:", err);
    }
  },

  async openCreateClassModal() {
    this.openModal("modal-create-class");
  },

  async submitCreateClass() {
    const nameInput = document.getElementById("input-class-name");
    const name = nameInput.value.trim();
    if (!name) return alert("Class name is required.");

    try {
      const res = await API.post("/api/teacher/classes", { name });
      alert(res.message);
      nameInput.value = "";
      this.closeModal("modal-create-class");
      this.loadTeacherDashboard();
    } catch (err) {
      alert(`Error creating class: ${err.message}`);
    }
  },

  async openUploadMaterialModal() {
    this.openModal("modal-upload-material");
  },

  async submitUploadMaterial() {
    const title = document.getElementById("input-material-title").value.trim();
    const type = document.getElementById("select-material-type").value;
    if (!title) return alert("Material title is required.");

    try {
      const res = await API.post("/api/teacher/materials", { title, type });
      alert(res.message);
      document.getElementById("input-material-title").value = "";
      this.closeModal("modal-upload-material");
      this.loadTeacherDashboard();
    } catch (err) {
      alert(`Error registering material: ${err.message}`);
    }
  },

  async loadAuthorityDashboard() {
    try {
      const data = await API.get("/api/authority/dashboard");

      // Update Real Database Statistics
      const s = data.statistics;
      if (s) {
        document.getElementById("stat-schools-count").textContent = s.registeredSchools;
        document.getElementById("stat-teachers-count").textContent = s.teachers;
        document.getElementById("stat-students-count").textContent = s.students;
        document.getElementById("stat-materials-count").textContent = s.learningMaterials;
      }

      // Render Curricula
      const currTbody = document.getElementById("auth-curriculum-tbody");
      if (currTbody && data.curricula) {
        currTbody.innerHTML = data.curricula.map(c => `
          <tr>
            <td><strong>${c.course_name}</strong></td>
            <td>${c.language}</td>
            <td>${c.classes}</td>
            <td>
              <span class="gov-badge ${c.status === 'Approved' ? 'gov-badge-success' : 'gov-badge-warning'}">
                ${c.status}
              </span>
            </td>
            <td>
              <button class="gov-btn gov-btn-secondary gov-btn-sm" onclick="alert('Viewing curriculum registry: ${c.course_name}')">
                Manage
              </button>
            </td>
          </tr>
        `).join("");
      }

      // Load Users
      this.loadAuthorityUsers();

      // Load Sync Status
      const syncData = await API.get("/api/authority/sync-status");
      const syncTbody = document.getElementById("auth-sync-tbody");
      if (syncTbody && syncData.sync_status) {
        syncTbody.innerHTML = syncData.sync_status.map(sy => `
          <tr>
            <td><strong>${sy.deviceSchool}</strong></td>
            <td>${sy.lastSync}</td>
            <td>${sy.pendingData}</td>
            <td>
              <span class="gov-badge ${sy.statusType === 'success' ? 'gov-badge-success' : (sy.statusType === 'warning' ? 'gov-badge-warning' : 'gov-badge-primary')}">
                ${sy.status}
              </span>
            </td>
          </tr>
        `).join("");
      }
    } catch (err) {
      console.error("Error loading authority dashboard:", err);
    }
  },

  async loadAuthorityUsers() {
    try {
      const data = await API.get("/api/authority/users");
      const usersTbody = document.getElementById("auth-users-tbody");
      if (usersTbody && data.users) {
        usersTbody.innerHTML = data.users.map(u => `
          <tr>
            <td><strong>${u.name}</strong><br><small style="color: #5B6573;">${u.email}</small></td>
            <td><span class="gov-badge gov-badge-neutral">${u.role}</span></td>
            <td>${u.school}</td>
            <td>
              <span class="gov-badge ${u.status === 'ACTIVE' ? 'gov-badge-success' : 'gov-badge-warning'}">
                ${u.status}
              </span>
            </td>
            <td>
              <button class="gov-btn gov-btn-secondary gov-btn-sm" onclick="App.toggleUserStatus('${u.id}', '${u.status}')">
                ${u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </button>
            </td>
          </tr>
        `).join("");
      }
    } catch (err) {
      console.error("Error loading users:", err);
    }
  },

  async toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await API.put(`/api/authority/users/${userId}/status`, { status: newStatus });
      alert(res.message);
      this.loadAuthorityUsers();
    } catch (err) {
      alert(`Error updating user status: ${err.message}`);
    }
  },

  async openCreateUserModal() {
    this.openModal("modal-create-user");
  },

  async submitCreateUser() {
    const name = document.getElementById("new-user-name").value.trim();
    const email = document.getElementById("new-user-email").value.trim();
    const password = document.getElementById("new-user-password").value;
    const role = document.getElementById("new-user-role").value;

    if (!name || !email || !password) return alert("All fields are required.");

    try {
      const res = await API.post("/api/authority/users", { name, email, password, role });
      alert(res.message);
      this.closeModal("modal-create-user");
      this.loadAuthorityUsers();
      this.loadAuthorityDashboard();
    } catch (err) {
      alert(`Error creating user: ${err.message}`);
    }
  },

  // ------------------------------------------------------------------------
  // Modals Helper
  // ------------------------------------------------------------------------
  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add("open");
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove("open");
  },

  openForgotPasswordModal() {
    this.openModal("modal-forgot-password");
  },

  // ------------------------------------------------------------------------
  // Flashcards
  // ------------------------------------------------------------------------
  async initFlashcards() {
    try {
      const data = await API.get("/api/flashcards");
      if (data.flashcards && data.flashcards.length) {
        this.flashcardsData = data.flashcards;
        this.renderFlashcard(0);
      }
    } catch (e) {
      this.flashcardsData = GOV_DATA.flashcards;
      this.renderFlashcard(0);
    }

    const prevBtn = document.getElementById("btn-fc-prev");
    const nextBtn = document.getElementById("btn-fc-next");
    const audioBtn = document.getElementById("btn-fc-audio");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (this.flashcardIndex > 0) {
          this.flashcardIndex--;
          this.renderFlashcard(this.flashcardIndex);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (this.flashcardsData && this.flashcardIndex < this.flashcardsData.length - 1) {
          this.flashcardIndex++;
          this.renderFlashcard(this.flashcardIndex);
        }
      });
    }

    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        const item = (this.flashcardsData || GOV_DATA.flashcards)[this.flashcardIndex];
        if (item && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(item.roman);
          utt.lang = "en-IN";
          window.speechSynthesis.speak(utt);
        }
      });
    }
  },

  renderFlashcard(index) {
    const list = this.flashcardsData || GOV_DATA.flashcards;
    const item = list[index];
    if (!item) return;

    const scriptEl = document.getElementById("fc-script");
    const romanEl = document.getElementById("fc-roman");
    const meaningEl = document.getElementById("fc-meaning");
    const exampleEl = document.getElementById("fc-example");
    const counterEl = document.getElementById("fc-counter");

    if (scriptEl) scriptEl.textContent = item.script;
    if (romanEl) romanEl.textContent = `Phonetic: "${item.roman}"`;
    if (meaningEl) meaningEl.textContent = item.hindi_meaning || item.hindiMeaning;
    if (exampleEl) exampleEl.textContent = `Word Example: ${item.example_word || item.exampleWord} (${item.english_meaning || item.englishMeaning})`;
    if (counterEl) counterEl.textContent = `Card ${index + 1} of ${list.length}`;
  }
};

// Initialize App on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
