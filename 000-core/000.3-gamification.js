/**
 * Ms. Luminara Quiz - Gamification Engine
 * Handles XP calculations, streaks, achievements, and variable reinforcement
 */

class GamificationEngine {
  constructor(persistenceManager, achievementData) {
    this.persistence = persistenceManager;
    this.achievements = achievementData;
    this.pendingNotifications = [];
    this.luckyStrikeChance = 0.10; // 10% chance
  }

  // XP Calculation
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

    // Lucky Strike (variable ratio reinforcement) - doubles total XP
    let isLuckyStrike = false;
    if (wasCorrectFirstTry && Math.random() < this.luckyStrikeChance) {
      isLuckyStrike = true;
      const luckyBonus = totalXP; // Double the total
      breakdown.push({ label: 'Lucky Strike!', value: luckyBonus });
      totalXP *= 2;
    }

    return {
      total: totalXP,
      breakdown,
      isLuckyStrike,
      streakMultiplier
    };
  }

  // Process a correct answer
  processCorrectAnswer(questionId, options = {}) {
    const {
      completedWarmups = false,
      exploredWrongFirst = false
    } = options;

    const wasFirstTry = !exploredWrongFirst;
    const isRevengeQuestion = this.persistence.wasQuestionPreviouslyWrong(questionId);

    // Calculate and add XP
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

    // Check for achievements
    const newAchievements = this.checkAchievements();

    // Check for level up
    const levelProgress = this.persistence.getLevelProgress();

    return {
      xp: xpResult,
      streak: this.persistence.getStreak(),
      newAchievements,
      levelProgress,
      isRevenge: isRevengeQuestion && wasFirstTry,
      player: this.persistence.getPlayer()
    };
  }

  // Process a wrong first answer (breaks streak)
  processWrongAnswer(questionId) {
    const brokenStreak = this.persistence.breakStreak();
    this.persistence.recordQuestion(questionId, false);

    return {
      streakBroken: brokenStreak > 0,
      previousStreak: brokenStreak
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

  // Get current stats for display
  getStats() {
    const player = this.persistence.getPlayer();
    const levelProgress = this.persistence.getLevelProgress();

    return {
      level: player.level,
      totalXP: player.totalXP,
      levelProgress,
      currentStreak: player.currentStreak,
      bestStreak: player.bestStreak,
      totalAnswered: player.totalAnswered,
      accuracy: player.totalAnswered > 0 ?
        Math.round((player.totalCorrectFirstTry / player.totalAnswered) * 100) : 0,
      achievements: player.achievements.length
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
}

// Export (will be instantiated after achievements load)
let gamification = null;
