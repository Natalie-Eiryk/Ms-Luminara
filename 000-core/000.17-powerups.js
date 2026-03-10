/**
 * Ms. Luminara Quiz - Power-ups System
 * Silly power-ups unlocked through play for "The Luminara Gauntlet"
 */

// ============================================================================
// POWER-UP DEFINITIONS
// ============================================================================

const POWER_UPS = {
  // ═══════════════════════════════════════════════════════════════
  // OFFENSIVE POWER-UPS
  // ═══════════════════════════════════════════════════════════════

  CAFFEINE_RUSH: {
    id: 'caffeine_rush',
    name: 'Caffeine Rush',
    icon: '☕',
    description: '2x damage for the next 3 questions. Side effects may include jitteriness.',
    rarity: 'common',
    type: 'damage',
    effect: {
      damageMultiplier: 2,
      duration: 3, // questions
      sideEffect: 'slight_screen_shake'
    },
    unlockCondition: { type: 'questions_answered', count: 25 },
    cost: 50, // arcade tokens
    cooldown: 0
  },

  RED_PEN_OF_FURY: {
    id: 'red_pen_of_fury',
    name: 'Red Pen of Fury',
    icon: '🖊️',
    description: 'Channel teacher energy. Next correct answer deals TRIPLE damage!',
    rarity: 'uncommon',
    type: 'damage',
    effect: {
      damageMultiplier: 3,
      duration: 1,
      visualEffect: 'red_slashes'
    },
    unlockCondition: { type: 'streak', count: 10 },
    cost: 75,
    cooldown: 0
  },

  PANIC_STUDY: {
    id: 'panic_study',
    name: 'Panic Study',
    icon: '😰',
    description: 'When HP < 25%, deal 3x damage. The fear is real, and so is your power.',
    rarity: 'rare',
    type: 'passive',
    effect: {
      damageMultiplier: 3,
      condition: 'hp_below_25'
    },
    unlockCondition: { type: 'survive_low_hp', count: 3 },
    cost: 150,
    cooldown: 0
  },

  // ═══════════════════════════════════════════════════════════════
  // DEFENSIVE POWER-UPS
  // ═══════════════════════════════════════════════════════════════

  RUBBER_DUCK_DEBUGGING: {
    id: 'rubber_duck_debugging',
    name: 'Rubber Duck Debugging',
    icon: '🦆',
    description: 'Explain it to the duck. Eliminate 2 wrong answers for the next question.',
    rarity: 'common',
    type: 'hint',
    effect: {
      eliminateAnswers: 2,
      duration: 1
    },
    unlockCondition: { type: 'wrong_answers', count: 10 },
    cost: 40,
    cooldown: 0
  },

  IMPOSTOR_SYNDROME: {
    id: 'impostor_syndrome',
    name: 'Impostor Syndrome',
    icon: '🎭',
    description: 'The boss thinks you\'re supposed to be here. They skip their next turn.',
    rarity: 'uncommon',
    type: 'control',
    effect: {
      skipBossTurn: 1
    },
    unlockCondition: { type: 'boss_defeated', count: 1 },
    cost: 100,
    cooldown: 0
  },

  PROCRASTINATION_SHIELD: {
    id: 'procrastination_shield',
    name: 'Procrastination Shield',
    icon: '🛡️',
    description: '"I\'ll take damage later." Block the next 2 boss attacks completely.',
    rarity: 'rare',
    type: 'shield',
    effect: {
      blockAttacks: 2
    },
    unlockCondition: { type: 'damage_taken', count: 500 },
    cost: 125,
    cooldown: 0
  },

  // ═══════════════════════════════════════════════════════════════
  // HEALING POWER-UPS
  // ═══════════════════════════════════════════════════════════════

  CALL_MOM: {
    id: 'call_mom',
    name: 'Call Mom',
    icon: '📞',
    description: 'Full HP heal + she believes in you (+1 bonus question attempt).',
    rarity: 'rare',
    type: 'heal',
    effect: {
      healPercent: 100,
      bonusAttempts: 1
    },
    unlockCondition: { type: 'runs_completed', count: 3 },
    cost: 200,
    cooldown: 0
  },

  SNACK_BREAK: {
    id: 'snack_break',
    name: 'Snack Break',
    icon: '🍕',
    description: 'Pizza heals all wounds. Restore 40 HP immediately.',
    rarity: 'common',
    type: 'heal',
    effect: {
      healAmount: 40
    },
    unlockCondition: { type: 'questions_answered', count: 50 },
    cost: 35,
    cooldown: 0
  },

  POWER_NAP: {
    id: 'power_nap',
    name: 'Power Nap',
    icon: '😴',
    description: '20-minute nap energy. Heal 25 HP + next 2 answers deal +50% damage.',
    rarity: 'uncommon',
    type: 'hybrid',
    effect: {
      healAmount: 25,
      damageBonus: 1.5,
      duration: 2
    },
    unlockCondition: { type: 'time_played', minutes: 60 },
    cost: 80,
    cooldown: 0
  },

  // ═══════════════════════════════════════════════════════════════
  // UTILITY POWER-UPS
  // ═══════════════════════════════════════════════════════════════

  WIKIPEDIA_RABBIT_HOLE: {
    id: 'wikipedia_rabbit_hole',
    name: 'Wikipedia Rabbit Hole',
    icon: '🐇',
    description: 'You went down the rabbit hole. +50% XP for the rest of this run.',
    rarity: 'uncommon',
    type: 'xp',
    effect: {
      xpMultiplier: 1.5,
      duration: 'run'
    },
    unlockCondition: { type: 'correct_first_try', count: 20 },
    cost: 100,
    cooldown: 0
  },

  LUCKY_ERASER: {
    id: 'lucky_eraser',
    name: 'Lucky Eraser',
    icon: '🧽',
    description: 'Erase your last wrong answer from existence. It never happened.',
    rarity: 'rare',
    type: 'utility',
    effect: {
      undoWrongAnswer: 1
    },
    unlockCondition: { type: 'perfect_waves', count: 2 },
    cost: 150,
    cooldown: 0
  },

  STUDY_GROUP: {
    id: 'study_group',
    name: 'Study Group',
    icon: '👥',
    description: 'Phone a friend! See what answer they would pick (may or may not be right).',
    rarity: 'common',
    type: 'hint',
    effect: {
      showFriendGuess: true,
      accuracy: 0.7 // 70% chance friend is right
    },
    unlockCondition: { type: 'questions_answered', count: 100 },
    cost: 45,
    cooldown: 0
  },

  // ═══════════════════════════════════════════════════════════════
  // LEGENDARY POWER-UPS
  // ═══════════════════════════════════════════════════════════════

  GRADE_CURVE: {
    id: 'grade_curve',
    name: 'Grade Curve',
    icon: '📊',
    description: 'Professor grades on a curve! Your next wrong answer counts as correct.',
    rarity: 'legendary',
    type: 'cheat',
    effect: {
      freeCorrectAnswer: 1
    },
    unlockCondition: { type: 'boss_defeated', count: 5 },
    cost: 300,
    cooldown: 0
  },

  CRAMMING_MODE: {
    id: 'cramming_mode',
    name: 'Cramming Mode',
    icon: '📚',
    description: 'It\'s 3AM before the exam. All stats +25% but take 25% more damage.',
    rarity: 'legendary',
    type: 'risky',
    effect: {
      statBonus: 1.25,
      damageVulnerability: 1.25,
      duration: 'wave'
    },
    unlockCondition: { type: 'waves_completed', count: 20 },
    cost: 250,
    cooldown: 0
  },

  EXTRA_CREDIT: {
    id: 'extra_credit',
    name: 'Extra Credit',
    icon: '⭐',
    description: 'Double points for everything this wave. Show off to the teacher!',
    rarity: 'legendary',
    type: 'score',
    effect: {
      scoreMultiplier: 2,
      duration: 'wave'
    },
    unlockCondition: { type: 'high_score', rank: 3 },
    cost: 275,
    cooldown: 0
  },

  LUMINARA_WINK: {
    id: 'luminara_wink',
    name: "Ms. Luminara's Wink",
    icon: '😉',
    description: 'She gives you a knowing look. Advantage on all rolls for 5 questions.',
    rarity: 'legendary',
    type: 'buff',
    effect: {
      advantage: true,
      duration: 5
    },
    unlockCondition: { type: 'secret_boss_defeated', count: 1 },
    cost: 500,
    cooldown: 0
  }
};

// ============================================================================
// POWER-UP MANAGER CLASS
// ============================================================================

class PowerUpManager {
  constructor() {
    this.STORAGE_KEY = 'ms_luminara_powerups';
    this.data = this.loadData();
    this.activePowerUps = []; // Currently active effects
  }

  loadData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load power-up data:', e);
    }
    return this.getDefaultData();
  }

  getDefaultData() {
    return {
      unlocked: ['caffeine_rush', 'rubber_duck_debugging', 'snack_break'], // Start with basics
      inventory: {}, // id -> count
      usageStats: {}, // id -> times used
      progress: {} // Track unlock progress
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save power-up data:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // UNLOCK SYSTEM
  // ═══════════════════════════════════════════════════════════════

  /**
   * Check and update unlock progress
   */
  checkUnlocks(stats) {
    const newUnlocks = [];

    for (const [id, powerUp] of Object.entries(POWER_UPS)) {
      if (this.data.unlocked.includes(id)) continue;

      const condition = powerUp.unlockCondition;
      let unlocked = false;

      switch (condition.type) {
        case 'questions_answered':
          unlocked = (stats.totalQuestions || 0) >= condition.count;
          break;
        case 'streak':
          unlocked = (stats.bestStreak || 0) >= condition.count;
          break;
        case 'wrong_answers':
          unlocked = (stats.totalWrong || 0) >= condition.count;
          break;
        case 'boss_defeated':
          unlocked = (stats.bossesDefeated || 0) >= condition.count;
          break;
        case 'secret_boss_defeated':
          unlocked = (stats.secretBossDefeated || 0) >= condition.count;
          break;
        case 'damage_taken':
          unlocked = (stats.totalDamageTaken || 0) >= condition.count;
          break;
        case 'survive_low_hp':
          unlocked = (stats.lowHPSurvives || 0) >= condition.count;
          break;
        case 'runs_completed':
          unlocked = (stats.completedRuns || 0) >= condition.count;
          break;
        case 'correct_first_try':
          unlocked = (stats.correctFirstTry || 0) >= condition.count;
          break;
        case 'perfect_waves':
          unlocked = (stats.perfectWaves || 0) >= condition.count;
          break;
        case 'waves_completed':
          unlocked = (stats.wavesCompleted || 0) >= condition.count;
          break;
        case 'time_played':
          unlocked = (stats.minutesPlayed || 0) >= condition.minutes;
          break;
        case 'high_score':
          unlocked = (stats.highScoreRank || 999) <= condition.rank;
          break;
      }

      if (unlocked) {
        this.data.unlocked.push(id);
        newUnlocks.push(powerUp);
      }
    }

    if (newUnlocks.length > 0) {
      this.save();
    }

    return newUnlocks;
  }

  /**
   * Get unlock progress for a specific power-up
   */
  getUnlockProgress(powerUpId) {
    const powerUp = POWER_UPS[powerUpId];
    if (!powerUp || this.data.unlocked.includes(powerUpId)) {
      return { unlocked: this.data.unlocked.includes(powerUpId), progress: 100 };
    }

    const condition = powerUp.unlockCondition;
    const current = this.data.progress[condition.type] || 0;
    const target = condition.count || condition.minutes || condition.rank;

    return {
      unlocked: false,
      progress: Math.min(100, Math.floor((current / target) * 100)),
      current,
      target,
      type: condition.type
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // INVENTORY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Purchase a power-up with arcade tokens
   */
  purchasePowerUp(powerUpId, tokenManager) {
    const powerUp = POWER_UPS[powerUpId];
    if (!powerUp) return { success: false, reason: 'Invalid power-up' };

    if (!this.data.unlocked.includes(powerUpId)) {
      return { success: false, reason: 'Power-up not unlocked yet' };
    }

    const cost = powerUp.cost;
    if (!tokenManager.spendTokens(cost)) {
      return { success: false, reason: 'Not enough tokens' };
    }

    this.data.inventory[powerUpId] = (this.data.inventory[powerUpId] || 0) + 1;
    this.save();

    return { success: true, newCount: this.data.inventory[powerUpId] };
  }

  /**
   * Get power-up inventory
   */
  getInventory() {
    return this.data.inventory;
  }

  /**
   * Get count of a specific power-up
   */
  getCount(powerUpId) {
    return this.data.inventory[powerUpId] || 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // POWER-UP USAGE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Use a power-up from inventory
   */
  usePowerUp(powerUpId) {
    if (!this.data.inventory[powerUpId] || this.data.inventory[powerUpId] <= 0) {
      return { success: false, reason: 'No power-ups available' };
    }

    const powerUp = POWER_UPS[powerUpId];
    if (!powerUp) return { success: false, reason: 'Invalid power-up' };

    // Consume from inventory
    this.data.inventory[powerUpId]--;
    this.data.usageStats[powerUpId] = (this.data.usageStats[powerUpId] || 0) + 1;

    // Activate the power-up
    const activeEffect = {
      id: powerUpId,
      ...powerUp,
      activatedAt: Date.now(),
      remainingDuration: powerUp.effect.duration || 1
    };

    this.activePowerUps.push(activeEffect);
    this.save();

    return { success: true, effect: activeEffect };
  }

  /**
   * Get currently active power-ups
   */
  getActivePowerUps() {
    return this.activePowerUps;
  }

  /**
   * Check if a specific effect is active
   */
  hasActiveEffect(effectType) {
    return this.activePowerUps.some(p => p.type === effectType);
  }

  /**
   * Get active damage multiplier
   */
  getDamageMultiplier(currentHP = 100, maxHP = 100) {
    let multiplier = 1;

    for (const powerUp of this.activePowerUps) {
      if (powerUp.effect.damageMultiplier) {
        // Check condition
        if (powerUp.effect.condition === 'hp_below_25') {
          if (currentHP / maxHP < 0.25) {
            multiplier *= powerUp.effect.damageMultiplier;
          }
        } else {
          multiplier *= powerUp.effect.damageMultiplier;
        }
      }
      if (powerUp.effect.damageBonus) {
        multiplier *= powerUp.effect.damageBonus;
      }
    }

    return multiplier;
  }

  /**
   * Get active stat bonus
   */
  getStatBonus() {
    let bonus = 1;

    for (const powerUp of this.activePowerUps) {
      if (powerUp.effect.statBonus) {
        bonus *= powerUp.effect.statBonus;
      }
    }

    return bonus;
  }

  /**
   * Get active XP multiplier
   */
  getXPMultiplier() {
    let multiplier = 1;

    for (const powerUp of this.activePowerUps) {
      if (powerUp.effect.xpMultiplier) {
        multiplier *= powerUp.effect.xpMultiplier;
      }
    }

    return multiplier;
  }

  /**
   * Get active score multiplier
   */
  getScoreMultiplier() {
    let multiplier = 1;

    for (const powerUp of this.activePowerUps) {
      if (powerUp.effect.scoreMultiplier) {
        multiplier *= powerUp.effect.scoreMultiplier;
      }
    }

    return multiplier;
  }

  /**
   * Check if player has advantage on rolls
   */
  hasAdvantage() {
    return this.activePowerUps.some(p => p.effect.advantage);
  }

  /**
   * Check for shield blocks available
   */
  getShieldBlocks() {
    let blocks = 0;

    for (const powerUp of this.activePowerUps) {
      if (powerUp.effect.blockAttacks) {
        blocks += powerUp.effect.blockAttacks;
      }
    }

    return blocks;
  }

  /**
   * Use a shield block
   */
  useShieldBlock() {
    for (const powerUp of this.activePowerUps) {
      if (powerUp.effect.blockAttacks && powerUp.effect.blockAttacks > 0) {
        powerUp.effect.blockAttacks--;
        if (powerUp.effect.blockAttacks <= 0) {
          this.removeActivePowerUp(powerUp.id);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Tick down duration-based power-ups
   */
  tickPowerUps(event = 'question') {
    const expired = [];

    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const powerUp = this.activePowerUps[i];

      // Skip permanent/run/wave duration power-ups on question tick
      if (typeof powerUp.remainingDuration === 'string') continue;

      if (typeof powerUp.remainingDuration === 'number') {
        powerUp.remainingDuration--;

        if (powerUp.remainingDuration <= 0) {
          expired.push(powerUp);
          this.activePowerUps.splice(i, 1);
        }
      }
    }

    return expired;
  }

  /**
   * Clear power-ups on wave end
   */
  clearWavePowerUps() {
    this.activePowerUps = this.activePowerUps.filter(
      p => p.remainingDuration !== 'wave'
    );
  }

  /**
   * Clear power-ups on run end
   */
  clearRunPowerUps() {
    this.activePowerUps = [];
  }

  /**
   * Remove a specific active power-up
   */
  removeActivePowerUp(powerUpId) {
    this.activePowerUps = this.activePowerUps.filter(p => p.id !== powerUpId);
  }

  // ═══════════════════════════════════════════════════════════════
  // SPECIAL EFFECTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get answer elimination count
   */
  getEliminateCount() {
    let count = 0;

    for (const powerUp of this.activePowerUps) {
      if (powerUp.effect.eliminateAnswers) {
        count += powerUp.effect.eliminateAnswers;
      }
    }

    return count;
  }

  /**
   * Use answer elimination
   */
  useElimination() {
    for (const powerUp of this.activePowerUps) {
      if (powerUp.effect.eliminateAnswers && powerUp.effect.eliminateAnswers > 0) {
        const eliminated = powerUp.effect.eliminateAnswers;
        powerUp.remainingDuration = 0;
        this.removeActivePowerUp(powerUp.id);
        return eliminated;
      }
    }
    return 0;
  }

  /**
   * Check for free correct answer
   */
  hasFreeCorrectAnswer() {
    return this.activePowerUps.some(p => p.effect.freeCorrectAnswer);
  }

  /**
   * Use free correct answer
   */
  useFreeCorrectAnswer() {
    const powerUp = this.activePowerUps.find(p => p.effect.freeCorrectAnswer);
    if (powerUp) {
      this.removeActivePowerUp(powerUp.id);
      return true;
    }
    return false;
  }

  /**
   * Check for boss turn skip
   */
  canSkipBossTurn() {
    return this.activePowerUps.some(p => p.effect.skipBossTurn);
  }

  /**
   * Use boss turn skip
   */
  useBossTurnSkip() {
    const powerUp = this.activePowerUps.find(p => p.effect.skipBossTurn);
    if (powerUp) {
      this.removeActivePowerUp(powerUp.id);
      return true;
    }
    return false;
  }

  /**
   * Get study group friend guess
   */
  getFriendGuess(correctIndex, totalOptions) {
    const powerUp = this.activePowerUps.find(p => p.effect.showFriendGuess);
    if (!powerUp) return null;

    const accuracy = powerUp.effect.accuracy || 0.7;

    // Remove after use
    this.removeActivePowerUp(powerUp.id);

    // Friend's guess
    if (Math.random() < accuracy) {
      return { guess: correctIndex, isCorrect: true };
    } else {
      // Pick a wrong answer
      let wrongGuess;
      do {
        wrongGuess = Math.floor(Math.random() * totalOptions);
      } while (wrongGuess === correctIndex);
      return { guess: wrongGuess, isCorrect: false };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get all power-up definitions
   */
  getAllPowerUps() {
    return POWER_UPS;
  }

  /**
   * Get unlocked power-ups
   */
  getUnlockedPowerUps() {
    return this.data.unlocked.map(id => ({
      id,
      ...POWER_UPS[id],
      count: this.data.inventory[id] || 0
    }));
  }

  /**
   * Get locked power-ups with progress
   */
  getLockedPowerUps() {
    return Object.entries(POWER_UPS)
      .filter(([id]) => !this.data.unlocked.includes(id))
      .map(([id, powerUp]) => ({
        id,
        ...powerUp,
        ...this.getUnlockProgress(id)
      }));
  }

  /**
   * Get usage stats
   */
  getUsageStats() {
    return this.data.usageStats;
  }

  /**
   * Update progress toward unlocks
   */
  updateProgress(type, amount = 1) {
    this.data.progress[type] = (this.data.progress[type] || 0) + amount;
    this.save();
  }
}

// Export singleton
let powerUpManager = null;
