/* ==========================================================================
   AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) MANAGER
   Manages session storage, route guards, token validation, and secure logout.
   ========================================================================== */

const Auth = {
  TOKEN_KEY: "gov_auth_token",
  USER_KEY: "gov_auth_user",

  getUser() {
    try {
      const u = sessionStorage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  getToken() {
    return sessionStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
  },

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  },

  hasRole(role) {
    const user = this.getUser();
    return user && user.role && user.role.toUpperCase() === role.toUpperCase();
  },

  setSession(token, user) {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    // Also save in localStorage for cross-tab demo persistence
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.updateAuthUI();
  },

  clearSession() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.updateAuthUI();
  },

  async login(email, password, role) {
    const errorEl = document.getElementById("login-error-msg");
    const submitBtn = document.getElementById("btn-login-submit");
    if (errorEl) errorEl.style.display = "none";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Authenticating...";
    }

    try {
      const res = await API.post("/api/auth/login", {
        email,
        password,
        role: role.toUpperCase()
      });

      this.setSession(res.token, res.user);

      // Transition to appropriate dashboard
      if (res.user.role === "STUDENT") {
        App.switchView("student");
        App.loadStudentDashboard();
      } else if (res.user.role === "TEACHER") {
        App.switchView("teacher");
        App.loadTeacherDashboard();
      } else if (res.user.role === "AUTHORITY") {
        App.switchView("authority");
        App.loadAuthorityDashboard();
      }

      // Replace state in browser history to prevent back-nav leakage
      history.replaceState({ view: res.user.role.toLowerCase() }, "", `#${res.user.role.toLowerCase()}`);
      return res;
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || "Invalid ID/email or password.";
        errorEl.style.display = "block";
      }
      throw err;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = role === "AUTHORITY" ? "Secure Login" : "Login";
      }
    }
  },

  async logout() {
    try {
      await API.post("/api/auth/logout", {});
    } catch (e) {
      // Continue client cleanup even if network fails
    }

    this.clearSession();

    // Clear sensitive dashboard DOM elements
    const studentTbody = document.getElementById("teacher-students-tbody");
    if (studentTbody) studentTbody.innerHTML = "";
    const usersTbody = document.getElementById("auth-users-tbody");
    if (usersTbody) usersTbody.innerHTML = "";

    // Clear history so browser Back button does not show authenticated dashboard
    history.replaceState(null, "", "#login");

    // Redirect to login page
    App.openRoleSelection();
    alert("You have been securely logged out.");
  },

  handleSessionExpired(message) {
    this.clearSession();
    App.openRoleSelection();
    alert(message || "Your session has expired. Please log in again.");
  },

  guardRoute(targetView) {
    // Public views
    if (targetView === "landing" || targetView === "login" || targetView === "login-form") {
      return true;
    }

    const user = this.getUser();
    if (!this.isAuthenticated()) {
      alert("Authentication required. Please log in to access this portal.");
      App.openRoleSelection();
      return false;
    }

    // Role-specific route protection
    if (targetView === "student" && user.role !== "STUDENT") {
      alert("Access denied. This section is restricted to authorized users.");
      return false;
    }
    if (targetView === "teacher" && user.role !== "TEACHER") {
      alert("Access denied. This section is restricted to authorized users.");
      return false;
    }
    if (targetView === "authority" && user.role !== "AUTHORITY") {
      alert("Access denied. This section is restricted to authorized users.");
      return false;
    }

    return true;
  },

  updateAuthUI() {
    const user = this.getUser();
    const loginLink = document.getElementById("nav-link-login");
    const userProfileBox = document.getElementById("gov-user-profile-box");
    const userNameEl = document.getElementById("gov-header-username");
    const userRoleEl = document.getElementById("gov-header-userrole");

    if (user && this.isAuthenticated()) {
      if (loginLink) loginLink.style.display = "none";
      if (userProfileBox) userProfileBox.style.display = "flex";
      if (userNameEl) userNameEl.textContent = user.name;
      if (userRoleEl) userRoleEl.textContent = user.role;
    } else {
      if (loginLink) loginLink.style.display = "inline";
      if (userProfileBox) userProfileBox.style.display = "none";
    }
  }
};
