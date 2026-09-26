/* ==========================================================================
   AUTHENTICATED API CLIENT
   Handles Bearer token injection, loading indicators, error handling,
   and standard government-style error feedback.
   ========================================================================== */

const API = {
  baseUrl: "",

  getToken() {
    return sessionStorage.getItem("gov_auth_token") || localStorage.getItem("gov_auth_token");
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      let data;
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle Session Expiration or Unauthorized
        if (response.status === 401) {
          const errMsg = data.error || "Your session has expired. Please log in again.";
          Auth.handleSessionExpired(errMsg);
          throw new Error(errMsg);
        }
        if (response.status === 403) {
          const errMsg = data.error || "Access denied. This section is restricted to authorized users.";
          throw new Error(errMsg);
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
};
