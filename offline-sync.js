/* ==========================================================================
   OFFLINE & SYNCHRONIZATION QUEUE ENGINE
   Caches local actions and synchronizes with /api/sync when online.
   ========================================================================== */

const OfflineManager = {
  state: "online",
  lastSyncTime: "10:32 AM",
  syncQueue: [],

  init() {
    this.loadQueue();
    this.bindEvents();
    this.updateUI();
  },

  loadQueue() {
    try {
      const q = localStorage.getItem("gov_sync_queue");
      this.syncQueue = q ? JSON.parse(q) : [];
    } catch (e) {
      this.syncQueue = [];
    }
  },

  saveQueue() {
    localStorage.setItem("gov_sync_queue", JSON.stringify(this.syncQueue));
  },

  addToSyncQueue(item) {
    this.syncQueue.push({
      ...item,
      timestamp: new Date().toISOString()
    });
    this.saveQueue();
    this.updateUI();
  },

  bindEvents() {
    window.addEventListener("online", () => {
      this.setNetworkState("online");
      this.triggerSync();
    });
    window.addEventListener("offline", () => this.setNetworkState("offline"));

    const simSelect = document.getElementById("sim-network-select");
    if (simSelect) {
      simSelect.addEventListener("change", (e) => {
        this.setNetworkState(e.target.value);
      });
    }

    const syncBtns = document.querySelectorAll(".btn-trigger-sync");
    syncBtns.forEach(btn => {
      btn.addEventListener("click", () => this.triggerSync());
    });
  },

  setNetworkState(newState) {
    this.state = newState;
    const simSelect = document.getElementById("sim-network-select");
    if (simSelect && simSelect.value !== newState) {
      simSelect.value = newState;
    }
    this.updateUI();
  },

  async triggerSync() {
    if (this.state === "offline") {
      alert("Cannot synchronize: Network connection unavailable. Local records are safely queued in local storage.");
      return;
    }

    this.setNetworkState("syncing");

    try {
      const res = await API.post("/api/sync", {
        items: this.syncQueue
      });

      // Clear local queue upon verified server transaction
      this.syncQueue = [];
      this.saveQueue();

      const now = new Date();
      const hours = (now.getHours() % 12 || 12).toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";
      this.lastSyncTime = `${hours}:${minutes} ${ampm}`;

      this.setNetworkState("synced");

      setTimeout(() => {
        if (this.state === "synced") {
          this.setNetworkState("online");
        }
      }, 3000);
    } catch (err) {
      console.error("Sync failed:", err);
      const statusTextEl = document.getElementById("gov-status-text");
      const statusDotEl = document.getElementById("gov-status-dot");
      if (statusTextEl) statusTextEl.textContent = "SYNC ERROR";
      if (statusDotEl) statusDotEl.className = "status-dot offline";
      alert(`Synchronization Notice: ${err.message}. Local changes remain safe.`);
    }
  },

  updateUI() {
    const statusTextEl = document.getElementById("gov-status-text");
    const statusDotEl = document.getElementById("gov-status-dot");
    const bannerEl = document.getElementById("gov-status-banner");
    const bannerMsgEl = document.getElementById("gov-banner-message");
    const lastSyncDisplay = document.querySelectorAll(".gov-last-sync-time");

    lastSyncDisplay.forEach(el => el.textContent = this.lastSyncTime);

    if (!statusTextEl || !statusDotEl || !bannerEl) return;

    statusDotEl.className = "status-dot";
    bannerEl.className = "gov-status-banner";

    switch (this.state) {
      case "online":
        statusDotEl.classList.add("online");
        statusTextEl.textContent = this.syncQueue.length > 0 ? `Connected (${this.syncQueue.length} pending)` : "Connected";
        bannerEl.style.display = "none";
        break;

      case "offline":
        statusDotEl.classList.add("offline");
        statusTextEl.textContent = `Working Offline (${this.syncQueue.length} queued)`;
        bannerEl.classList.add("offline-active");
        bannerEl.style.display = "block";
        bannerMsgEl.innerHTML = `
          <strong>Offline Mode Active:</strong> Internet connection unavailable. Previously synchronized learning materials remain available. (${this.syncQueue.length} pending changes queued for auto-sync).
        `;
        break;

      case "syncing":
        statusDotEl.classList.add("syncing");
        statusTextEl.textContent = "Synchronizing data...";
        bannerEl.classList.add("sync-active");
        bannerEl.style.display = "block";
        bannerMsgEl.innerHTML = `
          <strong>Synchronizing:</strong> Uploading local records to central repository and verifying offline cache...
        `;
        break;

      case "synced":
        statusDotEl.classList.add("synced");
        statusTextEl.textContent = `Sync Complete (${this.lastSyncTime})`;
        bannerEl.style.display = "none";
        break;
    }
  }
};
