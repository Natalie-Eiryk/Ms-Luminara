/**
 * Ms. Luminara Quiz - Boss Battle System
 * "The Luminara Gauntlet"
 *
 * Roguelike boss encounters with D20 combat mechanics
 */

// ═══════════════════════════════════════════════════════════════
// BOSS DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const BOSSES = {
  THE_FORGETFUL_ONE: {
    id: 'forgetful_one',
    name: 'The Forgetful One',
    subtitle: 'Destroyer of Short-Term Memory',
    emoji: '🧠💨',
    maxHP: 120,
    armor: 8,
    baseDamage: 12,
    weakTo: 'wisdom',
    resistsTo: 'charisma',
    phase2Threshold: 0.5,
    abilities: [
      { name: 'Memory Wipe', damage: 10, effect: 'blur_options', description: 'Options become harder to read' },
      { name: 'Confusion Cloud', damage: 8, effect: 'shuffle_options', description: 'Shuffles the answer options' },
      { name: 'Recall Block', damage: 15, effect: 'none', description: 'A direct assault on your neurons' }
    ],
    phase2Abilities: [
      { name: 'Mass Amnesia', damage: 20, effect: 'reset_streak', description: 'Your streak fades from memory...' }
    ],
    tauntMessages: [
      "What was the question again?",
      "You'll forget me soon enough...",
      "Your neurons are... slipping...",
      "Memory is such a fragile thing..."
    ],
    defeatQuote: "I... I remember now... it was all so clear...",
    lootTable: ['RING_OF_RECALL', 'TOME_OF_MEMORY'],
    unlocked: true
  },

  THE_PROCRASTINATOR: {
    id: 'procrastinator',
    name: 'The Procrastinator',
    subtitle: 'Lord of Tomorrow',
    emoji: '⏰😴',
    maxHP: 100,
    armor: 6,
    baseDamage: 10,
    weakTo: 'constitution',
    resistsTo: 'wisdom',
    phase2Threshold: 0.4,
    abilities: [
      { name: 'Time Drain', damage: 8, effect: 'reduce_timer', description: 'Steals your precious seconds' },
      { name: 'Delay Tactics', damage: 5, effect: 'skip_turn', description: '"We can do this later..."' },
      { name: 'Motivation Sap', damage: 12, effect: 'reduce_xp', description: 'Why even try?' }
    ],
    phase2Abilities: [
      { name: 'Eternal Tomorrow', damage: 18, effect: 'double_next_damage', description: 'The future is now... painful' }
    ],
    tauntMessages: [
      "We can finish this later...",
      "Five more minutes...",
      "Is this really due today?",
      "*yawns dramatically*"
    ],
    defeatQuote: "Fine... I'll do it... tomorrow... no wait—",
    lootTable: ['BOOTS_OF_HASTE', 'CLOCK_PENDANT'],
    unlocked: true
  },

  THE_ANXIETY_SPIRAL: {
    id: 'anxiety_spiral',
    name: 'The Anxiety Spiral',
    subtitle: 'Whispers of Doubt',
    emoji: '🌀😰',
    maxHP: 90,
    armor: 5,
    baseDamage: 15,
    weakTo: 'charisma',
    resistsTo: 'intelligence',
    phase2Threshold: 0.6,
    abilities: [
      { name: 'Overthink', damage: 10, effect: 'add_fake_option', description: 'Adds a convincing wrong answer' },
      { name: 'Self-Doubt', damage: 12, effect: 'hide_confidence', description: 'Are you SURE that\'s right?' },
      { name: 'Catastrophize', damage: 18, effect: 'none', description: 'Everything is falling apart!' }
    ],
    phase2Abilities: [
      { name: 'Spiral of Doom', damage: 25, effect: 'damage_over_time', description: 'The thoughts won\'t stop...' }
    ],
    tauntMessages: [
      "But what if you're WRONG?",
      "Everyone is watching you fail...",
      "You're not good enough for this...",
      "Remember that embarrassing thing from 10 years ago?"
    ],
    defeatQuote: "Maybe... maybe it wasn't so bad after all...",
    lootTable: ['CALM_CRYSTAL', 'RING_OF_SERENITY'],
    unlocked: true
  },

  THE_DISTRACTION_DEMON: {
    id: 'distraction_demon',
    name: 'The Distraction Demon',
    subtitle: 'Keeper of Open Tabs',
    emoji: '📱👹',
    maxHP: 110,
    armor: 7,
    baseDamage: 11,
    weakTo: 'intelligence',
    resistsTo: 'constitution',
    phase2Threshold: 0.5,
    abilities: [
      { name: 'Social Media Ping', damage: 8, effect: 'notification_flash', description: '*ding* Someone liked your post!' },
      { name: 'YouTube Rabbit Hole', damage: 10, effect: 'show_video_thumbnail', description: 'Just one more video...' },
      { name: 'Wikipedia Wormhole', damage: 14, effect: 'none', description: 'How did you end up here?' }
    ],
    phase2Abilities: [
      { name: 'Total Tab Overload', damage: 22, effect: 'screen_chaos', description: '47 tabs and counting...' }
    ],
    tauntMessages: [
      "Ooh, what's trending?",
      "Did you check your phone?",
      "This can wait, right?",
      "Just a quick scroll..."
    ],
    defeatQuote: "Fine... *closes 47 tabs* ...focus achieved.",
    lootTable: ['FOCUS_HEADBAND', 'NOTIFICATION_BLOCKER'],
    unlocked: true
  },

  THE_IMPOSTER: {
    id: 'imposter',
    name: 'The Imposter',
    subtitle: 'You Don\'t Belong Here',
    emoji: '👻🎭',
    maxHP: 130,
    armor: 9,
    baseDamage: 14,
    weakTo: 'charisma',
    resistsTo: 'wisdom',
    phase2Threshold: 0.45,
    abilities: [
      { name: 'You\'re Faking It', damage: 12, effect: 'reduce_stats_display', description: 'Your achievements mean nothing' },
      { name: 'They\'ll Find Out', damage: 10, effect: 'paranoia_vision', description: 'Any moment now...' },
      { name: 'Lucky Guess', damage: 16, effect: 'no_xp_next', description: 'You didn\'t REALLY know that' }
    ],
    phase2Abilities: [
      { name: 'Complete Fraud', damage: 28, effect: 'invert_confidence', description: 'You were never qualified' }
    ],
    tauntMessages: [
      "You don't deserve to be here.",
      "Everyone else is smarter than you.",
      "You just got lucky so far...",
      "Real scholars don't struggle like this."
    ],
    defeatQuote: "Wait... you actually DO know things? Impossible!",
    lootTable: ['CROWN_OF_CONFIDENCE', 'AUTHENTIC_AMULET'],
    unlocked: false,
    unlockCondition: { type: 'defeat_bosses', count: 3 }
  },

  MS_LUMINARA_SHADOW: {
    id: 'shadow_luminara',
    name: "Ms. Luminara's Shadow",
    subtitle: 'The Teacher You Fear',
    emoji: '👤✨',
    maxHP: 200,
    armor: 12,
    baseDamage: 18,
    weakTo: null, // No weakness
    resistsTo: null,
    phase2Threshold: 0.5,
    phase3Threshold: 0.25,
    abilities: [
      { name: 'Pop Quiz', damage: 15, effect: 'harder_question', description: 'You weren\'t prepared for this' },
      { name: 'Disappointed Sigh', damage: 12, effect: 'guilt_damage', description: '"I expected more from you..."' },
      { name: 'Office Hours Summon', damage: 10, effect: 'extra_question', description: 'We need to talk about your performance' }
    ],
    phase2Abilities: [
      { name: 'Final Exam', damage: 25, effect: 'multi_question', description: 'Everything you\'ve learned will be tested' }
    ],
    phase3Abilities: [
      { name: 'True Teaching', damage: 0, effect: 'heal_player', description: '"You\'ve grown so much..."', isPositive: true }
    ],
    tauntMessages: [
      "Come closer... if you dare.",
      "Show me what you've learned.",
      "This is the real test.",
      "I've been waiting for this moment."
    ],
    defeatQuote: "You've surpassed even my expectations. I'm... proud of you.",
    lootTable: ['MS_LUMINARAS_FAVOR', 'TOME_OF_ENDLESS_KNOWLEDGE', 'CROWN_OF_THE_ARCHMAGE'],
    unlocked: false,
    unlockCondition: { type: 'defeat_all_bosses' },
    isSecret: true
  }
};

// ═══════════════════════════════════════════════════════════════
// BOSS ENCOUNTER CLASS
// ═══════════════════════════════════════════════════════════════

class BossEncounter {
  constructor(bossId) {
    this.boss = BOSSES[bossId];
    if (!this.boss) throw new Error(`Unknown boss: ${bossId}`);

    this.bossHP = this.boss.maxHP;
    this.maxHP = this.boss.maxHP;
    this.phase = 1;
    this.turnCount = 0;
    this.playerDamageDealt = 0;
    this.bossDamageDealt = 0;
    this.actionHistory = [];
    this.activeEffects = [];
    this.startTime = Date.now();
  }

  // Get current HP percentage
  getHPPercent() {
    return this.bossHP / this.maxHP;
  }

  // Check and update phase
  checkPhaseTransition() {
    const hpPercent = this.getHPPercent();
    const oldPhase = this.phase;

    if (this.boss.phase3Threshold && hpPercent <= this.boss.phase3Threshold) {
      this.phase = 3;
    } else if (hpPercent <= this.boss.phase2Threshold) {
      this.phase = 2;
    }

    return this.phase !== oldPhase ? this.phase : null;
  }

  // Calculate player damage to boss
  calculatePlayerDamage(answerResult, gearStats) {
    let baseDamage = 15;

    // Correct answer bonus
    if (answerResult.wasCorrect) {
      baseDamage += 20;
      if (answerResult.wasFirstTry) baseDamage += 15;
    } else {
      baseDamage = 5; // Minimal damage on wrong answer
    }

    // Gear bonuses (INT adds damage)
    const intBonus = Math.floor((gearStats.intelligence || 0) / 2);
    baseDamage += intBonus;

    // D20 attack roll
    const attackRoll = d20System.rollD20();
    let multiplier = 1;

    if (attackRoll.isCriticalSuccess) {
      multiplier = 2; // Critical hit!
    } else if (attackRoll.isCriticalFailure) {
      multiplier = 0.5; // Fumble
    }

    // Weakness/resistance
    const playerStat = this.getStrongestStat(gearStats);
    if (this.boss.weakTo === playerStat) {
      baseDamage = Math.floor(baseDamage * 1.5);
    } else if (this.boss.resistsTo === playerStat) {
      baseDamage = Math.floor(baseDamage * 0.6);
    }

    // Apply armor reduction
    const finalDamage = Math.max(1, Math.floor(baseDamage * multiplier) - this.boss.armor);

    return {
      baseDamage,
      roll: attackRoll,
      multiplier,
      armorReduction: this.boss.armor,
      finalDamage,
      isCritical: attackRoll.isCriticalSuccess,
      isFumble: attackRoll.isCriticalFailure
    };
  }

  // Get player's strongest stat for weakness check
  getStrongestStat(gearStats) {
    const stats = {
      intelligence: gearStats.intelligence || 0,
      wisdom: gearStats.wisdom || 0,
      constitution: gearStats.constitution || 0,
      charisma: gearStats.charisma || 0
    };
    return Object.entries(stats).sort((a, b) => b[1] - a[1])[0][0];
  }

  // Apply damage to boss
  dealDamage(amount) {
    this.bossHP = Math.max(0, this.bossHP - amount);
    this.playerDamageDealt += amount;
    return {
      newHP: this.bossHP,
      defeated: this.bossHP <= 0,
      phaseChange: this.checkPhaseTransition()
    };
  }

  // Boss selects and executes ability
  bossAttack(playerStats) {
    // Select ability based on phase
    let abilityPool = this.boss.abilities;
    if (this.phase === 2 && this.boss.phase2Abilities) {
      abilityPool = [...abilityPool, ...this.boss.phase2Abilities];
    }
    if (this.phase === 3 && this.boss.phase3Abilities) {
      abilityPool = this.boss.phase3Abilities;
    }

    const ability = abilityPool[Math.floor(Math.random() * abilityPool.length)];

    // Roll for boss attack
    const attackRoll = d20System.rollD20();

    // Player CON reduces damage
    const conMod = Math.floor((playerStats.constitution || 10) - 10) / 2;
    const damage = Math.max(1, ability.damage - Math.max(0, conMod));

    // Critical boss hit on nat 20, miss on nat 1
    let finalDamage = damage;
    if (attackRoll.isCriticalSuccess) {
      finalDamage = damage * 2;
    } else if (attackRoll.isCriticalFailure) {
      finalDamage = 0; // Boss fumbles!
    }

    this.bossDamageDealt += finalDamage;
    this.turnCount++;

    return {
      ability,
      roll: attackRoll,
      damage: finalDamage,
      effect: ability.effect,
      isCritical: attackRoll.isCriticalSuccess,
      isMiss: attackRoll.isCriticalFailure,
      isPositive: ability.isPositive || false
    };
  }

  // Get random taunt
  getTaunt() {
    return this.boss.tauntMessages[Math.floor(Math.random() * this.boss.tauntMessages.length)];
  }

  // Get victory data
  getVictoryData() {
    const battleTime = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      bossId: this.boss.id,
      bossName: this.boss.name,
      defeatQuote: this.boss.defeatQuote,
      battleTime,
      turnCount: this.turnCount,
      playerDamageDealt: this.playerDamageDealt,
      bossDamageDealt: this.bossDamageDealt,
      lootTable: this.boss.lootTable
    };
  }

  // Check if boss is defeated
  isDefeated() {
    return this.bossHP <= 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// BOSS MANAGER
// ═══════════════════════════════════════════════════════════════

class BossManager {
  constructor() {
    this.STORAGE_KEY = 'ms_luminara_boss_progress';
    this.data = this.loadData();
    this.currentEncounter = null;
  }

  loadData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load boss data:', e);
    }
    return this.getDefaultData();
  }

  getDefaultData() {
    return {
      bossesDefeated: {}, // { bossId: { count, bestTime, lowestTurns } }
      totalBossKills: 0,
      unlockedBosses: ['forgetful_one', 'procrastinator', 'anxiety_spiral', 'distraction_demon'],
      secretBossUnlocked: false
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save boss data:', e);
    }
  }

  // Get list of available bosses for a run
  getAvailableBosses() {
    return Object.values(BOSSES).filter(boss => {
      if (boss.isSecret && !this.data.secretBossUnlocked) return false;
      return this.data.unlockedBosses.includes(boss.id);
    });
  }

  // Select random boss for encounter
  selectRandomBoss(excludeIds = []) {
    const available = this.getAvailableBosses().filter(b => !excludeIds.includes(b.id));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  // Start boss encounter
  startEncounter(bossId) {
    this.currentEncounter = new BossEncounter(bossId);
    return this.currentEncounter;
  }

  // Record boss defeat
  recordVictory(victoryData) {
    const bossId = victoryData.bossId;

    if (!this.data.bossesDefeated[bossId]) {
      this.data.bossesDefeated[bossId] = {
        count: 0,
        bestTime: Infinity,
        lowestTurns: Infinity
      };
    }

    const record = this.data.bossesDefeated[bossId];
    record.count++;
    record.bestTime = Math.min(record.bestTime, victoryData.battleTime);
    record.lowestTurns = Math.min(record.lowestTurns, victoryData.turnCount);

    this.data.totalBossKills++;

    // Check unlocks
    this.checkUnlocks();
    this.save();

    return {
      isFirstKill: record.count === 1,
      isNewRecord: victoryData.battleTime === record.bestTime || victoryData.turnCount === record.lowestTurns,
      totalKills: this.data.totalBossKills
    };
  }

  // Check for boss unlocks
  checkUnlocks() {
    // Unlock Imposter after defeating 3 different bosses
    const uniqueDefeats = Object.keys(this.data.bossesDefeated).length;
    if (uniqueDefeats >= 3 && !this.data.unlockedBosses.includes('imposter')) {
      this.data.unlockedBosses.push('imposter');
    }

    // Unlock secret boss after defeating all regular bosses
    const regularBosses = Object.values(BOSSES).filter(b => !b.isSecret);
    const allDefeated = regularBosses.every(b => this.data.bossesDefeated[b.id]);
    if (allDefeated && !this.data.secretBossUnlocked) {
      this.data.secretBossUnlocked = true;
      this.data.unlockedBosses.push('shadow_luminara');
    }
  }

  // Get boss stats
  getBossStats(bossId) {
    return this.data.bossesDefeated[bossId] || null;
  }

  // Get all stats
  getAllStats() {
    return {
      ...this.data,
      totalUniqueBosses: Object.keys(this.data.bossesDefeated).length,
      availableBossCount: this.getAvailableBosses().length
    };
  }
}

// Export
let bossManager = null;
