/**
 * Ms. Luminara Quiz - Gamification Engine
 * Handles XP calculations, streaks, achievements, and variable reinforcement
 *
 * PASS 1: Daily Challenges - Fresh goals each day
 * PASS 2: Combo System - Fast consecutive answers multiply XP
 * PASS 3: Milestone Rewards - Celebrate major achievements
 * PASS 4: Study Streak Calendar - Track daily consistency
 * PASS 5: Mastery Tiers - Bronze/Silver/Gold/Platinum/Diamond per category
 * PASS 6: Sound & Haptic Hooks - Feedback triggers for UI layer
 * PASS 7: Seasonal Events - Limited-time bonuses and themes
 */

class GamificationEngine {
  constructor(persistenceManager, achievementData) {
    this.persistence = persistenceManager;
    this.achievements = achievementData;
    this.pendingNotifications = [];
    this.luckyStrikeChance = 0.10; // 10% chance

    // PASS 2: Combo system
    this.comboState = {
      count: 0,
      lastAnswerTime: 0,
      comboWindow: 8000, // 8 seconds to maintain combo
      maxCombo: 0
    };

    // PASS 6: Sound/haptic hooks (UI layer implements these)
    this.soundHooks = {
      onCorrect: [],
      onWrong: [],
      onCombo: [],
      onLevelUp: [],
      onAchievement: [],
      onLuckyStrike: [],
      onMilestone: [],
      onDailyComplete: []
    };

    // Initialize daily challenges
    this.initDailyChallenges();
  }

  // ═══════════════════════════════════════════════════════════════
  // PASS 1: DAILY CHALLENGES
  // ═══════════════════════════════════════════════════════════════

  initDailyChallenges() {
    const today = this.getTodayKey();
    const stored = this.persistence.data.dailyChallenges || {};

    if (stored.date !== today) {
      // Generate new daily challenges
      this.persistence.data.dailyChallenges = {
        date: today,
        challenges: this.generateDailyChallenges(),
        completed: [],
        bonusClaimed: false
      };
      this.persistence.save();
    }
  }

  getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  generateDailyChallenges() {
    const allChallenges = [
      { id: 'answer_10', name: 'Warm Up', desc: 'Answer 10 questions', type: 'questions', target: 10, xp: 150, icon: '🎯' },
      { id: 'answer_25', name: 'Dedicated', desc: 'Answer 25 questions', type: 'questions', target: 25, xp: 300, icon: '📚' },
      { id: 'answer_50', name: 'Scholar', desc: 'Answer 50 questions', type: 'questions', target: 50, xp: 500, icon: '🎓' },
      { id: 'streak_5', name: 'Hot Streak', desc: 'Get a 5-answer streak', type: 'streak', target: 5, xp: 200, icon: '🔥' },
      { id: 'streak_10', name: 'On Fire', desc: 'Get a 10-answer streak', type: 'streak', target: 10, xp: 400, icon: '💥' },
      { id: 'accuracy_80', name: 'Sharp Mind', desc: '80%+ accuracy (min 10 Qs)', type: 'accuracy', target: 80, xp: 250, icon: '🎯' },
      { id: 'accuracy_90', name: 'Precision', desc: '90%+ accuracy (min 10 Qs)', type: 'accuracy', target: 90, xp: 400, icon: '💎' },
      { id: 'combo_3', name: 'Quick Draw', desc: 'Get a 3x combo', type: 'combo', target: 3, xp: 150, icon: '⚡' },
      { id: 'combo_5', name: 'Lightning', desc: 'Get a 5x combo', type: 'combo', target: 5, xp: 300, icon: '🌩️' },
      { id: 'first_try_5', name: 'No Mistakes', desc: '5 correct first-try in a row', type: 'first_try_streak', target: 5, xp: 250, icon: '✨' },
      { id: 'revenge_3', name: 'Redemption', desc: 'Get 3 revenge bonuses', type: 'revenge', target: 3, xp: 200, icon: '💪' },
      { id: 'categories_3', name: 'Explorer', desc: 'Answer from 3 categories', type: 'categories', target: 3, xp: 200, icon: '🗺️' }
    ];

    // Pick 3 random challenges of varying difficulty
    const shuffled = [...allChallenges].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  getDailyChallenges() {
    this.initDailyChallenges(); // Ensure fresh
    return this.persistence.data.dailyChallenges;
  }

  checkDailyChallenges(sessionStats) {
    const daily = this.persistence.data.dailyChallenges;
    if (!daily || !daily.challenges || !Array.isArray(daily.challenges)) return [];

    const newlyCompleted = [];

    for (const challenge of daily.challenges) {
      if (daily.completed.includes(challenge.id)) continue;

      let completed = false;

      switch (challenge.type) {
        case 'questions':
          completed = sessionStats.questionsToday >= challenge.target;
          break;
        case 'streak':
          completed = this.persistence.getStreak() >= challenge.target;
          break;
        case 'accuracy':
          if (sessionStats.questionsToday >= 10) {
            completed = sessionStats.accuracyToday >= challenge.target;
          }
          break;
        case 'combo':
          completed = this.comboState.maxCombo >= challenge.target;
          break;
        case 'first_try_streak':
          completed = sessionStats.firstTryStreak >= challenge.target;
          break;
        case 'revenge':
          completed = sessionStats.revengeCount >= challenge.target;
          break;
        case 'categories':
          completed = sessionStats.categoriesAnswered >= challenge.target;
          break;
      }

      if (completed) {
        daily.completed.push(challenge.id);
        this.persistence.addXP(challenge.xp);
        newlyCompleted.push(challenge);
        this.triggerHook('onDailyComplete', challenge);
      }
    }

    // Check for daily completion bonus
    if (daily.completed.length === 3 && !daily.bonusClaimed) {
      daily.bonusClaimed = true;
      const bonusXP = 500;
      this.persistence.addXP(bonusXP);
      newlyCompleted.push({
        id: 'daily_bonus',
        name: 'Daily Champion',
        desc: 'All challenges complete!',
        xp: bonusXP,
        icon: '🏆'
      });
    }

    this.persistence.save();
    return newlyCompleted;
  }

  // ═══════════════════════════════════════════════════════════════
  // PASS 2: COMBO SYSTEM
  // ═══════════════════════════════════════════════════════════════

  updateCombo(wasCorrect) {
    const now = Date.now();
    const timeSinceLastAnswer = now - this.comboState.lastAnswerTime;

    if (wasCorrect && timeSinceLastAnswer < this.comboState.comboWindow) {
      this.comboState.count++;
      if (this.comboState.count > this.comboState.maxCombo) {
        this.comboState.maxCombo = this.comboState.count;
      }

      // Trigger combo hooks at milestones
      if (this.comboState.count >= 3) {
        this.triggerHook('onCombo', this.comboState.count);
      }
    } else if (wasCorrect) {
      // Start new combo
      this.comboState.count = 1;
    } else {
      // Break combo
      this.comboState.count = 0;
    }

    this.comboState.lastAnswerTime = now;
    return this.comboState.count;
  }

  getComboMultiplier() {
    const combo = this.comboState.count;
    if (combo < 2) return 1;
    if (combo < 3) return 1.1;
    if (combo < 5) return 1.25;
    if (combo < 7) return 1.5;
    if (combo < 10) return 1.75;
    return 2.0; // Max 2x at 10+ combo
  }

  getComboMessage() {
    const combo = this.comboState.count;
    const messages = {
      3: ['Combo x3!', 'Triple threat!', 'Keep it up!'],
      5: ['Combo x5!', 'Unstoppable!', 'On fire!'],
      7: ['Combo x7!', 'Incredible!', 'Lightning fast!'],
      10: ['COMBO x10!', 'LEGENDARY!', 'MAXIMUM POWER!']
    };

    const thresholds = [10, 7, 5, 3];
    for (const t of thresholds) {
      if (combo >= t) {
        const pool = messages[t];
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // PASS 3: MILESTONE REWARDS
  // ═══════════════════════════════════════════════════════════════

  checkMilestones() {
    const player = this.persistence.getPlayer();
    const milestones = this.getMilestoneDefinitions();
    const reached = [];

    const unlockedMilestones = this.persistence.data.milestones || [];

    for (const milestone of milestones) {
      if (unlockedMilestones.includes(milestone.id)) continue;

      let achieved = false;
      switch (milestone.type) {
        case 'xp':
          achieved = player.totalXP >= milestone.threshold;
          break;
        case 'questions':
          achieved = player.totalAnswered >= milestone.threshold;
          break;
        case 'level':
          achieved = player.level >= milestone.threshold;
          break;
        case 'streak':
          achieved = player.bestStreak >= milestone.threshold;
          break;
        case 'accuracy':
          if (player.totalAnswered >= 50) {
            achieved = (player.totalCorrectFirstTry / player.totalAnswered * 100) >= milestone.threshold;
          }
          break;
      }

      if (achieved) {
        if (!this.persistence.data.milestones) {
          this.persistence.data.milestones = [];
        }
        this.persistence.data.milestones.push(milestone.id);
        this.persistence.addXP(milestone.reward);
        reached.push(milestone);
        this.triggerHook('onMilestone', milestone);
      }
    }

    if (reached.length > 0) {
      this.persistence.save();
    }

    return reached;
  }

  getMilestoneDefinitions() {
    return [
      // XP Milestones
      { id: 'xp_1000', type: 'xp', threshold: 1000, reward: 100, name: 'Getting Started', icon: '🌱', celebration: 'confetti' },
      { id: 'xp_5000', type: 'xp', threshold: 5000, reward: 250, name: 'Rising Scholar', icon: '📖', celebration: 'confetti' },
      { id: 'xp_10000', type: 'xp', threshold: 10000, reward: 500, name: 'Knowledge Seeker', icon: '🔍', celebration: 'fireworks' },
      { id: 'xp_25000', type: 'xp', threshold: 25000, reward: 1000, name: 'Dedicated Learner', icon: '🎓', celebration: 'fireworks' },
      { id: 'xp_50000', type: 'xp', threshold: 50000, reward: 2000, name: 'Master Scholar', icon: '👑', celebration: 'epic' },
      { id: 'xp_100000', type: 'xp', threshold: 100000, reward: 5000, name: 'Legendary Mind', icon: '⭐', celebration: 'epic' },

      // Question Milestones
      { id: 'q_100', type: 'questions', threshold: 100, reward: 200, name: 'Century Mark', icon: '💯', celebration: 'confetti' },
      { id: 'q_500', type: 'questions', threshold: 500, reward: 500, name: '500 Club', icon: '🏅', celebration: 'confetti' },
      { id: 'q_1000', type: 'questions', threshold: 1000, reward: 1000, name: 'Thousand Strong', icon: '🏆', celebration: 'fireworks' },

      // Level Milestones
      { id: 'level_5', type: 'level', threshold: 5, reward: 150, name: 'Apprentice', icon: '🌿', celebration: 'confetti' },
      { id: 'level_10', type: 'level', threshold: 10, reward: 300, name: 'Journeyman', icon: '🌳', celebration: 'confetti' },
      { id: 'level_20', type: 'level', threshold: 20, reward: 600, name: 'Expert', icon: '🌲', celebration: 'fireworks' },
      { id: 'level_50', type: 'level', threshold: 50, reward: 2000, name: 'Master', icon: '🏔️', celebration: 'epic' },

      // Streak Milestones
      { id: 'streak_25', type: 'streak', threshold: 25, reward: 500, name: 'Streak Master', icon: '🔥', celebration: 'confetti' },
      { id: 'streak_50', type: 'streak', threshold: 50, reward: 1000, name: 'Unstoppable', icon: '💥', celebration: 'fireworks' },
      { id: 'streak_100', type: 'streak', threshold: 100, reward: 2500, name: 'Perfect Focus', icon: '🌟', celebration: 'epic' }
    ];
  }

  // ═══════════════════════════════════════════════════════════════
  // PASS 4: STUDY STREAK CALENDAR
  // ═══════════════════════════════════════════════════════════════

  recordStudyDay() {
    const today = this.getTodayKey();
    if (!this.persistence.data.studyCalendar) {
      this.persistence.data.studyCalendar = {
        days: [],
        currentDayStreak: 0,
        longestDayStreak: 0,
        totalStudyDays: 0
      };
    }

    const calendar = this.persistence.data.studyCalendar;

    if (!calendar.days.includes(today)) {
      calendar.days.push(today);
      calendar.totalStudyDays++;

      // Check if consecutive day
      const yesterday = this.getDateKey(-1);
      if (calendar.days.includes(yesterday)) {
        calendar.currentDayStreak++;
      } else {
        calendar.currentDayStreak = 1;
      }

      if (calendar.currentDayStreak > calendar.longestDayStreak) {
        calendar.longestDayStreak = calendar.currentDayStreak;
      }

      this.persistence.save();
      return {
        newDay: true,
        dayStreak: calendar.currentDayStreak,
        isNewBest: calendar.currentDayStreak === calendar.longestDayStreak
      };
    }

    return { newDay: false, dayStreak: calendar.currentDayStreak };
  }

  getDateKey(offset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  }

  getCalendarStats() {
    const calendar = this.persistence.data.studyCalendar || {
      days: [],
      currentDayStreak: 0,
      longestDayStreak: 0,
      totalStudyDays: 0
    };

    // Get last 30 days activity
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const dateKey = this.getDateKey(-i);
      last30Days.push({
        date: dateKey,
        studied: calendar.days.includes(dateKey)
      });
    }

    // Check current streak validity
    const today = this.getTodayKey();
    const yesterday = this.getDateKey(-1);
    const hasStudiedRecently = calendar.days.includes(today) || calendar.days.includes(yesterday);

    return {
      currentStreak: hasStudiedRecently ? calendar.currentDayStreak : 0,
      longestStreak: calendar.longestDayStreak,
      totalDays: calendar.totalStudyDays,
      last30Days,
      studiedToday: calendar.days.includes(today)
    };
  }

  getDayStreakBonus() {
    const calendar = this.persistence.data.studyCalendar;
    if (!calendar) return 1;

    const streak = calendar.currentDayStreak;
    // Bonus XP multiplier for daily streaks
    if (streak >= 30) return 1.5;
    if (streak >= 14) return 1.3;
    if (streak >= 7) return 1.2;
    if (streak >= 3) return 1.1;
    return 1;
  }

  // ═══════════════════════════════════════════════════════════════
  // PASS 5: MASTERY TIERS
  // ═══════════════════════════════════════════════════════════════

  getMasteryTier(masteryPercent) {
    if (masteryPercent >= 95) return { tier: 'diamond', name: 'Diamond', icon: '💎', color: '#b9f2ff' };
    if (masteryPercent >= 85) return { tier: 'platinum', name: 'Platinum', icon: '⚪', color: '#e5e4e2' };
    if (masteryPercent >= 70) return { tier: 'gold', name: 'Gold', icon: '🥇', color: '#ffd700' };
    if (masteryPercent >= 50) return { tier: 'silver', name: 'Silver', icon: '🥈', color: '#c0c0c0' };
    if (masteryPercent >= 25) return { tier: 'bronze', name: 'Bronze', icon: '🥉', color: '#cd7f32' };
    return { tier: 'unranked', name: 'Unranked', icon: '📚', color: '#888' };
  }

  getCategoryMasteryTiers() {
    const categories = this.persistence.getAllCategoryProgress();
    const tiers = {};

    for (const [catKey, catData] of Object.entries(categories)) {
      tiers[catKey] = {
        ...catData,
        tier: this.getMasteryTier(catData.mastery)
      };
    }

    return tiers;
  }

  checkMasteryTierUp(categoryKey, oldMastery, newMastery) {
    const oldTier = this.getMasteryTier(oldMastery);
    const newTier = this.getMasteryTier(newMastery);

    if (newTier.tier !== oldTier.tier && this.getTierRank(newTier.tier) > this.getTierRank(oldTier.tier)) {
      return {
        tieredUp: true,
        oldTier,
        newTier,
        category: categoryKey
      };
    }

    return { tieredUp: false };
  }

  getTierRank(tier) {
    const ranks = { unranked: 0, bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
    return ranks[tier] || 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // PASS 6: SOUND & HAPTIC HOOKS
  // ═══════════════════════════════════════════════════════════════

  registerSoundHook(event, callback) {
    if (this.soundHooks[event]) {
      this.soundHooks[event].push(callback);
    }
  }

  triggerHook(event, data = null) {
    if (this.soundHooks[event]) {
      for (const callback of this.soundHooks[event]) {
        try {
          callback(data);
        } catch (e) {
          console.warn(`Sound hook error for ${event}:`, e);
        }
      }
    }
  }

  // Haptic feedback triggers (for mobile)
  getHapticPattern(event) {
    const patterns = {
      correct: [10],              // Light tap
      wrong: [20, 50, 20],        // Double tap
      combo: [10, 30, 10, 30, 10], // Triple pulse
      levelUp: [50, 100, 50],     // Strong pulse
      achievement: [30, 50, 30, 50, 30], // Celebration pattern
      luckyStrike: [20, 30, 20, 30, 50], // Exciting pattern
      milestone: [50, 100, 50, 100, 100] // Big celebration
    };
    return patterns[event] || [10];
  }

  // ═══════════════════════════════════════════════════════════════
  // PASS 7: SEASONAL EVENTS
  // ═══════════════════════════════════════════════════════════════

  getActiveSeasonalEvent() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // Define seasonal events
    const events = [
      {
        id: 'new_year',
        name: 'New Year Sprint',
        desc: 'Start the year strong!',
        start: { month: 1, day: 1 },
        end: { month: 1, day: 7 },
        xpBonus: 1.5,
        theme: 'fireworks',
        icon: '🎆'
      },
      {
        id: 'valentines',
        name: 'Heart of Knowledge',
        desc: 'Love learning!',
        start: { month: 2, day: 12 },
        end: { month: 2, day: 16 },
        xpBonus: 1.25,
        theme: 'hearts',
        icon: '💕'
      },
      {
        id: 'spring',
        name: 'Spring Revival',
        desc: 'Knowledge blooms!',
        start: { month: 3, day: 20 },
        end: { month: 3, day: 27 },
        xpBonus: 1.3,
        theme: 'flowers',
        icon: '🌸'
      },
      {
        id: 'summer',
        name: 'Summer Study',
        desc: 'Beat the heat with knowledge!',
        start: { month: 6, day: 21 },
        end: { month: 6, day: 28 },
        xpBonus: 1.3,
        theme: 'sunny',
        icon: '☀️'
      },
      {
        id: 'back_to_school',
        name: 'Back to School',
        desc: 'Fresh start energy!',
        start: { month: 8, day: 25 },
        end: { month: 9, day: 7 },
        xpBonus: 1.5,
        theme: 'school',
        icon: '🎒'
      },
      {
        id: 'halloween',
        name: 'Spooky Scholar',
        desc: 'Frighteningly smart!',
        start: { month: 10, day: 25 },
        end: { month: 11, day: 1 },
        xpBonus: 1.3,
        theme: 'spooky',
        icon: '🎃'
      },
      {
        id: 'thanksgiving',
        name: 'Grateful Gains',
        desc: 'Thankful for knowledge!',
        start: { month: 11, day: 20 },
        end: { month: 11, day: 28 },
        xpBonus: 1.25,
        theme: 'autumn',
        icon: '🦃'
      },
      {
        id: 'winter',
        name: 'Winter Wisdom',
        desc: 'Cozy up with learning!',
        start: { month: 12, day: 15 },
        end: { month: 12, day: 31 },
        xpBonus: 1.4,
        theme: 'winter',
        icon: '❄️'
      },
      // Weekend events
      {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        desc: 'Double down on weekends!',
        isWeekend: true,
        xpBonus: 1.2,
        theme: 'weekend',
        icon: '⚔️'
      }
    ];

    // Check for active event
    for (const event of events) {
      if (event.isWeekend) {
        const dayOfWeek = now.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return event;
        }
      } else if (this.isDateInRange(month, day, event.start, event.end)) {
        return event;
      }
    }

    return null;
  }

  isDateInRange(month, day, start, end) {
    const current = month * 100 + day;
    const startNum = start.month * 100 + start.day;
    const endNum = end.month * 100 + end.day;

    if (startNum <= endNum) {
      return current >= startNum && current <= endNum;
    } else {
      // Wraps around year (e.g., Dec 25 - Jan 5)
      return current >= startNum || current <= endNum;
    }
  }

  getSeasonalXPBonus() {
    const event = this.getActiveSeasonalEvent();
    return event ? event.xpBonus : 1;
  }

  // XP Calculation - Enhanced with all 7 passes
  calculateXP(options) {
    const {
      wasCorrectFirstTry,
      completedWarmups,
      isRevengeQuestion,
      exploredWrongFirst
    } = options;

    let baseXP = 0;
    let breakdown = [];

    if (wasCorrectFirstTry && !exploredWrongFirst) {
      baseXP = 100;
      breakdown.push({ label: 'Correct Answer', value: 100 });
    } else if (wasCorrectFirstTry) {
      baseXP = 50;
      breakdown.push({ label: 'Correct (after exploration)', value: 50 });
    }

    // Warmup bonus
    if (completedWarmups) {
      baseXP += 25;
      breakdown.push({ label: 'Warmup Completion', value: 25 });
    }

    // Revenge bonus (previously wrong question)
    if (isRevengeQuestion && wasCorrectFirstTry) {
      const revengeBonus = 50;
      baseXP += revengeBonus;
      breakdown.push({ label: 'Revenge Bonus', value: revengeBonus });
    }

    // Streak multiplier
    const streak = this.persistence.getStreak();
    let streakMultiplier = 1;
    if (streak > 0) {
      streakMultiplier = Math.min(1 + (streak * 0.1), 2.0); // Max 2x at 10+ streak
      if (streakMultiplier > 1) {
        const streakBonus = Math.round(baseXP * (streakMultiplier - 1));
        breakdown.push({ label: `Streak x${streak}`, value: streakBonus });
      }
    }

    // Apply streak multiplier first
    let totalXP = Math.round(baseXP * streakMultiplier);

    // PASS 2: Combo multiplier (fast consecutive answers)
    const comboMultiplier = this.getComboMultiplier();
    if (comboMultiplier > 1) {
      const comboBonus = Math.round(totalXP * (comboMultiplier - 1));
      breakdown.push({ label: `Combo x${this.comboState.count}`, value: comboBonus });
      totalXP = Math.round(totalXP * comboMultiplier);
    }

    // PASS 4: Daily streak bonus
    const dayStreakBonus = this.getDayStreakBonus();
    if (dayStreakBonus > 1) {
      const dayBonus = Math.round(totalXP * (dayStreakBonus - 1));
      const calendar = this.persistence.data.studyCalendar;
      breakdown.push({ label: `${calendar?.currentDayStreak || 0}-Day Streak`, value: dayBonus });
      totalXP = Math.round(totalXP * dayStreakBonus);
    }

    // PASS 7: Seasonal event bonus
    const seasonalEvent = this.getActiveSeasonalEvent();
    if (seasonalEvent) {
      const seasonalBonus = Math.round(totalXP * (seasonalEvent.xpBonus - 1));
      if (seasonalBonus > 0) {
        breakdown.push({ label: `${seasonalEvent.icon} ${seasonalEvent.name}`, value: seasonalBonus });
        totalXP = Math.round(totalXP * seasonalEvent.xpBonus);
      }
    }

    // Lucky Strike (variable ratio reinforcement) - doubles total XP
    let isLuckyStrike = false;
    if (wasCorrectFirstTry && Math.random() < this.luckyStrikeChance) {
      isLuckyStrike = true;
      const luckyBonus = totalXP; // Double the total
      breakdown.push({ label: '⚡ Lucky Strike!', value: luckyBonus });
      totalXP *= 2;
      this.triggerHook('onLuckyStrike', { bonus: luckyBonus });
    }

    return {
      total: totalXP,
      breakdown,
      isLuckyStrike,
      streakMultiplier,
      comboMultiplier,
      seasonalEvent
    };
  }

  // Process a correct answer - Enhanced with all passes
  processCorrectAnswer(questionId, options = {}) {
    const {
      completedWarmups = false,
      exploredWrongFirst = false,
      categoryKey = null
    } = options;

    const wasFirstTry = !exploredWrongFirst;
    const isRevengeQuestion = this.persistence.wasQuestionPreviouslyWrong(questionId);

    // PASS 2: Update combo state
    const combo = this.updateCombo(true);
    const comboMessage = this.getComboMessage();

    // PASS 4: Record study day
    const studyDayResult = this.recordStudyDay();

    // Calculate and add XP (includes all bonuses from passes 2, 4, 7)
    const xpResult = this.calculateXP({
      wasCorrectFirstTry: wasFirstTry,
      completedWarmups,
      isRevengeQuestion,
      exploredWrongFirst
    });

    this.persistence.addXP(xpResult.total);

    // Update streak
    if (wasFirstTry) {
      this.persistence.incrementStreak();
    }

    // Record question
    this.persistence.recordQuestion(questionId, wasFirstTry);

    // PASS 5: Check for mastery tier-up
    let tierUp = null;
    if (categoryKey) {
      const oldProgress = this.persistence.getCategoryProgress(categoryKey);
      const oldMastery = oldProgress.mastery;
      // Category progress will be updated elsewhere, but we track for tier changes
      tierUp = { oldMastery, categoryKey };
    }

    // Check for achievements
    const newAchievements = this.checkAchievements();

    // PASS 3: Check for milestones
    const newMilestones = this.checkMilestones();

    // PASS 1: Check daily challenges
    const sessionStats = this.getSessionStatsForChallenges();
    const dailyChallengesCompleted = this.checkDailyChallenges(sessionStats);

    // Check for level up
    const oldLevel = this.persistence.getPlayer().level;
    const levelProgress = this.persistence.getLevelProgress();
    const newLevel = this.persistence.getPlayer().level;
    const leveledUp = newLevel > oldLevel;

    // PASS 6: Trigger sound hooks
    this.triggerHook('onCorrect', { xp: xpResult.total, combo, wasFirstTry });
    if (leveledUp) {
      this.triggerHook('onLevelUp', { oldLevel, newLevel });
    }
    if (newAchievements.length > 0) {
      this.triggerHook('onAchievement', newAchievements);
    }

    return {
      xp: xpResult,
      streak: this.persistence.getStreak(),
      combo,
      comboMessage,
      newAchievements,
      newMilestones,
      dailyChallengesCompleted,
      levelProgress,
      leveledUp,
      newLevel: leveledUp ? newLevel : null,
      isRevenge: isRevengeQuestion && wasFirstTry,
      studyDayResult,
      seasonalEvent: xpResult.seasonalEvent,
      tierUp,
      player: this.persistence.getPlayer()
    };
  }

  // Process a wrong first answer (breaks streak and combo)
  processWrongAnswer(questionId) {
    const brokenStreak = this.persistence.breakStreak();
    this.persistence.recordQuestion(questionId, false);

    // PASS 2: Break combo
    const brokenCombo = this.comboState.count;
    this.updateCombo(false);

    // PASS 6: Trigger sound hook
    this.triggerHook('onWrong', { brokenStreak, brokenCombo });

    return {
      streakBroken: brokenStreak > 0,
      previousStreak: brokenStreak,
      comboBroken: brokenCombo > 0,
      previousCombo: brokenCombo
    };
  }

  // Helper to get session stats for daily challenge checking
  getSessionStatsForChallenges() {
    const session = this.persistence.getSession();
    const player = this.persistence.getPlayer();

    // Count categories answered today
    const today = this.getTodayKey();
    const categoriesAnswered = new Set();
    let revengeCount = 0;
    let firstTryStreak = 0;
    let currentFirstTryStreak = 0;

    for (const [qId, history] of Object.entries(this.persistence.data.questionHistory)) {
      if (history.lastSeen && history.lastSeen.startsWith(today)) {
        // Extract category from question ID (e.g., "100.1.01" -> "100")
        const catParts = qId.split('.');
        if (catParts.length >= 1) {
          categoriesAnswered.add(catParts[0]);
        }
      }
    }

    return {
      questionsToday: session.questionsAnswered,
      accuracyToday: session.questionsAnswered > 0 ?
        Math.round((session.correctFirstTry / session.questionsAnswered) * 100) : 0,
      firstTryStreak: player.currentStreak, // Using answer streak as proxy
      revengeCount: revengeCount,
      categoriesAnswered: categoriesAnswered.size
    };
  }

  // Achievement Checking
  checkAchievements() {
    const unlocked = [];
    const player = this.persistence.getPlayer();

    for (const achievement of this.achievements) {
      if (this.persistence.hasAchievement(achievement.id)) continue;

      let earned = false;

      switch (achievement.type) {
        case 'questions_answered':
          earned = player.totalAnswered >= achievement.threshold;
          break;

        case 'streak':
          earned = player.currentStreak >= achievement.threshold;
          break;

        case 'best_streak':
          earned = player.bestStreak >= achievement.threshold;
          break;

        case 'level':
          earned = player.level >= achievement.threshold;
          break;

        case 'category_mastery':
          const categories = this.persistence.getAllCategoryProgress();
          for (const cat of Object.values(categories)) {
            if (cat.mastery >= achievement.threshold) {
              earned = true;
              break;
            }
          }
          break;

        case 'time_of_day':
          const hour = this.persistence.getCurrentHour();
          if (achievement.condition === 'night_owl') {
            earned = hour >= 22 || hour < 4;
          } else if (achievement.condition === 'early_bird') {
            earned = hour >= 5 && hour < 7;
          }
          break;

        case 'sessions':
          earned = player.sessionsCompleted >= achievement.threshold;
          break;

        case 'total_xp':
          earned = player.totalXP >= achievement.threshold;
          break;

        case 'accuracy':
          if (player.totalAnswered >= 10) {
            const accuracy = (player.totalCorrectFirstTry / player.totalAnswered) * 100;
            earned = accuracy >= achievement.threshold;
          }
          break;

        case 'first_question':
          earned = player.totalAnswered >= 1;
          break;
      }

      if (earned) {
        this.persistence.unlockAchievement(achievement.id);
        unlocked.push(achievement);
      }
    }

    return unlocked;
  }

  // Get current stats for display - Enhanced
  getStats() {
    const player = this.persistence.getPlayer();
    const levelProgress = this.persistence.getLevelProgress();
    const calendarStats = this.getCalendarStats();
    const dailyChallenges = this.getDailyChallenges();
    const seasonalEvent = this.getActiveSeasonalEvent();
    const masteryTiers = this.getCategoryMasteryTiers();

    // Count tiers
    const tierCounts = { diamond: 0, platinum: 0, gold: 0, silver: 0, bronze: 0, unranked: 0 };
    for (const cat of Object.values(masteryTiers)) {
      if (cat.tier) tierCounts[cat.tier.tier]++;
    }

    return {
      // Basic stats
      level: player.level,
      totalXP: player.totalXP,
      levelProgress,
      currentStreak: player.currentStreak,
      bestStreak: player.bestStreak,
      totalAnswered: player.totalAnswered,
      accuracy: player.totalAnswered > 0 ?
        Math.round((player.totalCorrectFirstTry / player.totalAnswered) * 100) : 0,
      achievements: player.achievements.length,

      // PASS 2: Combo stats
      currentCombo: this.comboState.count,
      maxComboToday: this.comboState.maxCombo,

      // PASS 1: Daily challenges
      dailyChallenges: {
        challenges: dailyChallenges.challenges || [],
        completed: dailyChallenges.completed || [],
        allComplete: (dailyChallenges.completed || []).length >= 3,
        bonusClaimed: dailyChallenges.bonusClaimed || false
      },

      // PASS 3: Milestones
      milestonesUnlocked: (this.persistence.data.milestones || []).length,
      totalMilestones: this.getMilestoneDefinitions().length,

      // PASS 4: Calendar/day streak
      dayStreak: calendarStats.currentStreak,
      longestDayStreak: calendarStats.longestStreak,
      totalStudyDays: calendarStats.totalDays,
      studiedToday: calendarStats.studiedToday,
      last30Days: calendarStats.last30Days,

      // PASS 5: Mastery tiers
      masteryTiers,
      tierCounts,

      // PASS 7: Seasonal event
      seasonalEvent
    };
  }

  // Get Ms. Luminara's dynamic message based on state
  getStreakMessage(streak) {
    if (streak === 0) return null;

    const messages = {
      1: ["A spark ignites...", "The journey begins..."],
      2: ["Warming up nicely...", "I see potential..."],
      3: ["Now you're getting somewhere...", "My attention is caught..."],
      5: ["Five in a row... you're making me blush.", "Impressive dedication..."],
      7: ["Seven! The magic number...", "You're on fire now..."],
      10: ["Unstoppable. I do love watching you work.", "Ten! Such focus..."],
      15: ["Fifteen consecutive victories... remarkable.", "You've truly captured my interest now."],
      20: ["Twenty! I'm genuinely impressed.", "Such mastery deserves recognition..."],
      25: ["Twenty-five... you're becoming legendary.", "I may have underestimated you."]
    };

    // Find the highest matching threshold
    const thresholds = Object.keys(messages).map(Number).sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (streak >= threshold) {
        const pool = messages[threshold];
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }

    return null;
  }

  getEncouragementMessage() {
    const messages = [
      "Every wrong answer teaches something right...",
      "The path to mastery winds through failure.",
      "I admire persistence over perfection.",
      "Reset, refocus, try again...",
      "Even the brightest minds stumble.",
      "Learning requires courage to be wrong."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  getLuckyStrikeMessage() {
    const messages = [
      "Lucky Strike! Fortune favors the bold...",
      "The stars align! Double XP awarded.",
      "A surge of brilliance! Lucky Strike!",
      "Fate smiles upon you... Lucky Strike!",
      "Serendipity strikes! Bonus XP flows..."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  getRevengeMessage() {
    const messages = [
      "Redemption tastes sweet, doesn't it?",
      "You've conquered what once conquered you.",
      "Revenge is a dish best served with knowledge.",
      "The student returns victorious...",
      "What was once weakness is now strength."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // PASS 3: Milestone messages
  getMilestoneMessage(milestone) {
    const templates = [
      `🎉 ${milestone.name} unlocked!`,
      `✨ Milestone reached: ${milestone.name}!`,
      `🏆 You've achieved ${milestone.name}!`,
      `${milestone.icon} ${milestone.name} - What a journey!`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // PASS 4: Day streak messages
  getDayStreakMessage(dayStreak) {
    if (dayStreak <= 1) return null;

    const messages = {
      3: ["Three days running! Building momentum...", "A habit forms in the shadows..."],
      7: ["A full week! Your dedication is showing.", "Seven days of wisdom..."],
      14: ["Two weeks strong! You're unstoppable.", "Half a month of growth..."],
      30: ["A month! Legendary consistency.", "Thirty days of brilliance..."],
      60: ["Two months! Scholar of the ages.", "Sixty sunrises of study..."],
      100: ["ONE HUNDRED DAYS! I bow to your dedication.", "A century of learning..."]
    };

    const thresholds = Object.keys(messages).map(Number).sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (dayStreak >= threshold) {
        const pool = messages[threshold];
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }

    return null;
  }

  // PASS 5: Tier-up messages
  getTierUpMessage(oldTier, newTier, category) {
    const messages = [
      `⬆️ ${category}: ${oldTier.icon} → ${newTier.icon} ${newTier.name}!`,
      `🎖️ ${newTier.name} tier achieved in ${category}!`,
      `${newTier.icon} Rising through the ranks in ${category}!`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // PASS 7: Seasonal event messages
  getSeasonalWelcome(event) {
    if (!event) return null;

    const messages = [
      `${event.icon} ${event.name} is LIVE! ${event.desc} (+${Math.round((event.xpBonus - 1) * 100)}% XP)`,
      `${event.icon} Special Event: ${event.name}! Bonus XP awaits...`,
      `It's ${event.name} season! ${event.icon} Earn ${Math.round((event.xpBonus - 1) * 100)}% extra XP!`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // PASS 1: Daily challenge complete message
  getDailyChallengeMessage(challenge) {
    return `${challenge.icon} ${challenge.name} complete! +${challenge.xp} XP`;
  }

  // Level up messages - Enhanced
  getLevelUpMessage(newLevel) {
    const messages = [
      `⭐ Level ${newLevel}! Your brilliance grows...`,
      `📈 You've reached Level ${newLevel}!`,
      `🌟 Level Up! Welcome to Level ${newLevel}!`,
      `✨ Ascending to Level ${newLevel}...`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Title based on level
  getTitle(level) {
    if (level >= 100) return { name: 'Luminara\'s Equal', icon: '👑' };
    if (level >= 75) return { name: 'Legendary Scholar', icon: '🌟' };
    if (level >= 50) return { name: 'Grand Master', icon: '🏆' };
    if (level >= 40) return { name: 'Master', icon: '🎓' };
    if (level >= 30) return { name: 'Expert', icon: '💎' };
    if (level >= 20) return { name: 'Adept', icon: '📚' };
    if (level >= 15) return { name: 'Journeyman', icon: '📖' };
    if (level >= 10) return { name: 'Apprentice', icon: '🌿' };
    if (level >= 5) return { name: 'Student', icon: '🌱' };
    return { name: 'Novice', icon: '🔰' };
  }

  // Get comprehensive session summary
  getEnhancedSessionSummary() {
    const basic = this.persistence.getSessionSummary();
    const stats = this.getStats();

    return {
      ...basic,
      comboMax: this.comboState.maxCombo,
      dailyChallengesCompleted: stats.dailyChallenges.completed.length,
      dailyChallengesTotal: 3,
      dayStreak: stats.dayStreak,
      seasonalEvent: stats.seasonalEvent,
      title: this.getTitle(stats.level)
    };
  }

  // Reset combo (call at session start or after timeout)
  resetCombo() {
    this.comboState.count = 0;
    this.comboState.maxCombo = 0;
    this.comboState.lastAnswerTime = 0;
  }

  // Check if combo is still active
  isComboActive() {
    if (this.comboState.count < 2) return false;
    const elapsed = Date.now() - this.comboState.lastAnswerTime;
    return elapsed < this.comboState.comboWindow;
  }

  // Get time remaining in combo window (for UI countdown)
  getComboTimeRemaining() {
    if (!this.isComboActive()) return 0;
    const elapsed = Date.now() - this.comboState.lastAnswerTime;
    return Math.max(0, this.comboState.comboWindow - elapsed);
  }
}

// Export (will be instantiated after achievements load)
let gamification = null;
