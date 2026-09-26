/* ==========================================================================
   CLASSROOM VOICE TRANSLATOR SERVICE
   Connects to backend /api/translate with offline edge model fallback.
   States: READY -> LISTENING -> PROCESSING -> TRANSLATING -> PLAYING AUDIO
   ========================================================================== */

const VoiceTranslator = {
  currentState: "READY",
  teacherLang: "hi",
  studentLang: "sat",
  activePhraseIndex: 0,

  init() {
    this.bindEvents();
    this.renderState("READY");
  },

  bindEvents() {
    const micBtn = document.getElementById("btn-voice-mic");
    if (micBtn) {
      micBtn.addEventListener("click", () => this.handleMicClick());
    }

    const playBtn = document.getElementById("btn-play-audio");
    if (playBtn) {
      playBtn.addEventListener("click", () => this.playTranslatedAudio());
    }

    const swapBtn = document.getElementById("btn-swap-trans-lang");
    if (swapBtn) {
      swapBtn.addEventListener("click", () => this.swapLanguages());
    }

    const teacherSelect = document.getElementById("select-teacher-lang");
    if (teacherSelect) {
      teacherSelect.addEventListener("change", (e) => {
        this.teacherLang = e.target.value;
      });
    }

    const studentSelect = document.getElementById("select-student-lang");
    if (studentSelect) {
      studentSelect.addEventListener("change", (e) => {
        this.studentLang = e.target.value;
      });
    }

    // Quick phrases chips
    const phraseChips = document.querySelectorAll(".btn-phrase-chip");
    phraseChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const text = chip.dataset.hindi || chip.textContent.trim().replace(/^"|"$/g, "");
        this.runTranslationPipeline(text);
      });
    });

    const sourceTextEl = document.getElementById("trans-source-input");
    if (sourceTextEl) {
      sourceTextEl.addEventListener("change", (e) => {
        this.runTranslationPipeline(e.target.value);
      });
    }
  },

  handleMicClick() {
    if (this.currentState === "LISTENING") {
      this.renderState("READY");
      return;
    }

    this.renderState("LISTENING");

    // Standard speech recognition if supported
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.lang = this.teacherLang === "hi" ? "hi-IN" : "en-IN";
        rec.interimResults = false;
        rec.onresult = (evt) => {
          const spoken = evt.results[0][0].transcript;
          this.runTranslationPipeline(spoken);
        };
        rec.onerror = () => this.simulateVoiceCapture();
        rec.onend = () => {
          if (this.currentState === "LISTENING") this.simulateVoiceCapture();
        };
        rec.start();
        return;
      } catch (e) {
        // Fallback to simulation
      }
    }

    this.simulateVoiceCapture();
  },

  simulateVoiceCapture() {
    const phrases = GOV_DATA.translationCorpus;
    const current = phrases[this.activePhraseIndex % phrases.length];
    this.activePhraseIndex++;

    setTimeout(() => {
      this.runTranslationPipeline(current.sourceHindi);
    }, 1200);
  },

  async runTranslationPipeline(text) {
    const sourceInput = document.getElementById("trans-source-input");
    if (sourceInput) sourceInput.value = text;

    this.renderState("PROCESSING");

    setTimeout(async () => {
      this.renderState("TRANSLATING");

      try {
        let result;
        // Call backend /api/translate
        if (OfflineManager.state !== "offline") {
          result = await API.post("/api/translate", {
            text,
            source_lang: this.teacherLang,
            target_lang: this.studentLang
          });
        } else {
          // Local Edge Fallback
          const corpus = GOV_DATA.translationCorpus;
          const match = corpus.find(c => c.sourceHindi.includes(text) || text.includes(c.sourceHindi.slice(0, 4))) || corpus[0];
          result = {
            target_text: match.targetSantaliOlChiki,
            roman: match.targetSantaliRoman,
            provider: "Local Edge Cache (OFFLINE)"
          };
        }

        this.applyTranslationResult(result.target_text, result.roman);
        this.renderState("READY");
        this.playTranslatedAudio();
      } catch (err) {
        console.error("Translation API error, using local corpus fallback:", err);
        const corpus = GOV_DATA.translationCorpus;
        const match = corpus[0];
        this.applyTranslationResult(match.targetSantaliOlChiki, match.targetSantaliRoman);
        this.renderState("READY");
      }
    }, 700);
  },

  applyTranslationResult(targetText, romanText) {
    const targetEl = document.getElementById("trans-target-text");
    const romanEl = document.getElementById("trans-target-roman");

    if (targetEl) {
      targetEl.textContent = targetText;
      targetEl.dataset.roman = romanText;
    }
    if (romanEl) {
      romanEl.textContent = `Phonetic: "${romanText}"`;
    }
  },

  playTranslatedAudio() {
    this.renderState("PLAYING AUDIO");

    const targetEl = document.getElementById("trans-target-text");
    const textToSpeak = targetEl ? (targetEl.dataset.roman || targetEl.textContent) : "Johar";

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.85;
      utterance.lang = "en-IN";
      utterance.onend = () => this.renderState("READY");
      utterance.onerror = () => this.renderState("READY");
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => this.renderState("READY"), 1200);
    }
  },

  renderState(state) {
    this.currentState = state;

    const steps = ["READY", "LISTENING", "PROCESSING", "TRANSLATING", "PLAYING AUDIO"];
    steps.forEach(s => {
      const stepId = `step-${s.toLowerCase().replace(" ", "-")}`;
      const el = document.getElementById(stepId);
      if (el) {
        if (s === state) {
          el.classList.add("active");
          el.setAttribute("aria-current", "step");
        } else {
          el.classList.remove("active");
          el.removeAttribute("aria-current");
        }
      }
    });

    const micBtn = document.getElementById("btn-voice-mic");
    const micText = document.getElementById("btn-voice-mic-text");

    if (micBtn && micText) {
      if (state === "LISTENING") {
        micBtn.classList.add("recording");
        micText.textContent = "Listening... (Speak Now)";
      } else if (state === "PROCESSING") {
        micBtn.classList.remove("recording");
        micText.textContent = "Processing Speech...";
      } else if (state === "TRANSLATING") {
        micBtn.classList.remove("recording");
        micText.textContent = "Translating...";
      } else if (state === "PLAYING AUDIO") {
        micBtn.classList.remove("recording");
        micText.textContent = "Playing Audio...";
      } else {
        micBtn.classList.remove("recording");
        micText.textContent = "START SPEAKING";
      }
    }
  },

  swapLanguages() {
    const temp = this.teacherLang;
    this.teacherLang = this.studentLang;
    this.studentLang = temp;

    const teacherSelect = document.getElementById("select-teacher-lang");
    const studentSelect = document.getElementById("select-student-lang");

    if (teacherSelect && studentSelect) {
      teacherSelect.value = this.teacherLang;
      studentSelect.value = this.studentLang;
    }
  }
};
