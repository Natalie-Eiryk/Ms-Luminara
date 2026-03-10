/**
 * Ms. Luminara Quiz - Scaffold Remediation System
 *
 * When a user answers incorrectly:
 * 1. Roll D20 for damage (CON reduces damage)
 * 2. Apply damage to HP (100 max)
 * 3. Present 3 mandatory scaffold questions from vocabulary bank
 * 4. Heal 5 HP per correct scaffold answer
 */

class ScaffoldRemediationEngine {
  constructor(persistenceManager, d20System) {
    this.persistence = persistenceManager;
    this.d20System = d20System;
    this.STORAGE_KEY = 'ms_luminara_scaffold_hp';
    this.data = this.loadData();

    // HP Configuration
    this.MAX_HP = 100;
    this.HEAL_PER_SCAFFOLD = 5;

    // Damage table based on D20 roll
    this.DAMAGE_TABLE = {
      fumble: 0,      // Natural 1: no damage (lucky!)
      low: 5,         // 2-7: minor damage
      medium: 10,     // 8-14: standard damage
      high: 15,       // 15-19: heavy damage
      critical: 25    // Natural 20: critical hit
    };

    // Active scaffold session
    this.activeSession = null;

    // Vocabulary bank cache
    this.vocabBankCache = {};

    // Vocabulary bank mapping by category
    this.VOCAB_BANK_MAP = {
      '000': { folder: '000-foundations', file: '000.5-vocabulary.json' },
      '100': { folder: '100-brain', file: '100.5-vocabulary.json' },
      '200': { folder: '200-nerves', file: '200.6-vocabulary.json' },
      '400': { folder: '400-tissues', file: '400.4-vocabulary.json' },
      '500': { folder: '500-ans', file: '500.3-vocabulary.json' },
      '600': { folder: '600-special-senses', file: '600.4-vocabulary.json' },
      '700': { folder: '700-endocrine', file: '700.4-vocabulary.json' }
    };
  }

  loadData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.mergeWithDefaults(parsed);
      }
    } catch (e) {
      console.warn('Failed to load scaffold HP data:', e);
    }
    return this.getDefaultData();
  }

  getDefaultData() {
    return {
      currentHP: this.MAX_HP || 100,
      maxHP: this.MAX_HP || 100,
      totalDamageTaken: 0,
      totalHealed: 0,
      knockouts: 0,
      scaffoldsCompleted: 0,
      scaffoldsCorrectFirstTry: 0,
      xpPenaltyActive: false
    };
  }

  mergeWithDefaults(saved) {
    const defaults = this.getDefaultData();
    return { ...defaults, ...saved };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save scaffold HP data:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // HP MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  getHP() {
    return {
      current: this.data.currentHP,
      max: this.data.maxHP,
      percent: Math.round((this.data.currentHP / this.data.maxHP) * 100),
      knockouts: this.data.knockouts,
      xpPenaltyActive: this.data.xpPenaltyActive
    };
  }

  /**
   * Calculate damage based on D20 roll (REVERSED: high roll = less damage)
   * Natural 20 = no damage (lucky!), Natural 1 = critical hit (ouch!)
   * CON modifier reduces damage (min 1)
   */
  calculateDamage() {
    const roll = this.d20System.rollD20();
    let baseDamage;
    let damageType;

    // REVERSED: Higher rolls = better outcome (less damage)
    if (roll.isCriticalSuccess) {
      // Natural 20 = lucky, no damage!
      baseDamage = this.DAMAGE_TABLE.fumble;
      damageType = 'fumble';
    } else if (roll.roll >= 15) {
      // 15-19: minimal damage
      baseDamage = this.DAMAGE_TABLE.low;
      damageType = 'low';
    } else if (roll.roll >= 8) {
      // 8-14: standard damage
      baseDamage = this.DAMAGE_TABLE.medium;
      damageType = 'medium';
    } else if (roll.roll >= 2) {
      // 2-7: heavy damage
      baseDamage = this.DAMAGE_TABLE.high;
      damageType = 'high';
    } else {
      // Natural 1 = critical hit, max damage!
      baseDamage = this.DAMAGE_TABLE.critical;
      damageType = 'critical';
    }

    // CON modifier reduces damage
    const conMod = this.d20System.getStatModifier('constitution');
    const finalDamage = baseDamage === 0 ? 0 : Math.max(1, baseDamage - conMod);

    return {
      roll,
      baseDamage,
      conMod,
      finalDamage,
      damageType,
      isFumble: roll.isCriticalSuccess,  // Nat 20 = fumble (no damage)
      isCritical: roll.isCriticalFailure  // Nat 1 = critical hit (max damage)
    };
  }

  /**
   * Apply damage to HP
   */
  applyDamage(damage) {
    const previousHP = this.data.currentHP;
    this.data.currentHP = Math.max(0, this.data.currentHP - damage);
    this.data.totalDamageTaken += damage;

    const isKnockout = this.data.currentHP === 0;

    if (isKnockout) {
      this.handleKnockout();
    }

    this.save();

    return {
      previousHP,
      currentHP: this.data.currentHP,
      damageTaken: damage,
      isKnockout
    };
  }

  /**
   * Handle knockout (HP reaches 0)
   */
  handleKnockout() {
    this.data.knockouts++;
    this.data.currentHP = this.data.maxHP; // Restore to full
    this.data.xpPenaltyActive = true; // 50% XP penalty for session
    this.save();
  }

  /**
   * Heal HP (from correct scaffold answers)
   */
  heal(amount) {
    const previousHP = this.data.currentHP;
    this.data.currentHP = Math.min(this.data.maxHP, this.data.currentHP + amount);
    this.data.totalHealed += (this.data.currentHP - previousHP);
    this.save();

    return {
      previousHP,
      currentHP: this.data.currentHP,
      healed: this.data.currentHP - previousHP
    };
  }

  /**
   * Clear XP penalty (call at session end or after time)
   */
  clearXPPenalty() {
    this.data.xpPenaltyActive = false;
    this.save();
  }

  /**
   * Get XP multiplier (0.5 if penalty active, 1.0 otherwise)
   */
  getXPMultiplier() {
    return this.data.xpPenaltyActive ? 0.5 : 1.0;
  }

  // ═══════════════════════════════════════════════════════════════
  // VOCABULARY BANK LOADING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Load vocabulary bank for a category
   */
  async loadVocabularyBank(categoryPrefix) {
    // Check cache first
    if (this.vocabBankCache[categoryPrefix]) {
      return this.vocabBankCache[categoryPrefix];
    }

    const mapping = this.VOCAB_BANK_MAP[categoryPrefix];
    if (!mapping) {
      console.warn(`No vocabulary bank for category ${categoryPrefix}`);
      return null;
    }

    try {
      const response = await fetch(`${mapping.folder}/${mapping.file}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const bank = await response.json();
      this.vocabBankCache[categoryPrefix] = bank;
      return bank;
    } catch (e) {
      console.error(`Failed to load vocabulary bank for ${categoryPrefix}:`, e);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SCAFFOLD QUESTION SELECTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Select 3 scaffold questions for a wrong answer
   */
  async selectScaffoldQuestions(wrongQuestion) {
    // Extract category prefix from question ID (e.g., "100.1.05" -> "100")
    const categoryPrefix = wrongQuestion.id.split('.')[0];

    const vocabBank = await this.loadVocabularyBank(categoryPrefix);
    if (!vocabBank || !vocabBank.questions || vocabBank.questions.length < 3) {
      console.warn('Not enough vocabulary questions for scaffolding');
      return null;
    }

    // Get the correct answer text for relevance matching
    const correctAnswerText = wrongQuestion.options[wrongQuestion.answer].toLowerCase();
    const questionText = wrongQuestion.q.toLowerCase();

    // Score questions by relevance
    const scoredQuestions = vocabBank.questions
      .filter(q => q.id !== wrongQuestion.id) // Don't use the same question
      .map(q => {
        let score = Math.random() * 10; // Base randomness

        // Boost score if question relates to correct answer
        const qText = q.q.toLowerCase();
        const qOptions = q.options.map(o => o.toLowerCase()).join(' ');

        // Check for keyword overlap with correct answer
        const correctWords = correctAnswerText.split(/\s+/);
        for (const word of correctWords) {
          if (word.length > 3 && (qText.includes(word) || qOptions.includes(word))) {
            score += 5;
          }
        }

        // Check for overlap with original question
        const questionWords = questionText.split(/\s+/);
        for (const word of questionWords) {
          if (word.length > 4 && qText.includes(word)) {
            score += 3;
          }
        }

        return { question: q, score };
      })
      .sort((a, b) => b.score - a.score);

    // Select top 3 with some variety
    const selected = [];
    const usedIndices = new Set();

    // First: highest relevance
    if (scoredQuestions.length > 0) {
      selected.push(scoredQuestions[0].question);
      usedIndices.add(0);
    }

    // Second: from top 5
    for (let i = 1; i < Math.min(5, scoredQuestions.length); i++) {
      if (!usedIndices.has(i)) {
        selected.push(scoredQuestions[i].question);
        usedIndices.add(i);
        break;
      }
    }

    // Third: from top 10 (or random if not enough)
    for (let i = 2; i < Math.min(10, scoredQuestions.length); i++) {
      if (!usedIndices.has(i) && selected.length < 3) {
        selected.push(scoredQuestions[i].question);
        usedIndices.add(i);
        break;
      }
    }

    // Fill remaining slots randomly if needed
    while (selected.length < 3 && scoredQuestions.length > selected.length) {
      const idx = Math.floor(Math.random() * scoredQuestions.length);
      if (!usedIndices.has(idx)) {
        selected.push(scoredQuestions[idx].question);
        usedIndices.add(idx);
      }
    }

    return selected;
  }

  // ═══════════════════════════════════════════════════════════════
  // SCAFFOLD SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start a scaffold session after wrong answer
   */
  async startSession(wrongQuestion, damageResult) {
    const scaffoldQuestions = await this.selectScaffoldQuestions(wrongQuestion);

    if (!scaffoldQuestions || scaffoldQuestions.length < 3) {
      console.warn('Could not select scaffold questions');
      return null;
    }

    this.activeSession = {
      triggerQuestion: wrongQuestion,
      triggerQuestionId: wrongQuestion.id,
      scaffoldQuestions,
      currentIndex: 0,
      damageResult,
      startTime: Date.now(),
      results: [], // Track each scaffold result
      completed: false
    };

    return this.activeSession;
  }

  /**
   * Get current scaffold question
   */
  getCurrentScaffold() {
    if (!this.activeSession) return null;
    return this.activeSession.scaffoldQuestions[this.activeSession.currentIndex];
  }

  /**
   * Get scaffold session state
   */
  getSessionState() {
    if (!this.activeSession) return null;
    return {
      currentIndex: this.activeSession.currentIndex,
      total: this.activeSession.scaffoldQuestions.length,
      currentQuestion: this.getCurrentScaffold(),
      damageResult: this.activeSession.damageResult,
      results: this.activeSession.results,
      completed: this.activeSession.completed
    };
  }

  /**
   * Record scaffold answer result
   */
  recordScaffoldResult(wasCorrectFirstTry) {
    if (!this.activeSession) return null;

    this.activeSession.results.push({
      questionId: this.getCurrentScaffold().id,
      wasCorrectFirstTry,
      timestamp: Date.now()
    });

    // Heal on correct
    let healResult = null;
    if (wasCorrectFirstTry) {
      healResult = this.heal(this.HEAL_PER_SCAFFOLD);
      this.data.scaffoldsCorrectFirstTry++;
    }

    this.data.scaffoldsCompleted++;
    this.save();

    return {
      wasCorrectFirstTry,
      healResult,
      scaffoldsRemaining: 3 - this.activeSession.results.length
    };
  }

  /**
   * Advance to next scaffold question
   */
  nextScaffold() {
    if (!this.activeSession) return null;

    this.activeSession.currentIndex++;

    if (this.activeSession.currentIndex >= 3) {
      return this.completeSession();
    }

    return {
      currentIndex: this.activeSession.currentIndex,
      currentQuestion: this.getCurrentScaffold(),
      completed: false
    };
  }

  /**
   * Complete scaffold session
   */
  completeSession() {
    if (!this.activeSession) return null;

    this.activeSession.completed = true;
    const duration = Date.now() - this.activeSession.startTime;
    const correctCount = this.activeSession.results.filter(r => r.wasCorrectFirstTry).length;

    const summary = {
      completed: true,
      triggerQuestionId: this.activeSession.triggerQuestionId,
      duration,
      correctCount,
      totalHealed: correctCount * this.HEAL_PER_SCAFFOLD,
      currentHP: this.data.currentHP
    };

    // Clear active session
    this.activeSession = null;

    return summary;
  }

  /**
   * Check if scaffold session is active
   */
  isSessionActive() {
    return this.activeSession !== null && !this.activeSession.completed;
  }

  /**
   * Cancel/abort scaffold session (emergency only)
   */
  abortSession() {
    this.activeSession = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // MS. LUMINARA MESSAGES
  // ═══════════════════════════════════════════════════════════════

  getScaffoldIntroMessage(scaffoldIndex) {
    const intros = [
      // First scaffold
      [
        "Let's step back and build a foundation together.",
        "Before we continue, let me strengthen something fundamental.",
        "This will help the pieces click into place."
      ],
      // Second scaffold
      [
        "Good. Now let's add another piece to the puzzle.",
        "One more step toward clarity.",
        "You're building understanding. Keep going."
      ],
      // Third scaffold
      [
        "Almost there. This should illuminate everything.",
        "Final piece. After this, it will make sense.",
        "One more, and the whole picture becomes clear."
      ]
    ];

    const messages = intros[Math.min(scaffoldIndex, 2)];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  getDamageMessage(damageResult) {
    if (damageResult.isFumble) {
      // Natural 20 - lucky!
      return "Natural 20! The dice show mercy — no damage taken.";
    }
    if (damageResult.isCritical) {
      // Natural 1 - ouch!
      return "Natural 1! Critical hit... but knowledge heals all wounds.";
    }
    if (damageResult.damageType === 'low') {
      return "High roll! Just a scratch. Let's strengthen that foundation.";
    }
    if (damageResult.damageType === 'medium') {
      return "A solid hit, but nothing we can't recover from.";
    }
    return "Low roll — heavy damage! These scaffolds will help you heal.";
  }

  getHealMessage(healResult) {
    if (healResult.healed > 0) {
      return `+${healResult.healed} HP restored through understanding.`;
    }
    return "HP already at maximum.";
  }

  getKnockoutMessage() {
    const messages = [
      "You've fallen, but you rise again. Take a moment to rest.",
      "Knocked down, not out. Your HP is restored, but pace yourself.",
      "Even the best scholars stumble. Rise refreshed, but XP gains are halved this session."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // ═══════════════════════════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════════════════════════

  getStats() {
    return {
      hp: this.getHP(),
      totalDamageTaken: this.data.totalDamageTaken,
      totalHealed: this.data.totalHealed,
      scaffoldsCompleted: this.data.scaffoldsCompleted,
      scaffoldsCorrectFirstTry: this.data.scaffoldsCorrectFirstTry,
      scaffoldAccuracy: this.data.scaffoldsCompleted > 0
        ? Math.round((this.data.scaffoldsCorrectFirstTry / this.data.scaffoldsCompleted) * 100)
        : 0,
      knockouts: this.data.knockouts
    };
  }

  /**
   * Reset HP to full (for new session or testing)
   */
  resetHP() {
    this.data.currentHP = this.data.maxHP;
    this.data.xpPenaltyActive = false;
    this.save();
  }
}

// Export singleton (will be initialized after persistence and d20System)
let scaffoldRemediation = null;
