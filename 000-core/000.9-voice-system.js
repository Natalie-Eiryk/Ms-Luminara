/**
 * Ms. Luminara Quiz - Voice System
 *
 * Provides text-to-speech for Ms. Luminara using multiple backends:
 * 1. Browser SpeechSynthesis (fallback, always available)
 * 2. Piper TTS via local server (high quality, offline)
 * 3. Coqui TTS via local server (alternative local option)
 *
 * The voice should be: playful, teasing, slightly breathy, with
 * inflection that hints at amusement and flirtation.
 */

// ═══════════════════════════════════════════════════════════════════════════
// VOCALIZATION LIBRARY
// Loads utterances from appendix-f-vocalizations.json
// ═══════════════════════════════════════════════════════════════════════════

class VocalizationLibrary {
  constructor() {
    this.data = null;
    this.loaded = false;
    this.loadPromise = null;
  }

  async load() {
    if (this.loaded) return this.data;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this._loadFromFile();
    return this.loadPromise;
  }

  async _loadFromFile() {
    try {
      // Try loading from library path (relative to quiz root)
      const paths = [
        '../ms_luminara_library/appendices/appendix-f-vocalizations.json',
        './appendices/appendix-f-vocalizations.json',
        '/ms_luminara_library/appendices/appendix-f-vocalizations.json'
      ];

      for (const path of paths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            this.data = await response.json();
            this.loaded = true;
            console.log('Vocalization library loaded:', Object.keys(this.data));
            return this.data;
          }
        } catch (e) {
          // Try next path
        }
      }

      // Fallback to embedded defaults if file not found
      console.warn('Vocalization library not found, using embedded defaults');
      this.data = this._getEmbeddedDefaults();
      this.loaded = true;
      return this.data;

    } catch (e) {
      console.error('Failed to load vocalization library:', e);
      this.data = this._getEmbeddedDefaults();
      this.loaded = true;
      return this.data;
    }
  }

  _getEmbeddedDefaults() {
    // Minimal fallback if JSON fails to load
    return {
      idle_pokes: {
        escalation_levels: {
          "1_gentle": { messages: ["Still thinking? Take your time."] },
          "2_playful": { messages: ["The silence is interesting."] },
          "3_insistent": { messages: ["At this rate, we'll be here all night."] },
          "4_dramatic": { messages: ["Fine. I'll just sit here waiting."] },
          "5_absurdist": { messages: ["Civilizations have risen and fallen."] }
        }
      },
      question_intros: {
        categories: {
          warmup_phase1: { messages: ["Let's warm up those neurons."] },
          warmup_phase2: { messages: ["Getting warmer."] },
          main_confident: { messages: ["Let's see what you're made of."] },
          main_playful: { messages: ["Try not to overthink this."] },
          after_correct: { messages: ["Excellent. Let's continue."] },
          after_incorrect: { messages: ["No matter. Let's try this."] }
        }
      }
    };
  }

  /**
   * Get a random message from a category
   * @param {string} section - Top-level section (e.g., 'idle_pokes', 'question_intros')
   * @param {string} category - Category within section
   * @returns {string} Random message
   */
  getMessage(section, category) {
    if (!this.data) return '';

    try {
      let messages;

      if (section === 'idle_pokes') {
        messages = this.data.idle_pokes.escalation_levels[category]?.messages;
      } else if (section === 'question_intros') {
        messages = this.data.question_intros.categories[category]?.messages;
      } else if (section === 'correct_responses') {
        messages = this.data.correct_responses.categories[category]?.messages;
      } else if (section === 'incorrect_responses') {
        messages = this.data.incorrect_responses.categories[category]?.messages;
      } else if (section === 'achievement_reactions') {
        messages = this.data.achievement_reactions.categories[category]?.messages;
      } else if (section === 'session_transitions') {
        messages = this.data.session_transitions.categories[category]?.messages;
      }

      if (messages && messages.length > 0) {
        return messages[Math.floor(Math.random() * messages.length)];
      }
    } catch (e) {
      console.warn('Failed to get message:', section, category, e);
    }

    return '';
  }

  /**
   * Get poke message by escalation level (1-5)
   */
  getPokeMessage(level) {
    const levelMap = {
      1: '1_gentle',
      2: '2_playful',
      3: '3_insistent',
      4: '4_dramatic',
      5: '5_absurdist'
    };
    return this.getMessage('idle_pokes', levelMap[Math.min(level, 5)]);
  }

  /**
   * Get intro message based on quiz state
   */
  getIntroMessage(phase, context = {}) {
    if (context.afterCorrect) {
      return this.getMessage('question_intros', 'after_correct');
    }
    if (context.afterIncorrect) {
      return this.getMessage('question_intros', 'after_incorrect');
    }
    if (context.streakBroken) {
      return this.getMessage('question_intros', 'after_streak_broken');
    }

    // Phase-based selection
    if (phase === 'warmup1') {
      return this.getMessage('question_intros', 'warmup_phase1');
    }
    if (phase === 'warmup2') {
      return this.getMessage('question_intros', 'warmup_phase2');
    }

    // Main phase - mix of tones
    const mainCategories = ['main_confident', 'main_curious', 'main_playful'];
    const category = mainCategories[Math.floor(Math.random() * mainCategories.length)];
    return this.getMessage('question_intros', category);
  }

  /**
   * Get response to correct answer
   */
  getCorrectResponse(streak = 0) {
    if (streak >= 5) {
      const msg = this.getMessage('correct_responses', 'streak_building');
      return msg.replace('[STREAK]', streak);
    }
    if (streak >= 3) {
      return this.getMessage('correct_responses', 'impressed');
    }
    return this.getMessage('correct_responses', 'pleased');
  }

  /**
   * Get response to incorrect answer
   */
  getIncorrectResponse() {
    const categories = ['gentle_correction', 'reframe_as_learning', 'encouraging'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    return this.getMessage('incorrect_responses', category);
  }

  /**
   * Get session transition message
   */
  getSessionMessage(type) {
    return this.getMessage('session_transitions', type);
  }

  /**
   * Get achievement reaction
   */
  getAchievementReaction(isRare = false) {
    const category = isRare ? 'rare_accomplishment' : 'milestone_reached';
    return this.getMessage('achievement_reactions', category);
  }
}

// Global vocalization library instance
const vocalizationLibrary = new VocalizationLibrary();

// ═══════════════════════════════════════════════════════════════════════════
// VOICE BLENDER - FFT-based audio morphing
// ═══════════════════════════════════════════════════════════════════════════

class VoiceBlender {
  constructor() {
    this.audioContext = null;
    this.blendedBuffer = null;
  }

  getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Fetch audio from a voice configuration
   * @param {Object} voiceConfig - { model, speakerId, settings }
   * @param {string} text - Text to speak
   * @returns {Promise<AudioBuffer>}
   */
  async fetchVoiceAudio(voiceConfig, text) {
    const url = 'http://localhost:5500/tts';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model: voiceConfig.model,
        speaker_id: voiceConfig.speakerId || 0,
        length_scale: voiceConfig.lengthScale || 1.0,
        noise_scale: voiceConfig.noiseScale || 0.667,
        noise_w: voiceConfig.noiseW || 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const ctx = this.getAudioContext();
    return await ctx.decodeAudioData(arrayBuffer);
  }

  /**
   * Blend two audio buffers using FFT spectral morphing
   * @param {AudioBuffer} bufferA - First voice
   * @param {AudioBuffer} bufferB - Second voice
   * @param {number} blendRatio - 0 = 100% A, 1 = 100% B, 0.5 = equal mix
   * @param {Object} options - { magnitudeBlend, phaseSource, crossfadeType }
   * @returns {AudioBuffer}
   */
  blendAudioFFT(bufferA, bufferB, blendRatio = 0.5, options = {}) {
    const ctx = this.getAudioContext();
    const {
      magnitudeBlend = 'linear',  // 'linear', 'geometric', 'max', 'min'
      phaseSource = 'a',          // 'a', 'b', 'blend'
      crossfadeType = 'equal'     // 'equal', 'constantPower'
    } = options;

    // Use the longer buffer length, match sample rates
    const length = Math.max(bufferA.length, bufferB.length);
    const sampleRate = bufferA.sampleRate;
    const numChannels = Math.min(bufferA.numberOfChannels, bufferB.numberOfChannels);

    // Create output buffer
    const outputBuffer = ctx.createBuffer(numChannels, length, sampleRate);

    // FFT size - power of 2, larger = more frequency resolution
    const fftSize = 2048;
    const hopSize = fftSize / 4;

    for (let channel = 0; channel < numChannels; channel++) {
      const dataA = new Float32Array(length);
      const dataB = new Float32Array(length);

      // Copy and zero-pad if needed
      dataA.set(bufferA.getChannelData(channel));
      dataB.set(bufferB.getChannelData(channel));

      const output = new Float32Array(length);

      // Process in overlapping frames
      for (let frameStart = 0; frameStart < length - fftSize; frameStart += hopSize) {
        // Extract frames
        const frameA = dataA.slice(frameStart, frameStart + fftSize);
        const frameB = dataB.slice(frameStart, frameStart + fftSize);

        // Apply Hann window
        const window = this.hannWindow(fftSize);
        for (let i = 0; i < fftSize; i++) {
          frameA[i] *= window[i];
          frameB[i] *= window[i];
        }

        // FFT
        const fftA = this.fft(frameA);
        const fftB = this.fft(frameB);

        // Blend in frequency domain
        const blendedFFT = this.blendSpectra(fftA, fftB, blendRatio, magnitudeBlend, phaseSource);

        // Inverse FFT
        const blendedFrame = this.ifft(blendedFFT);

        // Overlap-add with window
        for (let i = 0; i < fftSize; i++) {
          if (frameStart + i < length) {
            output[frameStart + i] += blendedFrame[i] * window[i];
          }
        }
      }

      // Normalize to prevent clipping (use loop instead of spread to avoid stack overflow)
      let maxVal = 0;
      for (let i = 0; i < output.length; i++) {
        const absVal = Math.abs(output[i]);
        if (absVal > maxVal) maxVal = absVal;
      }
      if (maxVal > 0.95) {
        const scale = 0.95 / maxVal;
        for (let i = 0; i < output.length; i++) {
          output[i] *= scale;
        }
      }

      outputBuffer.copyToChannel(output, channel);
    }

    this.blendedBuffer = outputBuffer;
    return outputBuffer;
  }

  /**
   * Simple blend without FFT - just crossfade the waveforms
   * Faster but less interesting
   */
  blendAudioSimple(bufferA, bufferB, blendRatio = 0.5) {
    const ctx = this.getAudioContext();
    const length = Math.max(bufferA.length, bufferB.length);
    const outputBuffer = ctx.createBuffer(1, length, bufferA.sampleRate);

    const dataA = bufferA.getChannelData(0);
    const dataB = bufferB.getChannelData(0);
    const output = outputBuffer.getChannelData(0);

    const ratioA = 1 - blendRatio;
    const ratioB = blendRatio;

    for (let i = 0; i < length; i++) {
      const sampleA = i < dataA.length ? dataA[i] : 0;
      const sampleB = i < dataB.length ? dataB[i] : 0;
      output[i] = sampleA * ratioA + sampleB * ratioB;
    }

    this.blendedBuffer = outputBuffer;
    return outputBuffer;
  }

  /**
   * Blend spectra with various algorithms
   */
  blendSpectra(fftA, fftB, ratio, magnitudeBlend, phaseSource) {
    const result = new Float32Array(fftA.length);
    const halfLen = fftA.length / 2;

    for (let i = 0; i < halfLen; i++) {
      const realA = fftA[i * 2];
      const imagA = fftA[i * 2 + 1];
      const realB = fftB[i * 2];
      const imagB = fftB[i * 2 + 1];

      const magA = Math.sqrt(realA * realA + imagA * imagA);
      const magB = Math.sqrt(realB * realB + imagB * imagB);
      const phaseA = Math.atan2(imagA, realA);
      const phaseB = Math.atan2(imagB, realB);

      // Blend magnitudes
      let mag;
      switch (magnitudeBlend) {
        case 'geometric':
          // Add small epsilon to both to avoid log(0) issues
          const epsilon = 1e-10;
          mag = Math.pow(magA + epsilon, 1 - ratio) * Math.pow(magB + epsilon, ratio);
          break;
        case 'max':
          mag = Math.max(magA * (1 - ratio), magB * ratio);
          break;
        case 'min':
          mag = Math.min(magA, magB);
          break;
        case 'linear':
        default:
          mag = magA * (1 - ratio) + magB * ratio;
      }

      // Select/blend phase
      let phase;
      switch (phaseSource) {
        case 'b':
          phase = phaseB;
          break;
        case 'blend':
          // Phase interpolation (can cause artifacts)
          phase = phaseA * (1 - ratio) + phaseB * ratio;
          break;
        case 'a':
        default:
          phase = phaseA;
      }

      result[i * 2] = mag * Math.cos(phase);
      result[i * 2 + 1] = mag * Math.sin(phase);
    }

    return result;
  }

  /**
   * Hann window function
   */
  hannWindow(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
  }

  /**
   * Simple DFT (for demo - in production use Web Audio AnalyserNode or library)
   */
  fft(signal) {
    const N = signal.length;
    const result = new Float32Array(N * 2); // real, imag pairs

    for (let k = 0; k < N; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += signal[n] * Math.cos(angle);
        imag += signal[n] * Math.sin(angle);
      }
      result[k * 2] = real;
      result[k * 2 + 1] = imag;
    }

    return result;
  }

  /**
   * Inverse DFT
   */
  ifft(spectrum) {
    const N = spectrum.length / 2;
    const result = new Float32Array(N);

    for (let n = 0; n < N; n++) {
      let sum = 0;
      for (let k = 0; k < N; k++) {
        const angle = 2 * Math.PI * k * n / N;
        const real = spectrum[k * 2];
        const imag = spectrum[k * 2 + 1];
        sum += real * Math.cos(angle) - imag * Math.sin(angle);
      }
      result[n] = sum / N;
    }

    return result;
  }

  /**
   * Play the blended buffer
   */
  playBlended(buffer = null) {
    const ctx = this.getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer || this.blendedBuffer;

    if (!source.buffer) {
      console.error('No blended audio to play');
      return;
    }

    source.connect(ctx.destination);
    source.start();
    return source;
  }

  /**
   * High-level: blend two voice cocktails and play result
   * @param {Object} cocktailA - First saved voice cocktail
   * @param {Object} cocktailB - Second saved voice cocktail
   * @param {string} text - Text to speak
   * @param {number} ratio - Blend ratio (0-1)
   * @param {Object} options - FFT blend options
   */
  async blendAndPlay(cocktailA, cocktailB, text, ratio = 0.5, options = {}) {
    console.log(`🎨 Blending voices: ${cocktailA.name} + ${cocktailB.name} @ ${Math.round(ratio * 100)}%`);

    // Fetch audio from both voices
    const [audioA, audioB] = await Promise.all([
      this.fetchVoiceAudio({
        model: cocktailA.model,
        speakerId: cocktailA.speakerId,
        lengthScale: cocktailA.piperLengthScale,
        noiseScale: cocktailA.piperNoiseScale,
        noiseW: cocktailA.piperNoiseW
      }, text),
      this.fetchVoiceAudio({
        model: cocktailB.model,
        speakerId: cocktailB.speakerId,
        lengthScale: cocktailB.piperLengthScale,
        noiseScale: cocktailB.piperNoiseScale,
        noiseW: cocktailB.piperNoiseW
      }, text)
    ]);

    console.log(`📊 Audio A: ${audioA.length} samples, Audio B: ${audioB.length} samples`);

    // Blend using FFT
    const blended = options.simple
      ? this.blendAudioSimple(audioA, audioB, ratio)
      : this.blendAudioFFT(audioA, audioB, ratio, options);

    // Play result
    this.playBlended(blended);

    return blended;
  }
}

// Global voice blender instance
const voiceBlender = new VoiceBlender();

// ═══════════════════════════════════════════════════════════════════════════
// VOICE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

class VoiceSystem {
  constructor() {
    this.STORAGE_KEY = 'ms_luminara_voice';
    this.settings = this.loadSettings();
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentAudio = null;

    // Backend status
    // NOTE: Lumi uses the new quiz_voice_server on port 5111 with brain-inspired architecture
    this.backends = {
      browser: { available: true, name: 'Browser TTS' },
      piper: { available: false, name: 'Piper TTS', url: 'http://localhost:5500' },
      lumi: { available: false, name: 'Lumi Voice', url: 'http://localhost:5111' },
      xtts: { available: false, name: 'XTTS Voice Lab', url: 'http://localhost:5500' },
      blend: { available: false, name: 'Voice Blend', url: 'http://localhost:5501' },
      coqui: { available: false, name: 'Coqui TTS', url: 'http://localhost:5002' }
    };

    this.init();
  }

  loadSettings() {
    const defaults = {
      enabled: true,
      backend: 'lumi',  // Lumi v4 - context-aware voice synthesis
      volume: 0.8,
      rate: 1.0,
      pitch: 1.1,
      // Browser voice preferences
      browserVoiceName: null,
      // Piper settings
      piperModel: 'en_US-lessac-medium',
      // Piper advanced synthesis parameters
      piperLengthScale: 1.0,        // Speech duration (0.5-2.0, lower = faster)
      piperNoiseScale: 0.667,       // Voice variation/expressiveness (0-1)
      piperNoiseW: 0.8,             // Phoneme width variation (0-1)
      piperSpeakerId: 0,            // Speaker ID for multi-speaker models
      // XTTS Voice Lab settings
      xttsVoiceId: null,            // Active XTTS voice sample ID
      xttsSpeed: 1.0,               // XTTS speech speed
      xttsTemperature: 0.7,         // XTTS expressiveness
      xttsTopP: 0.85,               // XTTS variation
      xttsRepetitionPenalty: 2.0,   // XTTS repetition penalty
      // Audio processing
      sentencePause: 300,           // Pause between sentences (ms)
      emphasisBoost: 1.0,           // Emphasis on capitalized words (1.0-1.5)
      // What to speak
      speakQuestions: true,
      speakIntros: true,
      speakExplanations: true,
      speakAchievements: true,
      speakLoot: false,
      // Interactive mode
      readQuestionsAloud: true,      // Read the question text when it appears
      waitForAnswer: true,           // Pause after reading, wait for interaction
      playfulPokes: true,            // Tease if taking too long
      pokeIntervalSeconds: 30        // How long before first poke
    };

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        // Merge stored settings with defaults to handle new settings
        const parsed = JSON.parse(stored);
        const merged = { ...defaults, ...parsed };

        // FORCE Lumi backend - override any stored 'xtts' setting
        // Lumi v4 is the canonical Ms. Luminara voice
        if (merged.backend === 'xtts') {
          console.log('Upgrading from xtts to lumi backend');
          merged.backend = 'lumi';
        }

        return merged;
      }
    } catch (e) {
      console.warn('Failed to load voice settings:', e);
    }

    return defaults;
  }

  saveSettings() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {}
  }

  async init() {
    // Load vocalization library
    await vocalizationLibrary.load();

    // Check Lumi FIRST - it's the primary voice for Ms. Luminara
    await this.checkLumiServer();

    if (this.backends.lumi.available) {
      console.log('Lumi v4 Voice available - using as primary backend');
      this.settings.backend = 'lumi';
      this.saveSettings();
      // Don't load other backends - Lumi is all we need
      console.log('Voice system initialized: Lumi v4 only');
      console.log('Vocalization library:', vocalizationLibrary.loaded ? 'loaded' : 'failed');
      return;
    }

    // Lumi not available - load fallback backends
    console.warn('Lumi not available, loading fallback backends...');

    // Check browser TTS voices
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => this.catalogBrowserVoices();
      this.catalogBrowserVoices();
    }

    // Only load other backends if explicitly enabled in settings
    if (this.settings.enableFallbackBackends) {
      await this.checkPiperServer();
      await this.checkXttsServer();
      await this.checkBlendServer();
      await this.checkCoquiServer();
    }

    // Fall back to piper or browser
    if (this.settings.backend === 'lumi') {
      this.settings.backend = this.backends.piper?.available ? 'piper' : 'browser';
      this.saveSettings();
    }

    console.log('Voice system initialized:', this.backends);
    console.log('Active backend:', this.settings.backend);
    console.log('Vocalization library:', vocalizationLibrary.loaded ? 'loaded' : 'failed');
  }

  /**
   * Enable fallback backends (Piper, XTTS, etc.) for experimentation
   * Call this from UI settings to unlock other voice options
   */
  async enableFallbackBackends() {
    console.log('Loading fallback backends...');
    this.settings.enableFallbackBackends = true;
    this.saveSettings();

    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => this.catalogBrowserVoices();
      this.catalogBrowserVoices();
    }

    await this.checkPiperServer();
    await this.checkXttsServer();
    await this.checkBlendServer();
    await this.checkCoquiServer();

    console.log('Fallback backends loaded:', this.backends);
    return this.backends;
  }

  catalogBrowserVoices() {
    const voices = speechSynthesis.getVoices();
    this.browserVoices = voices;

    // Find good female voices for Ms. Luminara
    // Prefer: Google UK Female, Microsoft Zira, Samantha (macOS)
    const preferred = [
      'Google UK English Female',
      'Microsoft Zira',
      'Samantha',
      'Karen',
      'Moira',
      'Fiona',
      'Google US English Female',
      'Microsoft Hazel'
    ];

    for (const name of preferred) {
      const voice = voices.find(v => v.name.includes(name));
      if (voice && !this.settings.browserVoiceName) {
        this.settings.browserVoiceName = voice.name;
        this.saveSettings();
        break;
      }
    }

    // Fallback to any female-sounding voice (only if no voice was ever set)
    if (!this.settings.browserVoiceName && voices.length > 0) {
      const femaleVoice = voices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.includes('Zira') ||
        v.name.includes('Samantha')
      );
      if (femaleVoice) {
        this.settings.browserVoiceName = femaleVoice.name;
        this.saveSettings();
      } else {
        // Just use the first available voice as last resort
        this.settings.browserVoiceName = voices[0].name;
        this.saveSettings();
      }
    }
  }

  async checkPiperServer() {
    try {
      const response = await fetch(this.backends.piper.url + '/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        const data = await response.json();
        this.backends.piper.available = true;
        this.backends.piper.models = data.models || [];
        this.backends.piper.currentModel = data.currentModel;
        console.log('Piper TTS connected:', data);

        // Fetch full voice metadata
        try {
          const voicesResponse = await fetch(this.backends.piper.url + '/voices');
          if (voicesResponse.ok) {
            this.backends.piper.voiceData = await voicesResponse.json();
            console.log('Piper voices loaded:', this.backends.piper.voiceData.total, 'voices');
          }
        } catch (e) {
          console.warn('Could not fetch voice metadata');
        }

        // Auto-switch to Piper if available and currently using browser
        if (this.settings.backend === 'browser' && !this.settings.userSelectedBackend) {
          this.settings.backend = 'piper';
          if (data.models && data.models.length > 0) {
            this.settings.piperModel = data.currentModel || data.models[0];
          }
          this.saveSettings();
        }
      } else {
        this.backends.piper.available = false;
      }
    } catch (e) {
      this.backends.piper.available = false;
    }
  }

  async checkLumiServer() {
    try {
      // Check for Lumi v4 brain-inspired voice system on port 5111
      const response = await fetch(this.backends.lumi.url + '/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Lumi Brain Voice status:', data);
        // New server returns has_identity and features
        this.backends.lumi.available = data.has_identity || data.identity_exists || false;
        this.backends.lumi.features = data.features || {};
        this.backends.lumi.version = data.version;
        this.backends.lumi.stats = data.stats || {};
        if (this.backends.lumi.available) {
          console.log('Lumi Brain Voice connected:', {
            version: data.version,
            features: Object.keys(data.features || {}).filter(k => data.features[k]),
            stats: data.stats
          });
        }
      } else {
        this.backends.lumi.available = false;
      }
    } catch (e) {
      console.warn('Lumi server check failed:', e);
      this.backends.lumi.available = false;
    }
  }

  async checkXttsServer() {
    try {
      // XTTS uses the same server as Piper, check for /xtts/voices endpoint
      const response = await fetch(this.backends.xtts.url + '/xtts/voices', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        const data = await response.json();
        this.backends.xtts.available = true;
        this.backends.xtts.voices = data.voices || [];
        console.log('XTTS Voice Lab connected:', data.voices?.length || 0, 'voices');
      } else {
        this.backends.xtts.available = false;
      }
    } catch (e) {
      this.backends.xtts.available = false;
    }
  }

  async checkCoquiServer() {
    try {
      const response = await fetch(this.backends.coqui.url + '/api/tts', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      this.backends.coqui.available = response.ok;
    } catch (e) {
      this.backends.coqui.available = false;
    }
  }

  async checkBlendServer() {
    try {
      const response = await fetch(this.backends.blend.url + '/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        const data = await response.json();
        this.backends.blend.available = true;
        this.backends.blend.engines = data.engines;
        console.log('Voice Blend server connected:', data.engines);
      } else {
        this.backends.blend.available = false;
      }
    } catch (e) {
      this.backends.blend.available = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN SPEAK FUNCTION
  // ═══════════════════════════════════════════════════════════════

  async speak(text, options = {}) {
    if (!this.settings.enabled || !text) return;

    const {
      priority = 'normal',  // 'high' interrupts current speech
      emotion = 'playful',  // For backends that support it
      category = 'general', // For filtering what to speak
      context = null        // For Lumi context-aware synthesis
    } = options;

    // Check category settings
    if (category === 'question' && !this.settings.speakQuestions) return;
    if (category === 'intro' && !this.settings.speakIntros) return;
    if (category === 'explanation' && !this.settings.speakExplanations) return;
    if (category === 'achievement' && !this.settings.speakAchievements) return;
    if (category === 'loot' && !this.settings.speakLoot) return;

    // Clean text for speech
    const cleanText = this.prepareText(text);

    if (priority === 'high') {
      this.stop();
    }

    // Map category to Lumi context if not explicitly set
    const lumiContext = context || this.categoryToLumiContext(category, emotion);

    // Queue the speech
    this.audioQueue.push({ text: cleanText, emotion, context: lumiContext });
    this.processQueue();
  }

  /**
   * Map quiz categories/emotions to Lumi prosody contexts
   */
  categoryToLumiContext(category, emotion) {
    const categoryMap = {
      'question': 'question',
      'intro': 'intro',
      'explanation': 'explanation',
      'achievement': 'achievement',
      'correct': 'correct',
      'incorrect': 'incorrect',
      'poke': 'poke_gentle',
      'general': 'default'
    };

    const emotionMap = {
      'playful': 'poke_gentle',
      'teasing': 'poke_gentle',
      'encouraging': 'correct',
      'pleased': 'correct',
      'gentle': 'incorrect',
      'curious': 'question',
      'excited': 'achievement',
      'warm': 'intro'
    };

    return categoryMap[category] || emotionMap[emotion] || 'default';
  }

  prepareText(text) {
    return text
      // Remove emojis (TTS handles them poorly)
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      // Remove special characters that cause issues
      .replace(/[→←↑↓]/g, '')
      .replace(/[✓✗]/g, '')
      // Clean up quotes
      .replace(/"/g, '"')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/'/g, "'")
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Prepare question text for natural speech
   * Smooths out quiz-style phrasing into conversational English
   */
  prepareQuestionForSpeech(text) {
    let result = text;

    // Common quiz phrases → natural speech
    const replacements = [
      // "Which of the following" variations
      [/which of the following (is|are) (true|correct)\??/gi, 'Which one is correct?'],
      [/which of the following (is|are) (false|incorrect)\??/gi, 'Which one is false?'],
      [/which of the following/gi, 'Which of these'],

      // "All of the following EXCEPT"
      [/all of the following (.+?) except:?/gi, 'All of these $1, except which one?'],
      [/all of the following are (.+?) except:?/gi, 'All of these are $1, except?'],
      [/all are (.+?) except:?/gi, 'All are $1, except which?'],

      // TRUE/FALSE emphasis (often ALL CAPS in quizzes)
      [/\bTRUE\b/g, 'true'],
      [/\bFALSE\b/g, 'false'],
      [/\bCORRECT\b/g, 'correct'],
      [/\bINCORRECT\b/g, 'incorrect'],
      [/\bEXCEPT\b/g, 'except'],
      [/\bNOT\b/g, 'not'],
      [/\bONLY\b/g, 'only'],
      [/\bALL\b/g, 'all'],
      [/\bNONE\b/g, 'none'],
      [/\bBOTH\b/g, 'both'],
      [/\bMOST\b/g, 'most'],
      [/\bLEAST\b/g, 'least'],
      [/\bBEST\b/g, 'best'],
      [/\bPRIMARY\b/g, 'primary'],
      [/\bMAIN\b/g, 'main'],

      // Question number prefixes
      [/^Q\d+[:.]\s*/i, ''],
      [/^\d+[.)]\s*/, ''],

      // Abbreviations to full words
      [/\bw\/o\b/gi, 'without'],
      [/\bw\/\b/gi, 'with'],
      [/\bb\/c\b/gi, 'because'],
      [/\bvs\.?\b/gi, 'versus'],
      [/\betc\.?\b/gi, 'etcetera'],
      [/\be\.g\.?\b/gi, 'for example'],
      [/\bi\.e\.?\b/gi, 'that is'],
      [/\baka\b/gi, 'also known as'],

      // Medical/scientific abbreviations (common ones)
      [/\bCNS\b/g, 'C.N.S.'],
      [/\bPNS\b/g, 'P.N.S.'],
      [/\bANS\b/g, 'A.N.S.'],
      [/\bDNA\b/g, 'D.N.A.'],
      [/\bRNA\b/g, 'R.N.A.'],
      [/\bATP\b/g, 'A.T.P.'],
      [/\bCSF\b/g, 'C.S.F.'],
      [/\bBBB\b/g, 'blood brain barrier'],

      // Punctuation fixes
      [/\s*:\s*$/g, '?'],  // Trailing colon → question mark
      [/\?\?+/g, '?'],     // Multiple question marks
      [/\.\.+/g, '.'],     // Multiple periods

      // Parenthetical asides - add slight pause
      [/\(([^)]+)\)/g, ', $1,'],

      // Slashes often mean "or"
      [/\s*\/\s*/g, ' or '],
    ];

    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement);
    }

    // Clean up any double spaces or punctuation issues from replacements
    result = result
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/\s+\?/g, '?')
      .replace(/\s+\./g, '.')
      .replace(/\s+,/g, ',')
      .trim();

    // Ensure it ends with appropriate punctuation
    if (!/[.?!]$/.test(result)) {
      result += '?';
    }

    return result;
  }

  async processQueue() {
    if (this.isPlaying || this.audioQueue.length === 0) return;

    this.isPlaying = true;
    const { text, emotion, context } = this.audioQueue.shift();

    try {
      switch (this.settings.backend) {
        case 'lumi':
          // Lumi v4 - context-aware voice with pre-configured identity
          console.log(`🎭 Lumi: backend=${this.settings.backend}, context=${context || emotion || 'default'}`);
          try {
            await this.speakWithLumi(text, context || emotion);
            this.backends.lumi.available = true;
            break;
          } catch (lumiError) {
            console.warn('Lumi failed, falling back:', lumiError.message);
            // Fall through to next backend
          }
          // Fall through to xtts if Lumi unavailable

        case 'xtts':
          // If XTTS is selected and we have a voice, try it
          // (even if 'available' wasn't set - server might have started after init)
          if (this.settings.xttsVoiceId) {
            console.log(`🎤 XTTS: backend=${this.settings.backend}, voiceId=${this.settings.xttsVoiceId}, available=${this.backends.xtts.available}`);
            try {
              await this.speakWithXtts(text);
              // If it worked, mark as available
              this.backends.xtts.available = true;
              break;
            } catch (xttsError) {
              console.warn('XTTS failed, falling back:', xttsError.message);
              // Fall through to next backend
            }
          } else {
            console.warn('XTTS selected but no voice ID set');
          }
          // Fall through to piper if XTTS unavailable

        case 'blend':
          if (this.backends.blend.available) {
            await this.speakWithBlend(text, { emotion });
            break;
          }
          // Fall through to piper if blend unavailable

        case 'piper':
          if (this.backends.piper.available) {
            await this.speakWithPiper(text);
            break;
          }
          // Fall through to browser if piper unavailable

        case 'coqui':
          if (this.backends.coqui.available) {
            await this.speakWithCoqui(text, emotion);
            break;
          }
          // Fall through to browser

        case 'browser':
        default:
          await this.speakWithBrowser(text);
      }
    } catch (e) {
      console.error('Speech error:', e);
    }

    this.isPlaying = false;
    this.processQueue();
  }

  // ═══════════════════════════════════════════════════════════════
  // BROWSER TTS
  // ═══════════════════════════════════════════════════════════════

  speakWithBrowser(text) {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Find the preferred voice
      if (this.settings.browserVoiceName) {
        const voice = this.browserVoices?.find(v => v.name === this.settings.browserVoiceName);
        if (voice) utterance.voice = voice;
      }

      utterance.volume = this.settings.volume;
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;

      utterance.onend = resolve;
      utterance.onerror = reject;

      this.currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // TEXT PREPROCESSING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Preprocess text for better TTS pronunciation
   */
  preprocessTextForTTS(text) {
    // Common abbreviations and titles
    const replacements = [
      // Titles - must come before periods are processed
      [/\bMs\.\s*/gi, 'Miss '],
      [/\bMrs\.\s*/gi, 'Missus '],
      [/\bMr\.\s*/gi, 'Mister '],
      [/\bDr\.\s*/gi, 'Doctor '],
      [/\bProf\.\s*/gi, 'Professor '],
      [/\bSt\.\s*/gi, 'Saint '],
      [/\bvs\.\s*/gi, 'versus '],
      [/\betc\.\s*/gi, 'etcetera '],
      [/\be\.g\.\s*/gi, 'for example '],
      [/\bi\.e\.\s*/gi, 'that is '],

      // Units
      [/\bkg\b/gi, 'kilograms'],
      [/\bmg\b/gi, 'milligrams'],
      [/\bml\b/gi, 'milliliters'],
      [/\bmm\b/gi, 'millimeters'],
      [/\bcm\b/gi, 'centimeters'],

      // Medical/scientific abbreviations common in the quiz
      [/\bCNS\b/g, 'C N S'],
      [/\bPNS\b/g, 'P N S'],
      [/\bANS\b/g, 'A N S'],
      [/\bCSF\b/g, 'C S F'],
      [/\bDNA\b/g, 'D N A'],
      [/\bRNA\b/g, 'R N A'],
      [/\bATP\b/g, 'A T P'],

      // Common words that might be mispronounced
      [/\bsynapse\b/gi, 'SIN-aps'],
      [/\bsynaptic\b/gi, 'sin-AP-tic'],
    ];

    for (const [pattern, replacement] of replacements) {
      text = text.replace(pattern, replacement);
    }

    return text;
  }

  // ═══════════════════════════════════════════════════════════════
  // PIPER TTS (Local Server)
  // ═══════════════════════════════════════════════════════════════

  async speakWithPiper(text) {
    const url = `${this.backends.piper.url}/tts`;

    // Preprocess text for better pronunciation
    text = this.preprocessTextForTTS(text);

    // Get settings with defaults for backwards compatibility
    const lengthScale = this.settings.piperLengthScale ?? 1.0;
    const noiseScale = this.settings.piperNoiseScale ?? 0.667;
    const noiseW = this.settings.piperNoiseW ?? 0.8;
    const rate = this.settings.rate ?? 1.0;

    // Combine rate setting with length_scale
    // Lower length_scale = faster speech
    const effectiveLengthScale = lengthScale / rate;

    // Determine model and speaker ID
    let model = this.settings.piperModel;
    let speakerId = this.settings.piperSpeakerId || 0;

    // Voice Roulette Mode - random speaker each time!
    if (this.settings.voiceRouletteEnabled) {
      const rouletteModels = [
        { model: 'en_GB-vctk-medium', maxSpeaker: 109 },
        { model: 'en_US-libritts-high', maxSpeaker: 100 },
        { model: 'en_US-arctic-medium', maxSpeaker: 18 }
      ];
      const chosen = rouletteModels[Math.floor(Math.random() * rouletteModels.length)];
      model = chosen.model;
      speakerId = Math.floor(Math.random() * chosen.maxSpeaker);
      console.log(`🎰 Voice Roulette: ${model} speaker #${speakerId}`);
    }

    console.log(`🔊 Piper TTS: "${text.substring(0, 50)}..." model=${model} speaker=${speakerId}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model,
          speaker_id: speakerId,
          length_scale: effectiveLengthScale,
          noise_scale: noiseScale,
          noise_w: noiseW
        })
      });

      if (!response.ok) {
        console.error('Piper TTS request failed:', response.status, response.statusText);
        throw new Error('Piper TTS request failed');
      }

      const audioBlob = await response.blob();
      console.log(`🔊 Piper TTS: Got audio blob, ${audioBlob.size} bytes`);
      return this.playAudioBlob(audioBlob);
    } catch (e) {
      console.error('Piper TTS error:', e);
      throw e;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // VOICE BLEND SERVER (Multi-Engine)
  // Routes to Piper/XTTS/Bark/Tortoise based on context
  // ═══════════════════════════════════════════════════════════════

  async speakWithBlend(text, options = {}) {
    const url = `${this.backends.blend.url}/tts`;

    // Engine can be: 'auto', 'piper', 'xtts', 'bark', 'tortoise'
    const engine = options.blendEngine || this.settings.blendEngine || 'auto';

    console.log(`🎭 Voice Blend: "${text.substring(0, 50)}..." engine=${engine}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          engine,
          // Pass through other settings
          model: this.settings.piperModel,
          speaker_id: this.settings.piperSpeakerId || 0,
          length_scale: (this.settings.piperLengthScale ?? 1.0) / (this.settings.rate ?? 1.0),
          noise_scale: this.settings.piperNoiseScale ?? 0.667,
          noise_w: this.settings.piperNoiseW ?? 0.8
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Voice Blend request failed:', response.status, err);
        throw new Error('Voice Blend request failed');
      }

      const audioBlob = await response.blob();
      console.log(`🎭 Voice Blend: Got audio blob, ${audioBlob.size} bytes`);
      return this.playAudioBlob(audioBlob);
    } catch (e) {
      console.error('Voice Blend error:', e);
      // Fall back to Piper if blend server fails
      if (this.backends.piper.available) {
        console.log('Falling back to Piper...');
        return this.speakWithPiper(text);
      }
      throw e;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // XTTS VOICE LAB (Local Server)
  // Uses GPU-accelerated embedding-space voice blending
  // ═══════════════════════════════════════════════════════════════

  async speakWithXtts(text) {
    const url = `${this.backends.xtts.url}/blend-xtts`;

    if (!this.settings.xttsVoiceId) {
      console.error('No XTTS voice selected');
      throw new Error('No XTTS voice selected');
    }

    // Preprocess text for better pronunciation
    text = this.preprocessTextForTTS(text);

    console.log(`🔬 XTTS: "${text.substring(0, 50)}..." voice=${this.settings.xttsVoiceId}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voices: [this.settings.xttsVoiceId],
          weights: [1.0],
          use_slerp: true,
          language: 'en',
          speed: this.settings.xttsSpeed || 1.0,
          temperature: this.settings.xttsTemperature || 0.7,
          top_p: this.settings.xttsTopP || 0.85,
          repetition_penalty: this.settings.xttsRepetitionPenalty || 2.0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('XTTS request failed:', response.status, errorText);
        throw new Error('XTTS request failed');
      }

      const audioBlob = await response.blob();
      console.log(`🔬 XTTS: Got audio blob, ${audioBlob.size} bytes`);
      return this.playAudioBlob(audioBlob);
    } catch (e) {
      console.error('XTTS error:', e);
      // Re-throw to let processQueue handle fallback
      throw e;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LUMI VOICE (Brain-Inspired Context-Aware Synthesis)
  // Uses the new quiz_voice_server with feedback loop and speculation
  // ═══════════════════════════════════════════════════════════════

  async speakWithLumi(text, context = 'default') {
    // Use the main /speak endpoint for full brain processing
    const url = `${this.backends.lumi.url}/speak`;

    // Preprocess text for better pronunciation
    text = this.preprocessTextForTTS(text);

    // Map emotion/context to Lumi's context system
    const contextMap = {
      'playful': 'poke_gentle',
      'teasing': 'poke_gentle',
      'encouraging': 'correct',
      'pleased': 'correct',
      'gentle': 'incorrect',
      'curious': 'question',
      'excited': 'achievement',
      'warm': 'intro',
      'default': 'default'
    };

    const lumiContext = contextMap[context] || context || 'default';

    console.log(`🧠 Lumi Brain: "${text.substring(0, 50)}..." context=${lumiContext}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          context: lumiContext
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lumi Brain request failed:', response.status, errorText);
        throw new Error('Lumi Brain request failed');
      }

      const audioBlob = await response.blob();
      console.log(`🧠 Lumi Brain: Got audio blob, ${audioBlob.size} bytes`);
      return this.playAudioBlob(audioBlob);
    } catch (e) {
      console.error('Lumi Brain error:', e);
      throw e;
    }
  }

  /**
   * Use quick synthesis (bypasses brain regions for minimal latency)
   * Good for short, common phrases like "Correct!" or "Try again"
   */
  async speakWithLumiQuick(text, prosody = 'lumi_60_v2') {
    const url = `${this.backends.lumi.url}/speak/quick`;
    text = this.preprocessTextForTTS(text);

    console.log(`⚡ Lumi Quick: "${text.substring(0, 50)}..."`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, prosody })
      });

      if (!response.ok) {
        throw new Error('Lumi Quick request failed');
      }

      const audioBlob = await response.blob();
      return this.playAudioBlob(audioBlob);
    } catch (e) {
      console.error('Lumi Quick error:', e);
      throw e;
    }
  }

  /**
   * Update quiz context to enable speculation for next likely responses
   * Call this after user answers a question
   */
  async updateLumiContext(utteranceType, wasCorrect = null, topic = null) {
    if (!this.backends.lumi.available) return;

    const url = `${this.backends.lumi.url}/context`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utterance_type: utteranceType,
          was_correct: wasCorrect,
          topic: topic
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔮 Lumi speculation updated:', data);
      }
    } catch (e) {
      console.warn('Failed to update Lumi context:', e);
    }
  }

  /**
   * Preload custom phrases into Lumi's reflex cache
   * Call this at quiz start with likely phrases
   */
  async preloadLumiPhrases(phrases) {
    if (!this.backends.lumi.available) return;

    const url = `${this.backends.lumi.url}/preload`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrases })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Lumi preload complete:', data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to preload Lumi phrases:', e);
    }
  }

  /**
   * Get detailed Lumi voice system statistics
   */
  async getLumiStats() {
    if (!this.backends.lumi.available) return null;

    try {
      const response = await fetch(`${this.backends.lumi.url}/stats`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Failed to get Lumi stats:', e);
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // COQUI TTS (Local Server)
  // ═══════════════════════════════════════════════════════════════

  async speakWithCoqui(text, emotion = 'playful') {
    const url = `${this.backends.coqui.url}/api/tts`;

    // Coqui supports style/emotion for some models
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        speaker_id: 'p225',  // Can be customized
        style_wav: null,
        language_id: 'en'
      })
    });

    if (!response.ok) throw new Error('Coqui TTS request failed');

    const audioBlob = await response.blob();
    return this.playAudioBlob(audioBlob);
  }

  // ═══════════════════════════════════════════════════════════════
  // AUDIO PLAYBACK
  // ═══════════════════════════════════════════════════════════════

  playAudioBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.volume = this.settings.volume;
      audio.playbackRate = this.settings.rate;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };

      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };

      this.currentAudio = audio;
      audio.play();
    });
  }

  stop() {
    // Stop browser TTS
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    // Stop audio playback
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Clear queue
    this.audioQueue = [];
    this.isPlaying = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // MS. LUMINARA SPECIFIC SPEECH
  // ═══════════════════════════════════════════════════════════════

  speakQuestion(questionText) {
    const smoothed = this.prepareQuestionForSpeech(questionText);
    this.speak(smoothed, { category: 'question', priority: 'high' });
  }

  /**
   * Speak Ms. Luminara's intro, then optionally read the question after
   * @param {string} introText - The intro message
   * @param {string} questionText - The question to read after the intro (optional)
   * @param {boolean} isWarmup - Whether this is a warmup question
   */
  speakIntroThenQuestion(introText, questionText = null, isWarmup = false) {
    // Remove the speaker label from intro
    const intro = introText.replace(/^Ms\. Luminara:?\s*/i, '');

    // Queue the intro
    this.speak(intro, { category: 'intro', emotion: 'playful' });

    // Queue the question after the intro if enabled
    if (questionText && this.settings.readQuestionsAloud) {
      // Smooth out quiz phrasing for natural speech
      const smoothedQuestion = this.prepareQuestionForSpeech(questionText);
      this.speak(smoothedQuestion, { category: 'question', emotion: 'neutral' });
    }

    // Start idle timer after both have been queued
    // The queue system will process them in order
    if (questionText && this.settings.waitForAnswer && this.settings.playfulPokes) {
      const totalWords = (intro + ' ' + (questionText || '')).split(/\s+/).length;
      const speechDuration = (totalWords / 150) * 60 * 1000 / this.settings.rate;

      setTimeout(() => {
        this.startIdleTimer();
      }, speechDuration + 2000);
    }
  }

  // Legacy method for backward compatibility
  speakIntro(introText) {
    // Remove the speaker label
    const text = introText.replace(/^Ms\. Luminara:?\s*/i, '');
    this.speak(text, { category: 'intro', emotion: 'playful' });
  }

  speakExplanation(text, isCorrect, streak = 0) {
    const emotion = isCorrect ? 'pleased' : 'encouraging';

    // Update Lumi context for speculation on next likely responses
    this.updateLumiContext(isCorrect ? 'correct' : 'incorrect', isCorrect);

    // Add library-driven preamble before explanation
    if (isCorrect && vocalizationLibrary.loaded) {
      const preamble = vocalizationLibrary.getCorrectResponse(streak);
      if (preamble) {
        this.speak(preamble, { category: 'explanation', emotion: 'pleased' });
      }
    } else if (!isCorrect && vocalizationLibrary.loaded) {
      const preamble = vocalizationLibrary.getIncorrectResponse();
      if (preamble) {
        this.speak(preamble, { category: 'explanation', emotion: 'encouraging' });
      }
    }

    // Then speak the actual explanation
    this.speak(text, { category: 'explanation', emotion });
  }

  speakAchievement(achievementMessage) {
    this.speak(achievementMessage, { category: 'achievement', emotion: 'excited', priority: 'high' });
  }

  speakLootDrop(itemName, rarity) {
    const phrases = {
      LEGENDARY: `Ooh, a ${itemName}. How fortunate you are...`,
      UNIQUE: `${itemName}. Very rare. I'm impressed.`,
      EPIC: `${itemName}. Not bad at all.`,
      RARE: `A ${itemName} for your collection.`
    };

    const text = phrases[rarity] || `You found a ${itemName}.`;
    this.speak(text, { category: 'loot', emotion: 'playful' });
  }

  speakStreakMessage(streak, message) {
    this.speak(message, { category: 'achievement', emotion: streak >= 10 ? 'excited' : 'playful' });
  }

  speakEncouragement(message) {
    this.speak(message, { category: 'explanation', emotion: 'encouraging' });
  }

  /**
   * Speak a library-driven intro message
   * @param {string} phase - 'warmup1', 'warmup2', or 'main'
   * @param {object} context - { afterCorrect, afterIncorrect, streakBroken }
   */
  speakLibraryIntro(phase, context = {}) {
    const message = vocalizationLibrary.getIntroMessage(phase, context);
    if (message) {
      this.speak(message, { category: 'intro', emotion: 'playful' });
    }
  }

  /**
   * Speak response to correct answer from library
   * @param {number} streak - Current streak count
   */
  speakCorrectFromLibrary(streak = 0) {
    const message = vocalizationLibrary.getCorrectResponse(streak);
    if (message) {
      this.speak(message, { category: 'explanation', emotion: 'pleased' });
    }
  }

  /**
   * Speak response to incorrect answer from library
   */
  speakIncorrectFromLibrary() {
    const message = vocalizationLibrary.getIncorrectResponse();
    if (message) {
      this.speak(message, { category: 'explanation', emotion: 'encouraging' });
    }
  }

  /**
   * Speak session start/end message from library
   * @param {string} type - 'session_start', 'session_end', 'break_suggested'
   */
  speakSessionMessage(type) {
    const message = vocalizationLibrary.getSessionMessage(type);
    if (message) {
      this.speak(message, { category: 'intro', emotion: 'playful' });
    }
  }

  /**
   * Get voice presets - from library or fallback defaults
   */
  getVoicePresets() {
    if (vocalizationLibrary.loaded && vocalizationLibrary.data?.voice_presets) {
      return vocalizationLibrary.data.voice_presets;
    }

    // Fallback presets when library not loaded
    // Note: These only change audio parameters, NOT the voice model
    return {
      recommended: {
        name: "Balanced",
        description: "Warm and clear - the default Ms. Luminara",
        settings: {
          rate: 1.0,
          volume: 0.85,
          piperLengthScale: 1.0,
          piperNoiseScale: 0.667,
          piperNoiseW: 0.8,
          sentencePause: 300
        }
      },
      alternatives: [
        {
          name: "Energetic",
          description: "Quick and lively for fast-paced sessions",
          settings: {
            rate: 1.15,
            volume: 0.9,
            piperLengthScale: 0.85,
            piperNoiseScale: 0.75,
            piperNoiseW: 0.85,
            sentencePause: 200
          }
        },
        {
          name: "Contemplative",
          description: "Slow and thoughtful for deep learning",
          settings: {
            rate: 0.85,
            volume: 0.8,
            piperLengthScale: 1.2,
            piperNoiseScale: 0.5,
            piperNoiseW: 0.6,
            sentencePause: 450
          }
        },
        {
          name: "Playful",
          description: "Bouncy and teasing",
          settings: {
            rate: 1.05,
            volume: 0.88,
            piperLengthScale: 0.95,
            piperNoiseScale: 0.8,
            piperNoiseW: 0.9,
            sentencePause: 250
          }
        },
        {
          name: "Deadpan",
          description: "Dry and matter-of-fact",
          settings: {
            rate: 0.9,
            volume: 0.75,
            piperLengthScale: 1.15,
            piperNoiseScale: 0.4,
            piperNoiseW: 0.5,
            sentencePause: 400
          }
        },
        {
          name: "Intimate",
          description: "Soft and close, like a whisper",
          settings: {
            rate: 0.8,
            volume: 0.6,
            piperLengthScale: 1.3,
            piperNoiseScale: 0.55,
            piperNoiseW: 0.65,
            sentencePause: 500
          }
        }
      ]
    };
  }

  /**
   * Apply a voice preset
   * @param {string} presetName - 'recommended' or one of the alternative names
   */
  applyVoicePreset(presetName) {
    console.log('voiceSystem.applyVoicePreset called with:', presetName);
    const presets = this.getVoicePresets();
    console.log('Available presets:', presets);
    if (!presets) {
      console.error('No presets available');
      return false;
    }

    let preset;
    if (presetName === 'recommended') {
      preset = presets.recommended;
    } else {
      preset = presets.alternatives?.find(p => p.name === presetName);
    }

    console.log('Found preset:', preset);
    if (!preset?.settings) {
      console.error('Preset not found or has no settings:', presetName);
      return false;
    }

    // Apply the preset settings
    // NOTE: We intentionally do NOT change the voice model or backend
    // Presets only affect audio parameters, user keeps their voice choice

    // Basic audio settings
    if (preset.settings.rate !== undefined) {
      this.settings.rate = preset.settings.rate;
    }
    if (preset.settings.pitch !== undefined) {
      this.settings.pitch = preset.settings.pitch;
    }
    if (preset.settings.volume !== undefined) {
      this.settings.volume = preset.settings.volume;
    }

    // Advanced Piper synthesis parameters
    if (preset.settings.piperLengthScale !== undefined) {
      this.settings.piperLengthScale = preset.settings.piperLengthScale;
    }
    if (preset.settings.piperNoiseScale !== undefined) {
      this.settings.piperNoiseScale = preset.settings.piperNoiseScale;
    }
    if (preset.settings.piperNoiseW !== undefined) {
      this.settings.piperNoiseW = preset.settings.piperNoiseW;
    }
    if (preset.settings.piperSpeakerId !== undefined) {
      this.settings.piperSpeakerId = preset.settings.piperSpeakerId;
    }

    // Audio processing
    if (preset.settings.sentencePause !== undefined) {
      this.settings.sentencePause = preset.settings.sentencePause;
    }
    if (preset.settings.emphasisBoost !== undefined) {
      this.settings.emphasisBoost = preset.settings.emphasisBoost;
    }

    this.saveSettings();
    console.log('Applied voice preset:', presetName, preset.settings);
    return true;
  }

  /**
   * Get available voices from all backends with full metadata
   * Returns structured data for voice preview UI
   */
  async getVoicesWithMetadata() {
    const voices = [];

    // Browser voices
    if (this.browserVoices) {
      for (const v of this.browserVoices) {
        voices.push({
          backend: 'browser',
          id: v.name,
          name: v.name,
          lang: v.lang,
          label: `${v.name} (${v.lang})`,
          gender: this._inferGender(v.name),
          quality: 'standard'
        });
      }
    }

    // Piper voices with full metadata
    if (this.backends.piper.available && this.backends.piper.voiceData) {
      const piperVoices = this.backends.piper.voiceData.voices || [];
      for (const v of piperVoices) {
        voices.push({
          backend: 'piper',
          id: v.key,
          name: v.name,
          lang: v.language,
          label: `Piper: ${v.name}`,
          gender: v.gender || 'unknown',
          quality: v.quality || 'medium',
          accent: v.accent,
          description: v.description
        });
      }
    } else if (this.backends.piper.available) {
      // Fallback to basic model list
      const models = this.backends.piper.models || [];
      for (const m of models) {
        voices.push({
          backend: 'piper',
          id: m,
          name: m,
          label: `Piper: ${m}`,
          quality: 'medium'
        });
      }
    }

    return voices;
  }

  _inferGender(name) {
    const femaleIndicators = ['female', 'woman', 'zira', 'samantha', 'karen', 'moira', 'fiona', 'hazel', 'jenny', 'alba', 'amy'];
    const maleIndicators = ['male', 'man', 'david', 'mark', 'daniel', 'ryan'];

    const lower = name.toLowerCase();
    if (femaleIndicators.some(i => lower.includes(i))) return 'female';
    if (maleIndicators.some(i => lower.includes(i))) return 'male';
    return 'unknown';
  }

  // ═══════════════════════════════════════════════════════════════
  // SETTINGS UI
  // ═══════════════════════════════════════════════════════════════

  getAvailableVoices() {
    const voices = [];

    // Browser voices
    if (this.browserVoices) {
      for (const v of this.browserVoices) {
        voices.push({
          backend: 'browser',
          name: v.name,
          lang: v.lang,
          label: `${v.name} (${v.lang})`
        });
      }
    }

    // Piper voices (common models)
    if (this.backends.piper.available) {
      const piperModels = [
        { id: 'en_US-lessac-medium', name: 'Lessac (US Female)' },
        { id: 'en_US-amy-medium', name: 'Amy (US Female)' },
        { id: 'en_US-libritts-high', name: 'LibriTTS (US)' },
        { id: 'en_GB-alba-medium', name: 'Alba (UK Female)' },
        { id: 'en_GB-jenny-medium', name: 'Jenny (UK Female)' }
      ];

      for (const m of piperModels) {
        voices.push({
          backend: 'piper',
          name: m.id,
          label: `Piper: ${m.name}`
        });
      }
    }

    return voices;
  }

  setEnabled(enabled) {
    this.settings.enabled = enabled;
    this.saveSettings();
    if (!enabled) this.stop();
  }

  setBackend(backend) {
    this.settings.backend = backend;
    this.saveSettings();
  }

  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  setRate(rate) {
    this.settings.rate = Math.max(0.5, Math.min(2, rate));
    this.saveSettings();
  }

  setPitch(pitch) {
    this.settings.pitch = Math.max(0.5, Math.min(2, pitch));
    this.saveSettings();
  }

  setBrowserVoice(voiceName) {
    this.settings.browserVoiceName = voiceName;
    this.saveSettings();
  }

  setPiperModel(modelId) {
    this.settings.piperModel = modelId;
    this.saveSettings();
  }

  // Lumi Voice settings
  /**
   * Enable Lumi v4 as the voice backend
   * This is the recommended voice for Ms. Luminara quiz
   */
  enableLumiVoice() {
    this.settings.backend = 'lumi';
    this.saveSettings();
    console.log('🎭 Lumi Voice enabled - context-aware synthesis active');
    return this.backends.lumi.available;
  }

  /**
   * Check if Lumi voice is available
   */
  isLumiAvailable() {
    return this.backends.lumi.available;
  }

  // XTTS Voice Lab settings
  setXttsVoiceId(voiceId) {
    this.settings.xttsVoiceId = voiceId;
    this.saveSettings();
  }

  setXttsSpeed(value) {
    this.settings.xttsSpeed = Math.max(0.5, Math.min(2.0, value));
    this.saveSettings();
  }

  setXttsTemperature(value) {
    this.settings.xttsTemperature = Math.max(0.1, Math.min(1.0, value));
    this.saveSettings();
  }

  setXttsTopP(value) {
    this.settings.xttsTopP = Math.max(0.1, Math.min(1.0, value));
    this.saveSettings();
  }

  setXttsRepetitionPenalty(value) {
    this.settings.xttsRepetitionPenalty = Math.max(1.0, Math.min(10.0, value));
    this.saveSettings();
  }

  // Advanced Piper synthesis parameters
  setPiperLengthScale(value) {
    this.settings.piperLengthScale = Math.max(0.5, Math.min(2.0, value));
    this.saveSettings();
  }

  setPiperNoiseScale(value) {
    this.settings.piperNoiseScale = Math.max(0, Math.min(1, value));
    this.saveSettings();
  }

  setPiperNoiseW(value) {
    this.settings.piperNoiseW = Math.max(0, Math.min(1, value));
    this.saveSettings();
  }

  setPiperSpeakerId(value) {
    this.settings.piperSpeakerId = Math.max(0, Math.floor(value));
    this.saveSettings();
  }

  setSentencePause(ms) {
    this.settings.sentencePause = Math.max(0, Math.min(2000, ms));
    this.saveSettings();
  }

  setEmphasisBoost(value) {
    this.settings.emphasisBoost = Math.max(1.0, Math.min(1.5, value));
    this.saveSettings();
  }

  // Test the current voice
  async testVoice() {
    await this.speak(
      "Hello, darling. I'm Ms. Luminara, and I'll be your guide through the mysteries of anatomy. Shall we begin?",
      { priority: 'high', emotion: 'playful' }
    );
  }

  // Diagnostic: Check current voice configuration
  async diagnose() {
    // Fetch Lumi stats if available
    const lumiStats = await this.getLumiStats();

    const status = {
      backend: this.settings.backend,
      lumiAvailable: this.backends.lumi.available,
      lumiVersion: this.backends.lumi.version || 'unknown',
      lumiFeatures: this.backends.lumi.features || {},
      lumiStats: lumiStats,
      xttsVoiceId: this.settings.xttsVoiceId,
      xttsAvailable: this.backends.xtts.available,
      piperAvailable: this.backends.piper.available,
      piperModel: this.settings.piperModel,
      enabled: this.settings.enabled,
      allSettings: { ...this.settings },
      allBackends: Object.fromEntries(
        Object.entries(this.backends).map(([k, v]) => [k, { available: v.available, name: v.name }])
      )
    };
    console.log('🔍 VoiceSystem Diagnostics:', status);
    console.table({
      'Backend': status.backend,
      'Lumi Available': status.lumiAvailable,
      'Lumi Version': status.lumiVersion,
      'Lumi Features': Object.keys(status.lumiFeatures).filter(k => status.lumiFeatures[k]).join(', ') || 'none',
      'Lumi RTF': lumiStats?.overall_rtf?.toFixed(2) || 'N/A',
      'Lumi Reflex Rate': lumiStats?.reflex_rate ? (lumiStats.reflex_rate * 100).toFixed(0) + '%' : 'N/A',
      'XTTS Voice': status.xttsVoiceId || '(none)',
      'XTTS Available': status.xttsAvailable,
      'Piper Model': status.piperModel,
      'Piper Available': status.piperAvailable,
      'Enabled': status.enabled
    });
    return status;
  }

  /**
   * Preview a specific voice with sample text
   * Useful for A/B comparison in settings
   * @param {object} voiceConfig - { backend, id/name }
   * @param {string} sampleType - 'short', 'medium', 'long', 'question'
   */
  async previewVoice(voiceConfig, sampleType = 'medium') {
    const samples = {
      short: "Hello, darling.",
      medium: "The mitochondria is the powerhouse of the cell. But you knew that, didn't you?",
      long: "Hello, darling. I'm Ms. Luminara, and I'll be your guide through the mysteries of anatomy. We'll shrink down, slip inside, and see what makes you tick. Shall we begin?",
      question: "Which of the following structures is responsible for generating action potentials in cardiac muscle?",
      poke: vocalizationLibrary.getPokeMessage(2) || "The silence is... interesting. Are you admiring the question, or avoiding it?",
      enthusiastic: "Oh, how convenient! A nice cellular structure for us to explore. Let's see what secrets it holds!"
    };

    const text = samples[sampleType] || samples.medium;

    // Temporarily switch to preview voice
    const originalBackend = this.settings.backend;
    const originalModel = this.settings.piperModel;
    const originalVoice = this.settings.browserVoiceName;

    try {
      if (voiceConfig.backend === 'piper') {
        this.settings.backend = 'piper';
        this.settings.piperModel = voiceConfig.id || voiceConfig.name;
      } else if (voiceConfig.backend === 'browser') {
        this.settings.backend = 'browser';
        this.settings.browserVoiceName = voiceConfig.id || voiceConfig.name;
      }

      // Speak without saving settings
      await this.speak(text, { priority: 'high', emotion: 'playful' });

    } finally {
      // Restore original settings
      this.settings.backend = originalBackend;
      this.settings.piperModel = originalModel;
      this.settings.browserVoiceName = originalVoice;
    }
  }

  /**
   * Compare two voices side by side
   * @param {object} voice1 - First voice config
   * @param {object} voice2 - Second voice config
   * @param {string} sampleType - Sample text type
   */
  async compareVoices(voice1, voice2, sampleType = 'medium') {
    await this.previewVoice(voice1, sampleType);
    // Small pause between voices
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.previewVoice(voice2, sampleType);
  }

  // ═══════════════════════════════════════════════════════════════
  // INTERACTIVE MODE - IDLE POKES
  // ═══════════════════════════════════════════════════════════════

  startIdleTimer() {
    this.stopIdleTimer();
    if (!this.settings.enabled || !this.settings.playfulPokes) return;

    this.pokeCount = 0;
    this.idleStartTime = Date.now();

    this.idleTimer = setInterval(() => {
      this.pokeCount++;
      this.deliverPoke();
    }, this.settings.pokeIntervalSeconds * 1000);
  }

  stopIdleTimer() {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }
    this.pokeCount = 0;
  }

  deliverPoke() {
    if (!this.settings.enabled || !this.settings.playfulPokes) return;

    // Get poke from vocalization library (escalating levels 1-5)
    const poke = vocalizationLibrary.getPokeMessage(this.pokeCount);

    if (poke) {
      this.speak(poke, { category: 'poke', emotion: 'playful', priority: 'normal' });
    }
  }

  // Called when a new question is displayed
  onQuestionDisplayed(questionText, isWarmup = false) {
    this.stopIdleTimer();

    if (!this.settings.enabled) return;

    // Update Lumi context for question speculation
    this.updateLumiContext('question');

    if (this.settings.readQuestionsAloud) {
      const prefix = isWarmup ? "Warmup question: " : "";
      this.speakQuestion(prefix + questionText);
    }

    if (this.settings.waitForAnswer && this.settings.playfulPokes) {
      // Start the idle timer after speech finishes
      // Estimate speech duration: ~150 words per minute at 1.0 rate
      const wordCount = questionText.split(/\s+/).length;
      const speechDuration = (wordCount / 150) * 60 * 1000 / this.settings.rate;

      setTimeout(() => {
        this.startIdleTimer();
      }, speechDuration + 2000); // Add 2 second buffer
    }
  }

  // Called when user interacts (clicks an answer)
  onUserInteraction() {
    this.stopIdleTimer();
  }

  // ═══════════════════════════════════════════════════════════════
  // CLEANUP & RESOURCE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Graceful shutdown - call this when the page is unloading
   * or when the voice system is no longer needed
   */
  destroy() {
    // Stop all audio and timers
    this.stop();
    this.stopIdleTimer();

    // Remove event listeners
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = null;
    }

    // Clear references
    this.browserVoices = null;
    this.currentAudio = null;
    this.currentUtterance = null;
    this.audioQueue = [];

    console.log('Voice system destroyed and resources freed');
  }

  /**
   * Pause the voice system (e.g., when tab loses focus)
   */
  pause() {
    this.stop();
    this.stopIdleTimer();
    this._wasPaused = true;
  }

  /**
   * Resume the voice system (e.g., when tab regains focus)
   */
  resume() {
    this._wasPaused = false;
    // Don't auto-resume anything - let the next interaction trigger speech
  }
}

// Export singleton
let voiceSystem = null;

// Set up page lifecycle handlers for graceful cleanup
if (typeof window !== 'undefined') {
  // Clean up when page is unloading
  window.addEventListener('beforeunload', () => {
    if (voiceSystem) {
      voiceSystem.destroy();
    }
  });

  // Pause when tab loses visibility (saves resources)
  document.addEventListener('visibilitychange', () => {
    if (!voiceSystem) return;

    if (document.hidden) {
      voiceSystem.pause();
    } else {
      voiceSystem.resume();
    }
  });
}
