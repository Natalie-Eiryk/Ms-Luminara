/**
 * 000.13-lumi-bridge.js
 * TOCK 4: LUMI-OS Bridge & Teaching Export
 *
 * Integration with LUMI-OS for:
 * - Real-time session sync via WebSocket
 * - Export training data in JSONL format
 * - Pi-Line memory integration
 * - Isotope tagging for recall prioritization
 */

const LumiBridge = {
  // Connection state
  ws: null,
  connected: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 2000,

  // LUMI-OS endpoint (configurable)
  config: {
    host: 'localhost',
    port: 8765,
    protocol: 'ws',
    endpoints: {
      session: '/teaching/session',
      export: '/teaching/export',
      memory: '/memory/isotope'
    }
  },

  // Session data
  session: {
    id: null,
    startTime: null,
    interactions: [],
    exportedData: []
  },

  // Initialize bridge
  init(config = {}) {
    this.config = { ...this.config, ...config };
    this.loadSessionFromStorage();
    console.log('[LumiBridge] Initialized');
  },

  // Connect to LUMI-OS WebSocket
  async connect() {
    if (this.connected) return true;

    const url = `${this.config.protocol}://${this.config.host}:${this.config.port}${this.config.endpoints.session}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[LumiBridge] Connected to LUMI-OS');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.sendHandshake();
          resolve(true);
        };

        this.ws.onclose = () => {
          console.log('[LumiBridge] Disconnected from LUMI-OS');
          this.connected = false;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.warn('[LumiBridge] WebSocket error:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            this.handleMessage(JSON.parse(event.data));
          } catch (e) {
            console.warn('[LumiBridge] Failed to parse message:', e);
          }
        };

      } catch (error) {
        console.warn('[LumiBridge] Connection failed:', error);
        reject(error);
      }
    });
  },

  // Send handshake message
  sendHandshake() {
    this.send({
      type: 'handshake',
      module: 'ms_luminara_quiz',
      version: '1.0.0',
      capabilities: ['isotope', 'zpd', 'srs', 'multimodal'],
      session_id: this.session.id
    });
  },

  // Attempt reconnection
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[LumiBridge] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`[LumiBridge] Reconnection attempt ${this.reconnectAttempts}...`);
      this.connect().catch(() => {});
    }, this.reconnectDelay * this.reconnectAttempts);
  },

  // Send message to LUMI-OS
  send(data) {
    if (!this.connected || !this.ws) {
      console.warn('[LumiBridge] Not connected, queueing message');
      this.queueMessage(data);
      return;
    }

    this.ws.send(JSON.stringify({
      ...data,
      timestamp: Date.now(),
      session_id: this.session.id
    }));
  },

  // Queue message for later
  queueMessage(data) {
    if (!this._messageQueue) this._messageQueue = [];
    this._messageQueue.push(data);
  },

  // Handle incoming message from LUMI-OS
  handleMessage(message) {
    switch (message.type) {
      case 'session_confirmed':
        this.session.id = message.session_id;
        console.log(`[LumiBridge] Session confirmed: ${this.session.id}`);
        break;

      case 'isotope_enriched':
        // LUMI-OS has enriched isotope data
        this.handleIsotopeEnrichment(message.data);
        break;

      case 'zpd_feedback':
        // LUMI-OS ZPD analysis feedback
        this.handleZPDFeedback(message.data);
        break;

      case 'memory_recall':
        // Related memories from Pi-Line
        this.handleMemoryRecall(message.data);
        break;

      default:
        console.log('[LumiBridge] Unknown message type:', message.type);
    }
  },

  // Handle isotope enrichment from LUMI-OS
  handleIsotopeEnrichment(data) {
    // Emit event for UI to handle
    window.dispatchEvent(new CustomEvent('lumi-isotope-enriched', {
      detail: data
    }));
  },

  // Handle ZPD feedback from LUMI-OS
  handleZPDFeedback(data) {
    window.dispatchEvent(new CustomEvent('lumi-zpd-feedback', {
      detail: data
    }));
  },

  // Handle memory recall from Pi-Line
  handleMemoryRecall(data) {
    window.dispatchEvent(new CustomEvent('lumi-memory-recall', {
      detail: data
    }));
  },

  // ==================== Teaching Interaction Recording ====================

  // Record a question interaction
  recordInteraction(data) {
    const interaction = {
      timestamp: Date.now(),
      question_id: data.questionId,
      format: data.format || 'multiple-choice',
      response: data.response,
      correct: data.correct,
      time_to_answer: data.timeToAnswer,
      mentor_style: data.mentorStyle,
      attempt_number: data.attemptNumber || 1,
      zpd_moment: data.zpdMoment,
      isotopes: data.isotopes || [],
      scaffolding_used: data.scaffoldingUsed || [],
      srs_rating: data.srsRating
    };

    this.session.interactions.push(interaction);
    this.saveSessionToStorage();

    // Send to LUMI-OS if connected
    this.send({
      type: 'interaction',
      data: interaction
    });

    return interaction;
  },

  // Record a session event (mode change, filter change, etc.)
  recordEvent(eventType, eventData) {
    const event = {
      timestamp: Date.now(),
      type: eventType,
      data: eventData
    };

    this.session.interactions.push(event);

    this.send({
      type: 'event',
      event_type: eventType,
      data: eventData
    });
  },

  // ==================== Training Data Export ====================

  // Export session as JSONL for LLM training
  exportAsJSONL(options = {}) {
    const lines = [];

    for (const interaction of this.session.interactions) {
      if (interaction.question_id) {
        const trainingExample = this.formatTrainingExample(interaction, options);
        if (trainingExample) {
          lines.push(JSON.stringify(trainingExample));
        }
      }
    }

    return lines.join('\n');
  },

  // Format a single training example
  formatTrainingExample(interaction, options = {}) {
    const questions = options.questions || [];
    const question = questions.find(q => q.id === interaction.question_id);
    if (!question) return null;

    const format = options.format || 'instruction-response';

    switch (format) {
      case 'instruction-response':
        return this.formatInstructionResponse(question, interaction);

      case 'conversation':
        return this.formatConversation(question, interaction);

      case 'claim-units':
        return this.formatClaimUnits(question, interaction);

      default:
        return this.formatInstructionResponse(question, interaction);
    }
  },

  // Format as instruction-response pair
  formatInstructionResponse(question, interaction) {
    return {
      instruction: question.q,
      input: question.options.join('\n'),
      output: question.options[question.answer],
      explanation: question.explain || '',
      metadata: {
        isotopes: interaction.isotopes,
        correct: interaction.correct,
        attempt_number: interaction.attempt_number,
        zpd_moment: interaction.zpd_moment,
        category: question._category
      }
    };
  },

  // Format as conversation turns
  formatConversation(question, interaction) {
    const turns = [];

    // Student asks or is presented with question
    turns.push({
      role: 'system',
      content: `You are ${interaction.mentor_style === 'luminara' ? 'Ms. Luminara' :
                         interaction.mentor_style === 'frizzle' ? 'Ms. Frizzle' :
                         'Richard Feynman'}, teaching anatomy and physiology.`
    });

    turns.push({
      role: 'user',
      content: question.q + '\n\nOptions:\n' + question.options.map((o, i) =>
        `${String.fromCharCode(65 + i)}. ${o}`
      ).join('\n')
    });

    // Mentor response based on correctness
    if (interaction.correct) {
      turns.push({
        role: 'assistant',
        content: `Correct! ${question.explain || ''}`
      });
    } else {
      turns.push({
        role: 'assistant',
        content: `Not quite. The correct answer is ${String.fromCharCode(65 + question.answer)}: ${question.options[question.answer]}.\n\n${question.explain || ''}`
      });
    }

    // Add mechanism if available
    if (question.mechanism?.content) {
      turns.push({
        role: 'assistant',
        content: question.mechanism.content
      });
    }

    return {
      messages: turns,
      metadata: {
        isotopes: interaction.isotopes,
        zpd_moment: interaction.zpd_moment
      }
    };
  },

  // Format as claim units for Pi-Line
  formatClaimUnits(question, interaction) {
    const units = [];

    // Extract claim units from question
    const text = question.explain || question.mechanism?.content || '';

    // Pattern: Agent → Verb → Target
    const patterns = [
      /(\w+(?:\s+\w+)?)\s+(activates?|inhibits?|releases?|binds?|controls?|stimulates?)\s+(\w+(?:\s+\w+)?)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        units.push({
          agent: match[1].toLowerCase(),
          verb: match[2].toLowerCase(),
          target: match[3].toLowerCase(),
          outcome: interaction.correct ? 'understood' : 'needs_review',
          isotopes: interaction.isotopes,
          source_question: question.id
        });
      }
    }

    return {
      claim_units: units,
      question_id: question.id,
      zpd_data: {
        moment_type: interaction.zpd_moment,
        attempt_number: interaction.attempt_number,
        mastered: interaction.correct
      }
    };
  },

  // Export summary statistics
  exportSummary() {
    const interactions = this.session.interactions.filter(i => i.question_id);

    const summary = {
      session_id: this.session.id,
      start_time: this.session.startTime,
      total_questions: interactions.length,
      correct_count: interactions.filter(i => i.correct).length,
      accuracy: interactions.length > 0 ?
        parseFloat((interactions.filter(i => i.correct).length / interactions.length * 100).toFixed(1)) : 0,

      // Time analysis
      avg_time_to_answer: interactions.length > 0 ?
        Math.round(interactions.reduce((sum, i) => sum + (i.time_to_answer || 0), 0) / interactions.length) : 0,

      // ZPD analysis
      zpd_moments: this.analyzeZPDMoments(interactions),

      // Isotope coverage
      isotopes_encountered: this.getIsotopeCoverage(interactions),

      // Format usage
      format_distribution: this.getFormatDistribution(interactions),

      // Mentor style effectiveness
      mentor_effectiveness: this.getMentorEffectiveness(interactions)
    };

    return summary;
  },

  // Analyze ZPD moments
  analyzeZPDMoments(interactions) {
    const moments = {};
    for (const i of interactions) {
      if (i.zpd_moment) {
        if (!moments[i.zpd_moment]) {
          moments[i.zpd_moment] = { count: 0, correct: 0 };
        }
        moments[i.zpd_moment].count++;
        if (i.correct) moments[i.zpd_moment].correct++;
      }
    }
    return moments;
  },

  // Get isotope coverage
  getIsotopeCoverage(interactions) {
    const isotopes = new Set();
    for (const i of interactions) {
      for (const iso of (i.isotopes || [])) {
        isotopes.add(iso);
      }
    }
    return Array.from(isotopes);
  },

  // Get format distribution
  getFormatDistribution(interactions) {
    const formats = {};
    for (const i of interactions) {
      const format = i.format || 'multiple-choice';
      if (!formats[format]) {
        formats[format] = { count: 0, correct: 0 };
      }
      formats[format].count++;
      if (i.correct) formats[format].correct++;
    }
    return formats;
  },

  // Get mentor effectiveness
  getMentorEffectiveness(interactions) {
    const mentors = {};
    for (const i of interactions) {
      const mentor = i.mentor_style || 'luminara';
      if (!mentors[mentor]) {
        mentors[mentor] = { count: 0, correct: 0 };
      }
      mentors[mentor].count++;
      if (i.correct) mentors[mentor].correct++;
    }

    // Calculate effectiveness score
    for (const mentor in mentors) {
      mentors[mentor].effectiveness =
        mentors[mentor].count > 0 ?
        (mentors[mentor].correct / mentors[mentor].count * 100).toFixed(1) : 0;
    }

    return mentors;
  },

  // ==================== Pi-Line Memory Integration ====================

  // Send isotope data to Pi-Line
  sendIsotopeToMemory(isotope, data) {
    this.send({
      type: 'memory_store',
      isotope: isotope,
      data: {
        ...data,
        source: 'ms_luminara_quiz',
        timestamp: Date.now()
      }
    });
  },

  // Query Pi-Line for related memories
  queryRelatedMemories(isotopes) {
    this.send({
      type: 'memory_query',
      isotopes: isotopes,
      max_results: 5
    });
  },

  // ==================== Session Management ====================

  // Start new session
  startSession() {
    this.session = {
      id: `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      startTime: Date.now(),
      interactions: [],
      exportedData: []
    };
    this.saveSessionToStorage();
    console.log(`[LumiBridge] Started session: ${this.session.id}`);
  },

  // End session
  endSession() {
    this.recordEvent('session_end', {
      duration: Date.now() - this.session.startTime,
      interaction_count: this.session.interactions.length
    });

    // Export summary
    const summary = this.exportSummary();
    this.send({
      type: 'session_complete',
      summary: summary
    });

    return summary;
  },

  // Save session to localStorage
  saveSessionToStorage() {
    try {
      localStorage.setItem('lumi_bridge_session', JSON.stringify({
        session: this.session,
        lastSaved: Date.now()
      }));
    } catch (e) {
      console.warn('[LumiBridge] Could not save session:', e);
    }
  },

  // Load session from localStorage
  loadSessionFromStorage() {
    try {
      const saved = localStorage.getItem('lumi_bridge_session');
      if (saved) {
        const data = JSON.parse(saved);
        // Only restore if session is recent (< 1 hour)
        if (Date.now() - data.lastSaved < 3600000) {
          this.session = data.session;
          console.log(`[LumiBridge] Restored session: ${this.session.id}`);
        } else {
          this.startSession();
        }
      } else {
        this.startSession();
      }
    } catch (e) {
      this.startSession();
    }
  },

  // Download export as file
  downloadExport(format = 'jsonl') {
    let content, filename, mimeType;

    switch (format) {
      case 'jsonl':
        // Try to get questions from Game (quick-quiz) or quiz.questionBanks (main quiz)
        const questionsSource = window.Game?.questions ||
                               (window.quiz?.questionBanks ? Object.values(window.quiz.questionBanks).flat() : []);
        content = this.exportAsJSONL({ questions: questionsSource });
        filename = `luminara_training_${this.session.id}.jsonl`;
        mimeType = 'application/jsonl';
        break;

      case 'json':
        content = JSON.stringify({
          session: this.session,
          summary: this.exportSummary()
        }, null, 2);
        filename = `luminara_session_${this.session.id}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        content = this.exportAsCSV();
        filename = `luminara_interactions_${this.session.id}.csv`;
        mimeType = 'text/csv';
        break;

      default:
        console.warn('Unknown export format:', format);
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    console.log(`[LumiBridge] Exported ${filename}`);
  },

  // Export as CSV
  exportAsCSV() {
    const interactions = this.session.interactions.filter(i => i.question_id);

    const headers = [
      'timestamp', 'question_id', 'format', 'correct', 'time_to_answer',
      'mentor_style', 'attempt_number', 'zpd_moment', 'srs_rating'
    ];

    const rows = interactions.map(i => [
      new Date(i.timestamp).toISOString(),
      i.question_id,
      i.format,
      i.correct,
      i.time_to_answer,
      i.mentor_style,
      i.attempt_number,
      i.zpd_moment,
      i.srs_rating
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  // Disconnect and cleanup
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LumiBridge;
}
