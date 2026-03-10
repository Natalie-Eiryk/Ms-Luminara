/**
 * Ms. Luminara Quiz - Vygotsky Adaptive Scaffolding System
 *
 * Implements Zone of Proximal Development (ZPD) principles:
 * - Tracks performance per topic/concept
 * - Adjusts support level based on struggles
 * - Progressive challenge when mastering
 * - Spaced repetition for reinforcement
 */

class ScaffoldingEngine {
  constructor(persistenceManager) {
    this.persistence = persistenceManager;
    this.STORAGE_KEY = 'ms_luminara_scaffolding';
    this.data = this.loadScaffoldingData();

    // Scaffolding levels (more support → less support)
    this.LEVELS = {
      HEAVY: 'heavy',      // Struggling: extra hints, slower pace
      MODERATE: 'moderate', // Learning: standard warmups
      LIGHT: 'light',      // Progressing: can skip warmups
      CHALLENGE: 'challenge' // Mastering: harder question ordering
    };

    // Thresholds for level transitions
    this.STRUGGLE_THRESHOLD = 0.4;    // Below 40% = struggling
    this.LEARNING_THRESHOLD = 0.6;    // 40-60% = learning
    this.PROGRESSING_THRESHOLD = 0.8; // 60-80% = progressing
    // Above 80% = mastering
  }

  loadScaffoldingData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load scaffolding data:', e);
    }
    return this.getDefaultData();
  }

  getDefaultData() {
    return {
      topicPerformance: {},      // Performance by topic prefix (e.g., "100.1")
      conceptStrengths: {},      // Strength per concept tag
      recentPerformance: [],     // Last N answers for trend analysis
      scaffoldLevel: 'moderate', // Current global scaffold level
      hintsShown: {},            // Track which hints have been shown
      reviewQueue: [],           // Questions to review (spaced repetition)
      sessionStruggleCount: 0,   // How many struggles this session
      sessionSuccessCount: 0     // How many successes this session
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save scaffolding data:', e);
    }
  }

  /**
   * Record an answer and update scaffolding
   */
  recordAnswer(questionId, wasCorrectFirstTry, explorationCount) {
    const topicPrefix = this.getTopicPrefix(questionId);

    // Update topic performance
    if (!this.data.topicPerformance[topicPrefix]) {
      this.data.topicPerformance[topicPrefix] = {
        attempts: 0,
        correct: 0,
        explorations: 0,
        lastSeen: null,
        consecutiveCorrect: 0,
        consecutiveWrong: 0
      };
    }

    const topic = this.data.topicPerformance[topicPrefix];
    topic.attempts++;
    topic.explorations += explorationCount;
    topic.lastSeen = new Date().toISOString();

    if (wasCorrectFirstTry) {
      topic.correct++;
      topic.consecutiveCorrect++;
      topic.consecutiveWrong = 0;
      this.data.sessionSuccessCount++;
    } else {
      topic.consecutiveCorrect = 0;
      topic.consecutiveWrong++;
      this.data.sessionStruggleCount++;

      // Add to review queue if struggling
      if (topic.consecutiveWrong >= 2 && !this.data.reviewQueue.includes(questionId)) {
        this.data.reviewQueue.push(questionId);
      }
    }

    // Update recent performance window
    this.data.recentPerformance.push({
      questionId,
      correct: wasCorrectFirstTry,
      explorations: explorationCount,
      timestamp: Date.now()
    });

    // Keep only last 20 answers
    if (this.data.recentPerformance.length > 20) {
      this.data.recentPerformance.shift();
    }

    // Recalculate scaffold level
    this.updateScaffoldLevel();
    this.save();

    return this.getScaffoldingAdvice(topicPrefix);
  }

  /**
   * Get topic prefix from question ID (e.g., "100.1.05" → "100.1")
   */
  getTopicPrefix(questionId) {
    if (!questionId) return 'unknown';
    const parts = questionId.split('.');
    return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : questionId;
  }

  /**
   * Calculate performance ratio for a topic
   */
  getTopicPerformance(topicPrefix) {
    const topic = this.data.topicPerformance[topicPrefix];
    if (!topic || topic.attempts === 0) return null;
    return topic.correct / topic.attempts;
  }

  /**
   * Get recent performance trend
   */
  getRecentTrend() {
    const recent = this.data.recentPerformance;
    if (recent.length < 3) return 'neutral';

    const lastFive = recent.slice(-5);
    const correctCount = lastFive.filter(r => r.correct).length;
    const ratio = correctCount / lastFive.length;

    if (ratio >= 0.8) return 'improving';
    if (ratio <= 0.4) return 'struggling';
    return 'steady';
  }

  /**
   * Update global scaffold level based on performance
   */
  updateScaffoldLevel() {
    const recent = this.data.recentPerformance;
    if (recent.length < 5) return; // Need enough data

    const lastTen = recent.slice(-10);
    if (lastTen.length === 0) return; // Safety check

    const correctCount = lastTen.filter(r => r.correct).length;
    const ratio = correctCount / lastTen.length;

    const avgExplorations = lastTen.reduce((sum, r) => sum + r.explorations, 0) / lastTen.length;

    if (ratio < this.STRUGGLE_THRESHOLD || avgExplorations > 3) {
      this.data.scaffoldLevel = this.LEVELS.HEAVY;
    } else if (ratio < this.LEARNING_THRESHOLD) {
      this.data.scaffoldLevel = this.LEVELS.MODERATE;
    } else if (ratio < this.PROGRESSING_THRESHOLD) {
      this.data.scaffoldLevel = this.LEVELS.LIGHT;
    } else {
      this.data.scaffoldLevel = this.LEVELS.CHALLENGE;
    }
  }

  /**
   * Get current scaffolding advice for a topic
   */
  getScaffoldingAdvice(topicPrefix) {
    const level = this.data.scaffoldLevel;
    const topic = this.data.topicPerformance[topicPrefix];
    const trend = this.getRecentTrend();

    return {
      level,
      trend,
      topicPerformance: (topic && topic.attempts > 0) ? (topic.correct / topic.attempts) : null,
      consecutiveWrong: topic?.consecutiveWrong || 0,
      consecutiveCorrect: topic?.consecutiveCorrect || 0,
      shouldShowExtraHint: level === this.LEVELS.HEAVY,
      canSkipWarmups: level === this.LEVELS.LIGHT || level === this.LEVELS.CHALLENGE,
      suggestReview: this.data.reviewQueue.length > 0,
      reviewCount: this.data.reviewQueue.length
    };
  }

  /**
   * Get Ms. Luminara's adaptive message based on scaffolding level
   */
  getAdaptiveMessage(context) {
    const { level, trend, consecutiveWrong, consecutiveCorrect } = context;

    // Heavy scaffolding - struggling
    if (level === this.LEVELS.HEAVY) {
      if (consecutiveWrong >= 3) {
        return {
          type: 'encouragement',
          message: "Let's slow down together. Take your time with this one — I'll guide you through it step by step.",
          showHint: true
        };
      }
      if (trend === 'struggling') {
        return {
          type: 'support',
          message: "This topic takes time to sink in. Focus on the warmups — they're building exactly what you need.",
          showHint: true
        };
      }
      return {
        type: 'patience',
        message: "Don't rush. Every exploration teaches you something. Let's work through this methodically.",
        showHint: false
      };
    }

    // Moderate scaffolding - learning
    if (level === this.LEVELS.MODERATE) {
      if (trend === 'improving') {
        return {
          type: 'progress',
          message: "You're finding your rhythm. Keep building on what you've learned.",
          showHint: false
        };
      }
      return {
        type: 'steady',
        message: "Take your time with the warmups. They're preparing you for something beautiful.",
        showHint: false
      };
    }

    // Light scaffolding - progressing
    if (level === this.LEVELS.LIGHT) {
      if (consecutiveCorrect >= 3) {
        return {
          type: 'confidence',
          message: "You're getting comfortable here. Feel free to skip warmups if you're ready.",
          showHint: false,
          allowSkip: true
        };
      }
      return {
        type: 'momentum',
        message: "Good momentum. Trust your instincts — you've built a solid foundation.",
        showHint: false,
        allowSkip: true
      };
    }

    // Challenge mode - mastering
    if (level === this.LEVELS.CHALLENGE) {
      if (consecutiveCorrect >= 5) {
        return {
          type: 'mastery',
          message: "Impressive. You've earned the right to be challenged. Let's see how deep your understanding goes.",
          showHint: false,
          allowSkip: true,
          showChallenge: true
        };
      }
      return {
        type: 'advanced',
        message: "You're operating at a high level now. Push yourself — the real learning is in the edges.",
        showHint: false,
        allowSkip: true
      };
    }

    return { type: 'neutral', message: null, showHint: false };
  }

  /**
   * Get extra hint content for heavy scaffolding
   */
  getExtraHint(question) {
    // Return structural hints that guide thinking without giving away the answer
    const hints = [
      "Think about the underlying mechanism — what has to happen physically for this to work?",
      "Consider the structure involved. Form follows function.",
      "What would happen if this didn't work? That might point to the answer.",
      "Connect this to what you learned in the warmups.",
      "Eliminate options that violate basic principles you know to be true."
    ];

    return hints[Math.floor(Math.random() * hints.length)];
  }

  /**
   * Get questions that need review (spaced repetition)
   */
  getReviewQuestions() {
    return this.data.reviewQueue;
  }

  /**
   * Mark a question as successfully reviewed
   */
  markReviewed(questionId) {
    this.data.reviewQueue = this.data.reviewQueue.filter(id => id !== questionId);
    this.save();
  }

  /**
   * Get session struggle/success ratio
   */
  getSessionStats() {
    const total = this.data.sessionStruggleCount + this.data.sessionSuccessCount;
    return {
      struggles: this.data.sessionStruggleCount,
      successes: this.data.sessionSuccessCount,
      total,
      ratio: total > 0 ? this.data.sessionSuccessCount / total : 0
    };
  }

  /**
   * Reset session counters (call at session start)
   */
  resetSessionCounters() {
    this.data.sessionStruggleCount = 0;
    this.data.sessionSuccessCount = 0;
    this.save();
  }

  /**
   * Get overall mastery map for all topics
   */
  getMasteryMap() {
    const map = {};
    for (const [topic, data] of Object.entries(this.data.topicPerformance)) {
      if (data.attempts >= 3) {
        map[topic] = {
          mastery: Math.round((data.correct / data.attempts) * 100),
          attempts: data.attempts,
          level: this.getMasteryLevel(data.correct / data.attempts)
        };
      }
    }
    return map;
  }

  getMasteryLevel(ratio) {
    if (ratio >= 0.9) return 'mastered';
    if (ratio >= 0.7) return 'proficient';
    if (ratio >= 0.5) return 'developing';
    return 'learning';
  }
}

// Export singleton (instantiated after persistence loads)
let scaffolding = null;
