/**
 * Ms. Luminara Quiz - Voice Lab Module
 *
 * VOICE LAB - Experimental Features
 * Contains: XTTS integration, voice blending, multi-speaker controls,
 * voice capture, cocktail saving/loading
 *
 * This module extends QuizRenderer with voice lab functionality.
 * Extracted from 000.2-renderer.js for Body-Function-Subfunction compliance.
 */

// Voice Lab Mixin - adds voice lab methods to QuizRenderer
const VoiceLabMixin = {

  /**
   * Select a multi-speaker model from the left column
   */
  selectMultiSpeakerModel(modelId, maxSpeakers) {
    this._labModel = modelId;
    this._labMaxSpeakers = maxSpeakers;

    // Update the voice system
    if (typeof voiceSystem !== 'undefined' && voiceSystem) {
      voiceSystem.settings.piperModel = modelId;
      voiceSystem.settings.piperSpeakerId = 0;
      voiceSystem.saveSettings();
    }

    // Update slider max
    const slider = document.getElementById('labSpeakerId');
    if (slider) {
      slider.max = maxSpeakers - 1;
      slider.value = 0;
      document.getElementById('labSpeakerIdVal').textContent = '0';
    }

    // Update display
    const modelDisplay = document.getElementById('labCurrentModel');
    if (modelDisplay) modelDisplay.textContent = modelId;

    // Highlight selection
    document.querySelectorAll('.voice-item').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.voice === modelId);
    });

    // Preview with speaker 0
    this.labPreviewSpeaker();
  },

  /**
   * Set the multi-speaker model in the lab
   */
  setLabModel(modelId) {
    const speakerCounts = {
      'en_GB-vctk-medium': 109,
      'en_US-libritts-high': 904,
      'en_US-libritts_r-medium': 904,
      'en_GB-semaine-medium': 4,
      'en_US-arctic-medium': 18,
      'en_US-l2arctic-medium': 24,
    };
    this.selectMultiSpeakerModel(modelId, speakerCounts[modelId] || 1);
  },

  /**
   * Update the lab speaker ID and preview
   */
  updateLabSpeakerId(value) {
    document.getElementById('labSpeakerIdVal').textContent = value;

    if (typeof voiceSystem !== 'undefined' && voiceSystem) {
      voiceSystem.settings.piperSpeakerId = parseInt(value);
      voiceSystem.saveSettings();
    }
  },

  /**
   * Preview current speaker in the lab
   */
  async labPreviewSpeaker() {
    if (!this._labModel) return;

    const speakerIdStr = document.getElementById('labSpeakerId')?.value;
    const speakerId = parseInt(speakerIdStr, 10) || 0;

    if (typeof voiceSystem !== 'undefined' && voiceSystem) {
      voiceSystem.settings.piperSpeakerId = speakerId;
      await voiceSystem.previewVoice({
        backend: 'piper',
        id: this._labModel,
        speakerId: speakerId
      }, 'short');
    }
  },

  /**
   * Add current lab voice to cocktail mixer
   */
  addLabVoiceToCocktail() {
    if (!this._labModel) {
      alert('Select a model first!');
      return;
    }

    const speakerId = parseInt(document.getElementById('labSpeakerId')?.value || 0);
    const cocktail = this._cocktailVoices || [];

    if (cocktail.length >= 7) {
      alert('Maximum 7 voices in a cocktail!');
      return;
    }

    const voiceEntry = {
      model: this._labModel,
      speakerId: speakerId,
      label: `${this._labModel.split('-')[1]}:${speakerId}`
    };

    cocktail.push(voiceEntry);
    this._cocktailVoices = cocktail;
    this.updateCocktailUI();
  },

  /**
   * Remove voice from cocktail
   */
  removeCocktailVoice(index) {
    if (!this._cocktailVoices) return;
    this._cocktailVoices.splice(index, 1);
    this.updateCocktailUI();
  },

  /**
   * Update cocktail mixer UI
   */
  updateCocktailUI() {
    const container = document.getElementById('cocktailVoices');
    const controls = document.getElementById('cocktailControls');
    if (!container) return;

    const voices = this._cocktailVoices || [];

    container.innerHTML = voices.map((v, i) => `
      <div class="cocktail-voice">
        <span class="cv-label">${v.label}</span>
        <input type="range" min="0" max="100" value="${v.weight || 50}"
               class="cv-weight" data-idx="${i}"
               oninput="quiz.renderer.updateCocktailWeight(${i}, this.value)">
        <span class="cv-weight-val">${v.weight || 50}%</span>
        <button class="cv-remove" onclick="quiz.renderer.removeCocktailVoice(${i})">✕</button>
      </div>
    `).join('') || '<p class="cocktail-empty">Add voices from the left panel</p>';

    if (controls) {
      controls.style.display = voices.length >= 2 ? 'block' : 'none';
    }
  },

  /**
   * Update weight for a cocktail voice
   */
  updateCocktailWeight(index, value) {
    if (!this._cocktailVoices || !this._cocktailVoices[index]) return;
    this._cocktailVoices[index].weight = parseInt(value);

    const weightSpan = document.querySelector(`.cv-weight[data-idx="${index}"]`)?.nextElementSibling;
    if (weightSpan) weightSpan.textContent = `${value}%`;
  },

  /**
   * Play the current cocktail mix
   */
  async playCocktail() {
    const voices = this._cocktailVoices || [];
    if (voices.length < 2) {
      alert('Add at least 2 voices to the cocktail!');
      return;
    }

    const mode = document.getElementById('cocktailMode')?.value || 'source_filter';

    // Normalize weights
    const totalWeight = voices.reduce((sum, v) => sum + (v.weight || 50), 0);
    const weights = voices.map(v => (v.weight || 50) / totalWeight);

    try {
      const btn = document.querySelector('.cocktail-play-btn');
      if (btn) btn.textContent = '⏳ Mixing...';

      const response = await fetch('http://localhost:5500/blend-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Hello darling. This is your custom voice cocktail.",
          voices: voices.map(v => ({ model: v.model, speakerId: v.speakerId })),
          weights,
          mode
        })
      });

      if (!response.ok) throw new Error('Blend failed');

      const blob = await response.blob();
      this.stopBlendAudio();

      const url = URL.createObjectURL(blob);
      this._currentAudio = new Audio(url);
      this._currentAudio._blobUrl = url;
      this._currentAudio.volume = voiceSystem?.settings?.volume || 0.85;

      this._currentAudio.onended = () => {
        if (btn) btn.textContent = '▶ Play Cocktail';
        URL.revokeObjectURL(url);
      };

      await this._currentAudio.play();
      if (btn) btn.textContent = '▶ Play Cocktail';
    } catch (e) {
      console.error('Cocktail error:', e);
      const btn = document.querySelector('.cocktail-play-btn');
      if (btn) btn.textContent = '▶ Play Cocktail';
    }
  },

  /**
   * Stop any playing blend audio
   */
  stopBlendAudio() {
    if (this._currentAudio) {
      this._currentAudio.pause();
      if (this._currentAudio._blobUrl) {
        URL.revokeObjectURL(this._currentAudio._blobUrl);
      }
      this._currentAudio = null;
    }
  },

  /**
   * Save current cocktail
   */
  saveCocktail() {
    const voices = this._cocktailVoices || [];
    if (voices.length < 2) {
      alert('Add at least 2 voices first!');
      return;
    }

    const name = prompt('Name your voice cocktail:', `Blend ${Date.now()}`);
    if (!name) return;

    const mode = document.getElementById('cocktailMode')?.value || 'source_filter';

    const cocktail = {
      name,
      voices: voices.map(v => ({
        model: v.model,
        speakerId: v.speakerId,
        weight: v.weight || 50
      })),
      mode,
      created: Date.now()
    };

    // Load existing cocktails
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {}

    saved.push(cocktail);
    localStorage.setItem('ms_luminara_cocktails', JSON.stringify(saved));

    alert(`Cocktail "${name}" saved!`);
  },

  /**
   * Load a saved cocktail
   */
  loadCocktail(index) {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {}

    const cocktail = saved[index];
    if (!cocktail) return;

    this._cocktailVoices = cocktail.voices.map(v => ({
      model: v.model,
      speakerId: v.speakerId,
      weight: v.weight,
      label: `${v.model.split('-')[1]}:${v.speakerId}`
    }));

    const modeSelect = document.getElementById('cocktailMode');
    if (modeSelect) modeSelect.value = cocktail.mode || 'source_filter';

    this.updateCocktailUI();
  },

  /**
   * Load a voice cocktail by index (for simple settings UI)
   */
  loadVoiceCocktail(index) {
    this.loadCocktail(index);
    // Also play it
    setTimeout(() => this.playCocktail(), 100);
  },

  // ═══════════════════════════════════════════════════════════════
  // XTTS VOICE LAB
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize XTTS UI
   */
  async initXttsUI() {
    try {
      const response = await fetch('http://localhost:5500/xtts/status');
      const data = await response.json();

      const statusEl = document.getElementById('xttsStatus');
      const controlsEl = document.getElementById('xttsControls');
      const loadBtn = document.getElementById('xttsLoadBtn');

      if (data.available) {
        if (data.loaded) {
          statusEl.innerHTML = `
            <span class="xtts-status-icon">✅</span>
            <span class="xtts-status-text">XTTS Ready (${data.vram_used || '?'}MB VRAM)</span>
          `;
          controlsEl.style.display = 'block';
          loadBtn.style.display = 'none';
          this.loadXttsVoices();
        } else {
          statusEl.innerHTML = `
            <span class="xtts-status-icon">💤</span>
            <span class="xtts-status-text">XTTS available but not loaded</span>
          `;
          loadBtn.style.display = 'block';
          controlsEl.style.display = 'none';
        }
      } else {
        statusEl.innerHTML = `
          <span class="xtts-status-icon">❌</span>
          <span class="xtts-status-text">XTTS not available (requires GPU)</span>
        `;
        loadBtn.style.display = 'none';
        controlsEl.style.display = 'none';
      }
    } catch (e) {
      const statusEl = document.getElementById('xttsStatus');
      if (statusEl) {
        statusEl.innerHTML = `
          <span class="xtts-status-icon">⚠️</span>
          <span class="xtts-status-text">Cannot connect to TTS server</span>
        `;
      }
    }
  },

  /**
   * Load XTTS model
   */
  async loadXttsModel() {
    const btn = document.getElementById('xttsLoadBtn');
    const statusEl = document.getElementById('xttsStatus');

    btn.disabled = true;
    btn.textContent = '⏳ Loading XTTS...';
    statusEl.innerHTML = `
      <span class="xtts-status-icon">⏳</span>
      <span class="xtts-status-text">Loading XTTS model (~30 seconds)...</span>
    `;

    try {
      const response = await fetch('http://localhost:5500/xtts/load', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        this.initXttsUI();
      } else {
        throw new Error(data.error || 'Load failed');
      }
    } catch (e) {
      statusEl.innerHTML = `
        <span class="xtts-status-icon">❌</span>
        <span class="xtts-status-text">Failed to load: ${e.message}</span>
      `;
      btn.disabled = false;
      btn.textContent = '🚀 Retry Load';
    }
  },

  /**
   * Load saved XTTS voices
   */
  async loadXttsVoices() {
    try {
      const response = await fetch('http://localhost:5500/xtts/voices');
      const data = await response.json();

      const listEl = document.getElementById('xttsVoiceList');
      if (!listEl) return;

      if (data.voices && data.voices.length > 0) {
        this._xttsVoices = data.voices;
        listEl.innerHTML = data.voices.map((v, i) => `
          <div class="xtts-voice-item" data-idx="${i}">
            <span class="xv-name">${v.name}</span>
            <span class="xv-date">${new Date(v.created).toLocaleDateString()}</span>
            <div class="xv-actions">
              <button class="xv-play" onclick="quiz.renderer.playXttsVoice(${i})" title="Play">▶</button>
              <button class="xv-star" onclick="quiz.renderer.setActiveXttsVoice(${i})" title="Set as active">★</button>
              <button class="xv-add" onclick="quiz.renderer.addXttsToMixer(${i})" title="Add to mixer">+</button>
              <button class="xv-delete" onclick="quiz.renderer.deleteXttsVoice(${i})" title="Delete">🗑️</button>
            </div>
          </div>
        `).join('');

        // Enable blend button if we have voices
        const blendBtn = document.querySelector('.xtts-blend-btn');
        if (blendBtn) blendBtn.disabled = false;
      } else {
        listEl.innerHTML = '<p class="xtts-empty">No voice samples yet. Capture some from Piper!</p>';
      }
    } catch (e) {
      console.error('Failed to load XTTS voices:', e);
    }
  },

  /**
   * Show XTTS capture modal
   */
  showXttsCapture() {
    const modal = document.createElement('div');
    modal.className = 'xtts-capture-modal';
    modal.innerHTML = `
      <div class="xtts-capture-content">
        <button class="close-btn" onclick="this.closest('.xtts-capture-modal').remove()">✕</button>
        <h3>🎤 Capture Voice from Piper</h3>
        <p>Generate audio with Piper, then capture it as an XTTS voice sample.</p>

        <div class="capture-form">
          <label>Voice Name</label>
          <input type="text" id="captureVoiceName" placeholder="e.g., Warm Teacher">

          <label>Sample Text</label>
          <textarea id="captureSampleText" rows="3">Hello darling. Let me show you how I sound with these settings. Knowledge is the most intimate gift we can share.</textarea>

          <label>Source Voice</label>
          <select id="captureSourceVoice">
            <option value="en_US-amy-medium">Amy (Friendly)</option>
            <option value="en_US-lessac-medium">Lessac (Clear)</option>
            <option value="en_US-kristin-medium">Kristin (Warm)</option>
            <option value="en_GB-jenny_dioco-medium">Jenny (British)</option>
            <option value="en_US-ljspeech-medium">Linda (Neutral)</option>
          </select>

          <div class="capture-actions">
            <button class="capture-preview-btn" onclick="quiz.renderer.previewCaptureVoice()">
              ▶ Preview
            </button>
            <button class="capture-save-btn" onclick="quiz.renderer.captureAndSaveVoice()">
              💾 Capture & Save
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  /**
   * Preview capture voice
   */
  async previewCaptureVoice() {
    const text = document.getElementById('captureSampleText')?.value;
    const voice = document.getElementById('captureSourceVoice')?.value;

    if (!text || !voice) return;

    try {
      const response = await fetch('http://localhost:5500/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model: voice })
      });

      const blob = await response.blob();
      this.stopBlendAudio();

      const url = URL.createObjectURL(blob);
      this._currentAudio = new Audio(url);
      this._currentAudio._blobUrl = url;
      this._currentAudio.volume = voiceSystem?.settings?.volume || 0.85;
      await this._currentAudio.play();
    } catch (e) {
      console.error('Preview failed:', e);
    }
  },

  /**
   * Capture and save voice to XTTS
   */
  async captureAndSaveVoice() {
    const name = document.getElementById('captureVoiceName')?.value;
    const text = document.getElementById('captureSampleText')?.value;
    const voice = document.getElementById('captureSourceVoice')?.value;

    if (!name || !text || !voice) {
      alert('Please fill in all fields');
      return;
    }

    const btn = document.querySelector('.capture-save-btn');
    if (btn) btn.textContent = '⏳ Capturing...';

    try {
      const response = await fetch('http://localhost:5500/xtts/capture-from-piper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text, model: voice })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Voice "${name}" captured successfully!`);
        document.querySelector('.xtts-capture-modal')?.remove();
        this.loadXttsVoices();
      } else {
        throw new Error(data.error || 'Capture failed');
      }
    } catch (e) {
      alert(`Capture failed: ${e.message}`);
    } finally {
      if (btn) btn.textContent = '💾 Capture & Save';
    }
  },

  /**
   * Capture all saved cocktails as XTTS voices
   */
  async captureAllCocktails() {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {}

    if (saved.length === 0) {
      alert('No saved cocktails to capture');
      return;
    }

    const btn = document.querySelector('.xtts-capture-cocktails-btn');
    if (btn) btn.textContent = '⏳ Capturing...';

    let captured = 0;
    for (const cocktail of saved) {
      try {
        const totalWeight = cocktail.voices.reduce((sum, v) => sum + (v.weight || 50), 0);
        const weights = cocktail.voices.map(v => (v.weight || 50) / totalWeight);

        const response = await fetch('http://localhost:5500/xtts/capture-blend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cocktail.name,
            voices: cocktail.voices.map(v => ({ model: v.model, speakerId: v.speakerId })),
            weights,
            mode: cocktail.mode || 'source_filter',
            text: "Hello darling. Knowledge is the most intimate gift we can share."
          })
        });

        const data = await response.json();
        if (data.success) captured++;
      } catch (e) {
        console.error(`Failed to capture ${cocktail.name}:`, e);
      }
    }

    if (btn) btn.textContent = '🍸 Capture Saved Cocktails';
    alert(`Captured ${captured} of ${saved.length} cocktails`);
    this.loadXttsVoices();
  },

  /**
   * Play an XTTS voice sample
   */
  async playXttsVoice(index) {
    const voice = this._xttsVoices?.[index];
    if (!voice) return;

    try {
      const response = await fetch('http://localhost:5500/xtts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Hello darling. This is how I sound.",
          voice: voice.name
        })
      });

      const blob = await response.blob();
      this.stopBlendAudio();

      const url = URL.createObjectURL(blob);
      this._currentAudio = new Audio(url);
      this._currentAudio._blobUrl = url;
      this._currentAudio.volume = voiceSystem?.settings?.volume || 0.85;
      await this._currentAudio.play();
    } catch (e) {
      console.error('XTTS playback failed:', e);
    }
  },

  /**
   * Set active XTTS voice
   */
  setActiveXttsVoice(index) {
    const voice = this._xttsVoices?.[index];
    if (!voice) return;

    this._activeXttsVoice = voice.name;

    // Update UI
    document.querySelectorAll('.xtts-voice-item').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });

    const activeDisplay = document.getElementById('xttsActiveVoice');
    if (activeDisplay) activeDisplay.textContent = voice.name;

    // Update use button
    const useBtn = document.getElementById('xttsUseQuizBtn');
    if (useBtn) useBtn.disabled = false;
  },

  /**
   * Add XTTS voice to mixer
   */
  addXttsToMixer(index) {
    const voice = this._xttsVoices?.[index];
    if (!voice) return;

    if (!this._xttsMixerVoices) this._xttsMixerVoices = [];
    if (this._xttsMixerVoices.length >= 5) {
      alert('Maximum 5 voices in XTTS mixer');
      return;
    }

    this._xttsMixerVoices.push({
      name: voice.name,
      weight: 1.0 / (this._xttsMixerVoices.length + 1)
    });

    // Rebalance weights
    const total = this._xttsMixerVoices.length;
    this._xttsMixerVoices.forEach(v => v.weight = 1.0 / total);

    this.updateXttsMixerUI();
  },

  /**
   * Update XTTS mixer UI
   */
  updateXttsMixerUI() {
    const container = document.getElementById('xttsMixerSlots');
    if (!container) return;

    const voices = this._xttsMixerVoices || [];

    container.innerHTML = voices.map((v, i) => `
      <div class="xtts-mixer-slot">
        <span class="xms-name">${v.name}</span>
        <input type="range" min="0" max="100" value="${Math.round(v.weight * 100)}"
               oninput="quiz.renderer.updateXttsMixerWeight(${i}, this.value)">
        <span class="xms-weight">${Math.round(v.weight * 100)}%</span>
        <button class="xms-remove" onclick="quiz.renderer.removeXttsMixerVoice(${i})">✕</button>
      </div>
    `).join('') || '<p class="xtts-mixer-empty">Click + on voices above to add them</p>';

    // Enable/disable blend button
    const blendBtn = document.querySelector('.xtts-blend-btn');
    const saveBtn = document.querySelector('.xtts-save-btn');
    if (blendBtn) blendBtn.disabled = voices.length < 2;
    if (saveBtn) saveBtn.disabled = voices.length < 2;
  },

  /**
   * Update XTTS mixer weight
   */
  updateXttsMixerWeight(index, value) {
    if (!this._xttsMixerVoices?.[index]) return;
    this._xttsMixerVoices[index].weight = parseInt(value) / 100;

    // Update display
    const slot = document.querySelectorAll('.xtts-mixer-slot')[index];
    if (slot) {
      slot.querySelector('.xms-weight').textContent = `${value}%`;
    }
  },

  /**
   * Remove voice from XTTS mixer
   */
  removeXttsMixerVoice(index) {
    if (!this._xttsMixerVoices) return;
    this._xttsMixerVoices.splice(index, 1);
    this.updateXttsMixerUI();
  },

  /**
   * Reset XTTS mixer weights to equal
   */
  resetXttsWeights() {
    if (!this._xttsMixerVoices) return;
    const total = this._xttsMixerVoices.length;
    this._xttsMixerVoices.forEach(v => v.weight = 1.0 / total);
    this.updateXttsMixerUI();
  },

  /**
   * Update XTTS generation parameter
   */
  updateXttsParam(param, value) {
    if (!this._xttsParams) this._xttsParams = {};
    this._xttsParams[param] = parseFloat(value);

    // Update display
    const valEl = document.getElementById(`xtts${param.charAt(0).toUpperCase() + param.slice(1)}Val`);
    if (valEl) {
      valEl.textContent = param === 'speed' ? `${value}×` : value;
    }

    // Clear preset selection
    const presetSelect = document.getElementById('xttsPersonalityPreset');
    if (presetSelect) presetSelect.value = '';
  },

  /**
   * Apply XTTS personality preset
   */
  applyXttsPreset(preset) {
    const presets = {
      neutral: { speed: 1.0, temperature: 0.65, top_p: 0.85, repetition_penalty: 2.0 },
      warm: { speed: 0.95, temperature: 0.75, top_p: 0.9, repetition_penalty: 2.5 },
      energetic: { speed: 1.1, temperature: 0.8, top_p: 0.85, repetition_penalty: 1.5 },
      calm: { speed: 0.9, temperature: 0.6, top_p: 0.9, repetition_penalty: 3.0 },
      playful: { speed: 1.05, temperature: 0.85, top_p: 0.8, repetition_penalty: 2.0 },
      serious: { speed: 0.95, temperature: 0.55, top_p: 0.85, repetition_penalty: 2.5 },
      skeptical: { speed: 0.95, temperature: 0.7, top_p: 0.75, repetition_penalty: 2.0 }
    };

    const settings = presets[preset];
    if (!settings) return;

    this._xttsParams = { ...settings };

    // Update sliders
    Object.entries(settings).forEach(([key, value]) => {
      const slider = document.getElementById(`xtts${key.charAt(0).toUpperCase() + key.slice(1).replace(/_([a-z])/g, (m, c) => c.toUpperCase())}`);
      const valEl = document.getElementById(`xtts${key.charAt(0).toUpperCase() + key.slice(1).replace(/_([a-z])/g, (m, c) => c.toUpperCase())}Val`);

      if (slider) slider.value = value;
      if (valEl) valEl.textContent = key === 'speed' ? `${value}×` : value;
    });
  },

  /**
   * Play XTTS voice blend
   */
  async playXttsBlend() {
    const voices = this._xttsMixerVoices || [];
    if (voices.length < 2) {
      alert('Add at least 2 voices to blend');
      return;
    }

    const btn = document.querySelector('.xtts-blend-btn');
    if (btn) btn.textContent = '⏳ Blending...';

    const useSlerp = document.getElementById('xttsSlerp')?.value === 'true';
    const text = document.getElementById('xttsSoloText')?.value || "Hello darling. This is your blended voice.";

    try {
      // Normalize weights
      const totalWeight = voices.reduce((sum, v) => sum + v.weight, 0);
      const normalizedVoices = voices.map(v => ({
        name: v.name,
        weight: v.weight / totalWeight
      }));

      const response = await fetch('http://localhost:5500/xtts/blend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voices: normalizedVoices,
          use_slerp: useSlerp,
          ...this._xttsParams
        })
      });

      if (!response.ok) throw new Error('Blend failed');

      const blob = await response.blob();
      this.stopBlendAudio();

      const url = URL.createObjectURL(blob);
      this._currentAudio = new Audio(url);
      this._currentAudio._blobUrl = url;
      this._currentAudio.volume = voiceSystem?.settings?.volume || 0.85;

      this._currentAudio.onended = () => {
        if (btn) btn.textContent = '🧬 Blend Voices';
        URL.revokeObjectURL(url);
      };

      await this._currentAudio.play();
      if (btn) btn.textContent = '🧬 Blend Voices';
    } catch (e) {
      console.error('XTTS blend failed:', e);
      if (btn) btn.textContent = '🧬 Blend Voices';
      alert(`Blend failed: ${e.message}`);
    }
  },

  /**
   * Save current XTTS blend as a new voice
   */
  async saveXttsBlend() {
    const voices = this._xttsMixerVoices || [];
    if (voices.length < 2) {
      alert('Add at least 2 voices to save a blend');
      return;
    }

    const name = prompt('Name your blended voice:', `Blend_${Date.now()}`);
    if (!name) return;

    const btn = document.querySelector('.xtts-save-btn');
    if (btn) btn.textContent = '⏳ Saving...';

    const useSlerp = document.getElementById('xttsSlerp')?.value === 'true';

    try {
      const totalWeight = voices.reduce((sum, v) => sum + v.weight, 0);
      const normalizedVoices = voices.map(v => ({
        name: v.name,
        weight: v.weight / totalWeight
      }));

      const response = await fetch('http://localhost:5500/xtts/save-blend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          voices: normalizedVoices,
          use_slerp: useSlerp
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Blend "${name}" saved!`);
        this.loadXttsVoices();
      } else {
        throw new Error(data.error || 'Save failed');
      }
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      if (btn) btn.textContent = '💾 Save Blend';
    }
  },

  /**
   * Play the active XTTS voice
   */
  async playActiveVoice() {
    if (!this._activeXttsVoice) {
      alert('Select a voice first (click ★)');
      return;
    }

    const text = document.getElementById('xttsSoloText')?.value || "Hello darling.";

    try {
      const response = await fetch('http://localhost:5500/xtts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: this._activeXttsVoice,
          ...this._xttsParams
        })
      });

      const blob = await response.blob();
      this.stopBlendAudio();

      const url = URL.createObjectURL(blob);
      this._currentAudio = new Audio(url);
      this._currentAudio._blobUrl = url;
      this._currentAudio.volume = voiceSystem?.settings?.volume || 0.85;
      await this._currentAudio.play();
    } catch (e) {
      console.error('XTTS playback failed:', e);
    }
  },

  /**
   * Use current XTTS voice for quiz
   */
  useXttsForQuiz() {
    if (!this._activeXttsVoice) {
      alert('Select a voice first (click ★)');
      return;
    }

    if (typeof voiceSystem !== 'undefined' && voiceSystem) {
      voiceSystem.settings.backend = 'xtts';
      voiceSystem.settings.xttsVoice = this._activeXttsVoice;
      voiceSystem.settings.xttsParams = this._xttsParams || {};
      voiceSystem.saveSettings();

      const statusEl = document.getElementById('xttsQuizStatus');
      if (statusEl) statusEl.textContent = `✓ Using "${this._activeXttsVoice}"`;

      // Update backend indicator if visible
      const indicator = document.getElementById('backendIndicator');
      if (indicator) {
        indicator.textContent = '🔬 XTTS Voice Lab';
        indicator.classList.add('xtts-active');
      }
    }
  },

  /**
   * Delete an XTTS voice
   */
  async deleteXttsVoice(index) {
    const voice = this._xttsVoices?.[index];
    if (!voice) return;

    if (!confirm(`Delete voice "${voice.name}"?`)) return;

    try {
      const response = await fetch('http://localhost:5500/xtts/delete-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: voice.name })
      });

      const data = await response.json();
      if (data.success) {
        this.loadXttsVoices();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  }
};

// Apply mixin to QuizRenderer when it's available
if (typeof QuizRenderer !== 'undefined') {
  Object.assign(QuizRenderer.prototype, VoiceLabMixin);
} else {
  // Store for later application
  window._VoiceLabMixin = VoiceLabMixin;
}
