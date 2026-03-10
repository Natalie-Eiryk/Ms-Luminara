/**
 * Ms. Luminara Quiz - D20 RPG System
 *
 * Full tabletop RPG mechanics:
 * - Dice rolling with animations
 * - Character stats (INT, WIS, CON, CHA)
 * - Critical success/failure
 * - Skill checks for hints
 * - Saving throws
 * - Advantage/disadvantage
 * - Encounter-style progression
 */

class D20System {
  constructor(persistenceManager) {
    this.persistence = persistenceManager;
    this.STORAGE_KEY = 'ms_luminara_d20';
    this.data = this.loadD20Data();
    this.pendingRolls = [];
    this.lastRoll = null;
  }

  loadD20Data() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load D20 data:', e);
    }
    return this.getDefaultData();
  }

  getDefaultData() {
    return {
      // Character stats (start at 10, can grow to 20)
      stats: {
        intelligence: 10,  // Derived from overall accuracy
        wisdom: 10,        // Derived from first-try success rate
        constitution: 10,  // Derived from session consistency
        charisma: 10       // Derived from streak performance
      },
      // Stat experience (tracks progress toward next point)
      statXP: {
        intelligence: 0,
        wisdom: 0,
        constitution: 0,
        charisma: 0
      },
      // Roll history
      rollHistory: [],
      criticalHistory: {
        nat20s: 0,
        nat1s: 0
      },
      // Saved streaks
      savedStreaks: 0,
      // Insight points (currency for skill checks)
      insightPoints: 5,
      // Title progression
      title: 'Novice Scholar',
      // Total encounters completed
      encountersCompleted: 0
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save D20 data:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DICE ROLLING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Roll a d20 with optional advantage/disadvantage
   */
  rollD20(advantage = false, disadvantage = false) {
    const roll1 = Math.floor(Math.random() * 20) + 1;
    const roll2 = Math.floor(Math.random() * 20) + 1;

    let finalRoll, rollType;

    if (advantage && !disadvantage) {
      finalRoll = Math.max(roll1, roll2);
      rollType = 'advantage';
    } else if (disadvantage && !advantage) {
      finalRoll = Math.min(roll1, roll2);
      rollType = 'disadvantage';
    } else {
      finalRoll = roll1;
      rollType = 'normal';
    }

    const result = {
      roll: finalRoll,
      roll1,
      roll2,
      type: rollType,
      isCriticalSuccess: finalRoll === 20,
      isCriticalFailure: finalRoll === 1,
      timestamp: Date.now()
    };

    // Track critical history
    if (result.isCriticalSuccess) this.data.criticalHistory.nat20s++;
    if (result.isCriticalFailure) this.data.criticalHistory.nat1s++;

    // Store in history (keep last 50)
    this.data.rollHistory.push(result);
    if (this.data.rollHistory.length > 50) {
      this.data.rollHistory.shift();
    }

    this.lastRoll = result;
    this.save();

    return result;
  }

  /**
   * Roll with modifier (stat bonus)
   */
  rollWithModifier(statName, advantage = false, disadvantage = false) {
    const roll = this.rollD20(advantage, disadvantage);
    const modifier = this.getStatModifier(statName);

    return {
      ...roll,
      modifier,
      total: roll.roll + modifier,
      stat: statName
    };
  }

  /**
   * Get stat modifier (D&D style: (stat - 10) / 2)
   */
  getStatModifier(statName) {
    const stat = this.data.stats[statName] || 10;
    return Math.floor((stat - 10) / 2);
  }

  // ═══════════════════════════════════════════════════════════════
  // CHARACTER STATS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Update stats based on performance
   */
  updateStats(performance) {
    const { wasCorrect, wasFirstTry, explorationCount, streakLength, sessionMinutes } = performance;

    // Intelligence: Overall learning (correct answers)
    if (wasCorrect) {
      this.data.statXP.intelligence += wasFirstTry ? 15 : 8;
    }

    // Wisdom: Intuition/first-try success
    if (wasFirstTry && wasCorrect) {
      this.data.statXP.wisdom += 20;
    } else if (explorationCount > 2) {
      this.data.statXP.wisdom += 3; // Learning through exploration
    }

    // Constitution: Endurance/consistency
    if (sessionMinutes) {
      this.data.statXP.constitution += Math.min(sessionMinutes, 30);
    }

    // Charisma: Streak performance (natural talent display)
    if (streakLength >= 3) {
      this.data.statXP.charisma += streakLength * 2;
    }

    // Level up stats (100 XP per stat point, max 20)
    for (const stat of ['intelligence', 'wisdom', 'constitution', 'charisma']) {
      while (this.data.statXP[stat] >= 100 && this.data.stats[stat] < 20) {
        this.data.statXP[stat] -= 100;
        this.data.stats[stat]++;
      }
    }

    this.updateTitle();
    this.save();

    return this.getCharacterSheet();
  }

  /**
   * Get full character sheet
   */
  getCharacterSheet() {
    const stats = this.data.stats;
    // Calculate level based on average stat above baseline (10), minimum level 1
    const avgStat = (stats.intelligence + stats.wisdom + stats.constitution + stats.charisma) / 4;
    const totalLevel = Math.max(1, Math.floor(avgStat - 9));

    return {
      title: this.data.title,
      level: Math.max(1, totalLevel),
      stats: {
        intelligence: {
          value: stats.intelligence,
          modifier: this.getStatModifier('intelligence'),
          xpToNext: 100 - this.data.statXP.intelligence,
          xpProgress: this.data.statXP.intelligence
        },
        wisdom: {
          value: stats.wisdom,
          modifier: this.getStatModifier('wisdom'),
          xpToNext: 100 - this.data.statXP.wisdom,
          xpProgress: this.data.statXP.wisdom
        },
        constitution: {
          value: stats.constitution,
          modifier: this.getStatModifier('constitution'),
          xpToNext: 100 - this.data.statXP.constitution,
          xpProgress: this.data.statXP.constitution
        },
        charisma: {
          value: stats.charisma,
          modifier: this.getStatModifier('charisma'),
          xpToNext: 100 - this.data.statXP.charisma,
          xpProgress: this.data.statXP.charisma
        }
      },
      criticals: this.data.criticalHistory,
      insightPoints: this.data.insightPoints,
      savedStreaks: this.data.savedStreaks,
      encountersCompleted: this.data.encountersCompleted
    };
  }

  /**
   * Update character title based on stats
   */
  updateTitle() {
    const avg = (
      this.data.stats.intelligence +
      this.data.stats.wisdom +
      this.data.stats.constitution +
      this.data.stats.charisma
    ) / 4;

    if (avg >= 18) this.data.title = 'Archmage of Anatomy';
    else if (avg >= 16) this.data.title = 'Master Scholar';
    else if (avg >= 14) this.data.title = 'Learned Sage';
    else if (avg >= 12) this.data.title = 'Dedicated Student';
    else if (avg >= 11) this.data.title = 'Aspiring Scholar';
    else this.data.title = 'Novice Scholar';
  }

  // ═══════════════════════════════════════════════════════════════
  // SKILL CHECKS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Perform an insight check for a hint
   * @param difficulty - 'easy' (DC 8), 'medium' (DC 12), 'hard' (DC 15), 'legendary' (DC 18)
   * @returns {object} Result with success, roll info, and hint quality
   */
  insightCheck(difficulty = 'medium') {
    const dcMap = { easy: 8, medium: 12, hard: 15, legendary: 18 };
    const dc = dcMap[difficulty] || 12;

    // Costs 1 insight point
    if (this.data.insightPoints < 1) {
      return { success: false, reason: 'no_points', insightPoints: 0 };
    }

    this.data.insightPoints--;

    const roll = this.rollWithModifier('wisdom');
    const success = roll.total >= dc;

    // Determine hint quality
    let hintQuality;
    if (roll.isCriticalSuccess) {
      hintQuality = 'perfect'; // Full mechanism hint
    } else if (roll.total >= dc + 5) {
      hintQuality = 'excellent'; // Strong directional hint
    } else if (success) {
      hintQuality = 'good'; // Basic helpful hint
    } else if (roll.isCriticalFailure) {
      hintQuality = 'misleading'; // Intentionally vague/unhelpful
    } else {
      hintQuality = 'vague'; // Minimal help
    }

    this.save();

    return {
      success,
      roll,
      dc,
      hintQuality,
      insightPoints: this.data.insightPoints
    };
  }

  /**
   * Knowledge check - roll to determine if you've "seen this before"
   */
  knowledgeCheck(topicDifficulty) {
    const roll = this.rollWithModifier('intelligence');
    const dc = 10 + (topicDifficulty || 0);

    return {
      success: roll.total >= dc,
      roll,
      dc,
      grantsAdvantage: roll.total >= dc + 5 || roll.isCriticalSuccess
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SAVING THROWS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Saving throw to protect streak
   * DC increases with streak length (higher streak = harder to save)
   */
  streakSavingThrow(currentStreak) {
    // Can only attempt if you have insight points
    if (this.data.insightPoints < 2) {
      return { canAttempt: false, reason: 'insufficient_points' };
    }

    // DC scales: 10 base + 1 per 2 streak points
    const dc = 10 + Math.floor(currentStreak / 2);

    this.data.insightPoints -= 2;

    const roll = this.rollWithModifier('charisma');
    const success = roll.total >= dc || roll.isCriticalSuccess;

    if (success) {
      this.data.savedStreaks++;
    }

    this.save();

    return {
      canAttempt: true,
      success,
      roll,
      dc,
      streakPreserved: success,
      insightPoints: this.data.insightPoints
    };
  }

  /**
   * Constitution save for session endurance bonus
   */
  enduranceSave(sessionMinutes) {
    const dc = 10 + Math.floor(sessionMinutes / 10);
    const roll = this.rollWithModifier('constitution');

    return {
      success: roll.total >= dc,
      roll,
      dc,
      bonusXP: roll.total >= dc ? Math.floor(sessionMinutes * 2) : 0
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // ADVANTAGE/DISADVANTAGE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Determine if player has advantage on a topic
   */
  hasAdvantage(topicPrefix, isRevengeQuestion) {
    // Revenge questions that were previously wrong give advantage (redemption arc)
    if (isRevengeQuestion) {
      return { hasAdvantage: true, reason: 'revenge_redemption' };
    }

    // Get topic mastery from scaffolding
    if (typeof scaffolding !== 'undefined') {
      const performance = scaffolding.getTopicPerformance(topicPrefix);
      if (performance && performance > 0.8) {
        return { hasAdvantage: true, reason: 'topic_mastery' };
      }
    }

    // Check recent streak
    const player = this.persistence.getPlayer();
    if (player.currentStreak >= 5) {
      return { hasAdvantage: true, reason: 'hot_streak' };
    }

    return { hasAdvantage: false };
  }

  /**
   * Determine if player has disadvantage
   */
  hasDisadvantage(topicPrefix, isRevengeQuestion) {
    // Revenge questions grant disadvantage (but also bonus XP)
    if (isRevengeQuestion) {
      return { hasDisadvantage: true, reason: 'revenge_question' };
    }

    // Struggling on topic
    if (typeof scaffolding !== 'undefined') {
      const advice = scaffolding.getScaffoldingAdvice(topicPrefix);
      if (advice.consecutiveWrong >= 3) {
        return { hasDisadvantage: true, reason: 'struggling' };
      }
    }

    return { hasDisadvantage: false };
  }

  // ═══════════════════════════════════════════════════════════════
  // ENCOUNTER SYSTEM
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create an encounter for a question
   */
  createEncounter(question, topicPrefix) {
    const advantageInfo = this.hasAdvantage(topicPrefix, false);
    const disadvantageInfo = this.hasDisadvantage(topicPrefix,
      this.persistence.wasQuestionPreviouslyWrong(question.id));

    // Question "HP" based on complexity (warmups count as damage already dealt)
    const hasWarmups = question.prereqs && question.prereqs.length >= 2;
    const hp = hasWarmups ? 3 : 1;

    // Determine encounter type
    let encounterType = 'standard';
    if (question.id && question.id.includes('.10')) {
      encounterType = 'boss'; // Every 10th question is a "boss"
    } else if (Math.random() < 0.1) {
      encounterType = 'elite'; // 10% chance of elite
    }

    return {
      questionId: question.id,
      encounterType,
      hp,
      maxHp: hp,
      advantage: advantageInfo.hasAdvantage,
      advantageReason: advantageInfo.reason,
      disadvantage: disadvantageInfo.hasDisadvantage,
      disadvantageReason: disadvantageInfo.reason,
      rewards: this.calculateEncounterRewards(encounterType)
    };
  }

  /**
   * Calculate rewards for encounter type
   */
  calculateEncounterRewards(type) {
    switch (type) {
      case 'boss':
        return { xpMultiplier: 2.0, insightPoints: 3, title: 'Boss Encounter' };
      case 'elite':
        return { xpMultiplier: 1.5, insightPoints: 1, title: 'Elite Encounter' };
      default:
        return { xpMultiplier: 1.0, insightPoints: 0, title: 'Encounter' };
    }
  }

  /**
   * Complete an encounter
   */
  completeEncounter(encounter, wasSuccess) {
    if (wasSuccess) {
      this.data.encountersCompleted++;
      this.data.insightPoints += encounter.rewards.insightPoints;
      this.save();
    }

    return {
      completed: wasSuccess,
      insightPointsGained: wasSuccess ? encounter.rewards.insightPoints : 0,
      totalEncounters: this.data.encountersCompleted
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CRITICAL SUCCESS/FAILURE EFFECTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get critical success effects
   */
  getCriticalSuccessEffects() {
    return {
      xpMultiplier: 3.0,
      skipWarmups: true,
      bonusInsight: 2,
      message: this.getCritSuccessMessage()
    };
  }

  getCritSuccessMessage() {
    const messages = [
      "NATURAL 20! The knowledge flows through you like lightning!",
      "CRITICAL SUCCESS! Ms. Luminara is thoroughly impressed...",
      "NAT 20! You've transcended mere understanding!",
      "PERFECT ROLL! The answer was always within you.",
      "CRITICAL HIT! Your neurons fire in perfect synchrony!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get critical failure effects (fun, not punishing)
   */
  getCriticalFailureEffects() {
    return {
      xpMultiplier: 0.5,
      funMessage: this.getCritFailMessage(),
      consolationPrize: 1 // Still get 1 insight point for entertainment
    };
  }

  getCritFailMessage() {
    const messages = [
      "NATURAL 1! Your brain temporarily forgot how brains work.",
      "FUMBLE! You confidently pointed at the wrong neuron.",
      "NAT 1! Ms. Luminara stifles a laugh... adorably.",
      "CRITICAL MISS! The answer was right there, waving at you.",
      "OOPS! Your dendrites got tangled. It happens to the best of us."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // ═══════════════════════════════════════════════════════════════
  // INSIGHT POINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Award insight points
   */
  awardInsightPoints(amount) {
    this.data.insightPoints += amount;
    this.save();
    return this.data.insightPoints;
  }

  /**
   * Get current insight points
   */
  getInsightPoints() {
    return this.data.insightPoints;
  }

  /**
   * Check if can afford action
   */
  canAfford(cost) {
    return this.data.insightPoints >= cost;
  }
}

// Export singleton
let d20System = null;
