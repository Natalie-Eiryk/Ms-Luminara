/**
 * Ms. Luminara Quiz Renderer
 * Handles rendering of questions, warmups, exploration panels, and gamification UI
 */

class QuizRenderer {
  constructor(quiz) {
    this.quiz = quiz;
    this.notificationQueue = [];
    this.isShowingNotification = false;
  }

  /**
   * Render the stats bar (XP, Level, Streak, Character)
   */
  renderStatsBar() {
    const container = document.getElementById('statsBar');
    if (!container || !gamification) return;

    const stats = gamification.getStats();
    const levelProgress = stats.levelProgress;
    const charMini = this.renderCharacterMini();

    container.innerHTML = `
      <div class="stat-item">
        <span class="level-badge">LV ${stats.level}</span>
      </div>
      <div class="xp-container">
        <div class="xp-bar">
          <div class="xp-fill" style="width: ${levelProgress.percentage}%"></div>
        </div>
        <div class="xp-text">${levelProgress.current} / ${levelProgress.needed} XP</div>
      </div>
      <div class="streak-counter ${stats.currentStreak > 0 ? 'active' : ''}">
        <span class="fire">${stats.currentStreak > 0 ? '🔥' : '💨'}</span>
        <span class="count">${stats.currentStreak}</span>
      </div>
      ${charMini}
    `;
  }

  /**
   * Show XP popup after correct answer
   */
  showXPPopup(xpResult, streakMessage, isRevenge) {
    const existing = document.querySelector('.xp-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.className = 'xp-popup';

    let breakdownHTML = xpResult.breakdown.map(item => `
      <div class="breakdown-item">
        <span>${item.label}</span>
        <span class="value">+${item.value}</span>
      </div>
    `).join('');

    let luckyHTML = '';
    if (xpResult.isLuckyStrike) {
      luckyHTML = `<div class="lucky-strike">${gamification.getLuckyStrikeMessage()}</div>`;
    }

    let revengeHTML = '';
    if (isRevenge) {
      revengeHTML = `<div class="message" style="color: var(--explore);">${gamification.getRevengeMessage()}</div>`;
    }

    let streakHTML = '';
    if (streakMessage) {
      streakHTML = `<div class="message">"${streakMessage}"</div>`;
    }

    popup.innerHTML = `
      <div class="total">+${xpResult.total} XP</div>
      <div class="breakdown">${breakdownHTML}</div>
      ${luckyHTML}
      ${revengeHTML}
      ${streakHTML}
    `;

    document.body.appendChild(popup);

    // Auto-dismiss after delay
    setTimeout(() => {
      popup.classList.add('hiding');
      setTimeout(() => popup.remove(), 300);
    }, xpResult.isLuckyStrike ? 3000 : 2000);
  }

  /**
   * Show achievement notification
   */
  showAchievement(achievement) {
    this.notificationQueue.push(achievement);
    this.processNotificationQueue();
  }

  processNotificationQueue() {
    if (this.isShowingNotification || this.notificationQueue.length === 0) return;

    this.isShowingNotification = true;
    const achievement = this.notificationQueue.shift();

    // Speak achievement with voice system
    if (typeof voiceSystem !== 'undefined' && voiceSystem) {
      voiceSystem.speakAchievement(`Achievement unlocked: ${achievement.name}. ${achievement.luminara}`);
    }

    const notification = document.createElement('div');
    notification.className = 'achievement-notification';

    const iconMap = {
      'footprints': '👣', 'zap': '⚡', 'brain': '🧠', 'crown': '👑',
      'flame': '🔥', 'fire': '🔥', 'meteor': '☄️', 'star': '⭐',
      'trophy': '🏆', 'moon': '🌙', 'sunrise': '🌅', 'graduation': '🎓',
      'book': '📚', 'gem': '💎', 'diamond': '💠', 'target': '🎯',
      'sparkles': '✨', 'calendar': '📅', 'heart': '❤️'
    };

    notification.innerHTML = `
      <div class="badge-icon">${iconMap[achievement.icon] || '🏅'}</div>
      <div class="content">
        <div class="title">Achievement Unlocked</div>
        <div class="name">${achievement.name}</div>
        <div class="message">"${achievement.luminara}"</div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('hiding');
      setTimeout(() => {
        notification.remove();
        this.isShowingNotification = false;
        this.processNotificationQueue();
      }, 400);
    }, 4000);
  }

  /**
   * Show streak broken message
   */
  showStreakBroken(previousStreak) {
    if (previousStreak < 2) return; // Only show if streak was notable

    const message = document.createElement('div');
    message.className = 'streak-broken';

    message.innerHTML = `
      <div class="icon">💔</div>
      <div class="text">Streak of ${previousStreak} broken</div>
      <div class="message">"${gamification.getEncouragementMessage()}"</div>
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      message.style.opacity = '0';
      setTimeout(() => message.remove(), 300);
    }, 2500);
  }

  /**
   * Show level up celebration
   */
  showLevelUp(newLevel) {
    const overlay = document.createElement('div');
    overlay.className = 'level-up-overlay';

    const messages = [
      "Your dedication is... intoxicating.",
      "Higher and higher you climb...",
      "I knew you had it in you.",
      "The ascent continues. Beautiful.",
      "Another peak conquered together."
    ];

    // Speak level up with voice system
    const levelUpMessage = messages[Math.floor(Math.random() * messages.length)];
    if (typeof voiceSystem !== 'undefined' && voiceSystem) {
      voiceSystem.speakAchievement(`Level up! You're now level ${newLevel}. ${levelUpMessage}`);
    }

    overlay.innerHTML = `
      <div class="level-up-card">
        <div class="stars">✨ 🌟 ✨</div>
        <div class="title">Level Up!</div>
        <div class="level">${newLevel}</div>
        <div class="message">"${messages[Math.floor(Math.random() * messages.length)]}"</div>
        <button class="dismiss" onclick="this.closest('.level-up-overlay').remove()">Continue</button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Show session summary
   */
  showSessionSummary(summary, achievements) {
    const overlay = document.createElement('div');
    overlay.className = 'session-summary';

    const closingMessages = [
      "Until next time... I'll be waiting.",
      "You've done well. Come back soon.",
      "The knowledge you've gained is yours forever.",
      "Rest now. The neurons need time to strengthen.",
      "What we've built together is beautiful."
    ];

    let achievementsHTML = '';
    if (summary.achievementsUnlocked.length > 0) {
      const badgesList = achievements
        .filter(a => summary.achievementsUnlocked.includes(a.id))
        .map(a => {
          const iconMap = {
            'footprints': '👣', 'zap': '⚡', 'brain': '🧠', 'crown': '👑',
            'flame': '🔥', 'fire': '🔥', 'meteor': '☄️', 'star': '⭐',
            'trophy': '🏆', 'moon': '🌙', 'sunrise': '🌅', 'graduation': '🎓',
            'book': '📚', 'gem': '💎', 'diamond': '💠', 'target': '🎯',
            'sparkles': '✨', 'calendar': '📅', 'heart': '❤️'
          };
          return `<div class="summary-badge"><span class="icon">${iconMap[a.icon] || '🏅'}</span><span class="name">${a.name}</span></div>`;
        }).join('');

      achievementsHTML = `
        <div class="summary-achievements">
          <h3>Achievements Unlocked</h3>
          ${badgesList}
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="summary-card">
        <h2>Session Complete</h2>
        <div class="summary-stats">
          <div class="summary-stat">
            <div class="value">+${summary.xpEarned}</div>
            <div class="label">XP Earned</div>
          </div>
          <div class="summary-stat">
            <div class="value">${summary.questionsAnswered}</div>
            <div class="label">Questions</div>
          </div>
          <div class="summary-stat">
            <div class="value">${summary.accuracy}%</div>
            <div class="label">Accuracy</div>
          </div>
          <div class="summary-stat">
            <div class="value">${summary.bestStreak}</div>
            <div class="label">Best Streak</div>
          </div>
        </div>
        ${achievementsHTML}
        <div class="summary-message">
          "${closingMessages[Math.floor(Math.random() * closingMessages.length)]}"<br>
          <span style="font-size: 0.85rem; color: var(--glow-warm);">— Ms. Luminara</span>
        </div>
        <div class="summary-actions">
          <button class="home" onclick="closeSummaryAndGoHome()">Back to Topics</button>
          <button class="continue" onclick="closeSummaryAndContinue()">Continue Studying</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Render landing page stats preview
   */
  renderLandingStats() {
    const container = document.getElementById('landingStats');
    if (!container || !gamification) return;

    const stats = gamification.getStats();

    container.innerHTML = `
      <div class="landing-stat">
        <div class="value">LV ${stats.level}</div>
        <div class="label">Level</div>
      </div>
      <div class="landing-stat">
        <div class="value">${stats.totalXP.toLocaleString()}</div>
        <div class="label">Total XP</div>
      </div>
      <div class="landing-stat">
        <div class="value">${stats.bestStreak}</div>
        <div class="label">Best Streak</div>
      </div>
      <div class="landing-stat">
        <div class="value">${stats.achievements}</div>
        <div class="label">Badges</div>
      </div>
    `;
  }

  /**
   * Render a question
   */
  render(question, currentIdx, totalQuestions, exploredOptions, phase = 'main', mainQuestionText = null) {
    const area = document.getElementById('questionArea');
    if (!area) return;

    // Update progress
    this.updateProgress(currentIdx, totalQuestions, phase);

    // Build the question card
    // Note: buildIntro() handles speaking the intro + question via speakIntroThenQuestion()
    area.innerHTML = this.buildQuestionCard(question, currentIdx, exploredOptions, phase, mainQuestionText);
  }

  /**
   * Update progress indicators
   */
  updateProgress(currentIdx, totalQuestions, phase) {
    const progressInfo = document.getElementById('progressInfo');
    const progressFill = document.getElementById('progressFill');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Show phase indicator in progress
    let phaseLabel = '';
    if (phase === 'warmup1') phaseLabel = ' (Warmup 1 of 2)';
    else if (phase === 'warmup2') phaseLabel = ' (Warmup 2 of 2)';
    else if (phase === 'main') phaseLabel = '';

    if (progressInfo) {
      progressInfo.textContent = `Question ${currentIdx + 1} of ${totalQuestions}${phaseLabel}`;
    }

    if (progressFill) {
      progressFill.style.width = ((currentIdx + 1) / totalQuestions * 100) + '%';
    }

    if (prevBtn) {
      prevBtn.disabled = currentIdx === 0 && phase === 'warmup1';
    }

    if (nextBtn) {
      nextBtn.textContent = (currentIdx === totalQuestions - 1 && phase === 'main') ? 'Finish' : 'Next →';
    }
  }

  /**
   * Build the complete question card HTML
   */
  buildQuestionCard(question, currentIdx, exploredOptions, phase, mainQuestionText) {
    const optionsHTML = this.buildOptions(question, exploredOptions);
    const introHTML = this.buildIntro(exploredOptions, phase, question.q);
    const explorationHTML = this.buildExplorationPanel(question, exploredOptions);
    const mechanismHTML = this.buildMechanismTour(question, exploredOptions);
    const warmupContextHTML = this.buildWarmupContext(phase, mainQuestionText);
    const skipButtonHTML = this.buildSkipButton(phase);

    // Determine the phase badge
    let phaseBadge = '';
    if (phase === 'warmup1') {
      phaseBadge = '<span class="phase-badge warmup">Warmup 1</span>';
    } else if (phase === 'warmup2') {
      phaseBadge = '<span class="phase-badge warmup">Warmup 2</span>';
    } else {
      phaseBadge = '<span class="phase-badge main">Main Question</span>';
    }

    return `
      <div class="question-card ${phase !== 'main' ? 'warmup-card' : ''}">
        <div class="q-header">
          <div class="q-chapter">
            ${this.escapeHtml(question.chapter || '')}
            ${this.buildRevengeIndicator(question.id)}
          </div>
          ${phaseBadge}
        </div>
        ${warmupContextHTML}
        <div class="q-text">${this.escapeHtml(question.q)}</div>
        ${introHTML}
        <div class="options">${optionsHTML}</div>
        ${skipButtonHTML}
        ${explorationHTML}
        ${mechanismHTML}
      </div>
    `;
  }

  /**
   * Build warmup context showing what main question we're building toward
   */
  buildWarmupContext(phase, mainQuestionText) {
    if (phase === 'main' || !mainQuestionText) return '';

    return `
      <div class="warmup-context">
        <div class="context-label">Building toward:</div>
        <div class="context-question">"${this.escapeHtml(mainQuestionText)}"</div>
      </div>
    `;
  }

  /**
   * Build skip button for warmups
   */
  buildSkipButton(phase) {
    if (phase === 'main') return '';

    return `
      <div class="skip-warmup">
        <button class="skip-btn" onclick="skipToMain()">
          Skip warmups → Go to main question
        </button>
      </div>
    `;
  }

  /**
   * Build revenge indicator for previously-wrong questions
   */
  buildRevengeIndicator(questionId) {
    if (!persistence || !questionId) return '';
    if (persistence.wasQuestionPreviouslyWrong(questionId)) {
      return '<span class="revenge-indicator">⚔️ Revenge</span>';
    }
    return '';
  }

  /**
   * Build scaffolding hint panel (shown when struggling)
   */
  buildScaffoldingHint(question, scaffoldAdvice) {
    if (!scaffoldAdvice || !scaffoldAdvice.shouldShowExtraHint) return '';

    const hint = scaffolding.getExtraHint(question);
    const adaptiveMsg = scaffolding.getAdaptiveMessage(scaffoldAdvice);

    return `
      <div class="scaffold-hint">
        <div class="scaffold-header">
          <span class="scaffold-icon">💡</span>
          <span class="scaffold-label">Study Tip</span>
        </div>
        <div class="scaffold-message">${adaptiveMsg.message || hint}</div>
      </div>
    `;
  }

  /**
   * Build scaffold level indicator
   */
  buildScaffoldIndicator(scaffoldAdvice) {
    if (!scaffoldAdvice) return '';

    const levelIcons = {
      'heavy': '🛟',
      'moderate': '📚',
      'light': '🚀',
      'challenge': '⚡'
    };

    const levelLabels = {
      'heavy': 'Extra Support',
      'moderate': 'Learning',
      'light': 'Progressing',
      'challenge': 'Challenge Mode'
    };

    const icon = levelIcons[scaffoldAdvice.level] || '📚';
    const label = levelLabels[scaffoldAdvice.level] || 'Learning';

    return `
      <div class="scaffold-indicator scaffold-${scaffoldAdvice.level}">
        <span class="icon">${icon}</span>
        <span class="label">${label}</span>
      </div>
    `;
  }

  /**
   * Show adaptive encouragement based on performance
   */
  showAdaptiveMessage(scaffoldAdvice) {
    if (!scaffoldAdvice) return;

    const adaptive = scaffolding.getAdaptiveMessage(scaffoldAdvice);
    if (!adaptive.message) return;

    // Don't show too frequently
    const lastShown = this._lastAdaptiveMessage || 0;
    if (Date.now() - lastShown < 30000) return;
    this._lastAdaptiveMessage = Date.now();

    const message = document.createElement('div');
    message.className = `adaptive-message adaptive-${adaptive.type}`;
    message.innerHTML = `
      <div class="adaptive-content">
        <span class="adaptive-text">"${adaptive.message}"</span>
        <span class="adaptive-speaker">— Ms. Luminara</span>
      </div>
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      message.classList.add('hiding');
      setTimeout(() => message.remove(), 500);
    }, 4000);
  }

  // ═══════════════════════════════════════════════════════════════
  // D20 RPG UI COMPONENTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Show animated dice roll
   */
  showDiceRoll(rollResult, context = '') {
    const existing = document.querySelector('.dice-roll-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'dice-roll-overlay';

    const isCrit = rollResult.isCriticalSuccess || rollResult.isCriticalFailure;
    const critClass = rollResult.isCriticalSuccess ? 'crit-success' :
                      rollResult.isCriticalFailure ? 'crit-fail' : '';

    let advantageHTML = '';
    if (rollResult.type === 'advantage') {
      advantageHTML = `<div class="roll-type advantage">Advantage (${rollResult.roll1}, ${rollResult.roll2})</div>`;
    } else if (rollResult.type === 'disadvantage') {
      advantageHTML = `<div class="roll-type disadvantage">Disadvantage (${rollResult.roll1}, ${rollResult.roll2})</div>`;
    }

    let modifierHTML = '';
    if (rollResult.modifier !== undefined) {
      const sign = rollResult.modifier >= 0 ? '+' : '';
      modifierHTML = `
        <div class="roll-modifier">
          ${sign}${rollResult.modifier} ${rollResult.stat?.toUpperCase() || ''}
        </div>
        <div class="roll-total">= ${rollResult.total}</div>
      `;
    }

    overlay.innerHTML = `
      <div class="dice-container ${critClass}">
        <div class="dice-spinning">
          <div class="d20-face">🎲</div>
        </div>
        <div class="dice-result" style="display: none;">
          <div class="roll-context">${context}</div>
          <div class="roll-value ${critClass}">${rollResult.roll}</div>
          ${advantageHTML}
          ${modifierHTML}
          ${isCrit ? `<div class="crit-message">${rollResult.isCriticalSuccess ? 'NATURAL 20!' : 'NATURAL 1!'}</div>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animate: spin → reveal
    setTimeout(() => {
      overlay.querySelector('.dice-spinning').style.display = 'none';
      overlay.querySelector('.dice-result').style.display = 'block';
    }, 1000);

    // Auto-dismiss
    setTimeout(() => {
      overlay.classList.add('hiding');
      setTimeout(() => overlay.remove(), 500);
    }, isCrit ? 3500 : 2500);

    return overlay;
  }

  /**
   * Show character sheet modal
   */
  showCharacterSheet(characterData) {
    const existing = document.querySelector('.character-sheet-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'character-sheet-overlay';

    const stats = characterData.stats;
    const formatMod = (mod) => mod >= 0 ? `+${mod}` : `${mod}`;

    overlay.innerHTML = `
      <div class="character-sheet">
        <button class="close-btn" onclick="this.closest('.character-sheet-overlay').remove()">✕</button>

        <div class="cs-header">
          <div class="cs-title">${characterData.title}</div>
          <div class="cs-level">Level ${characterData.level}</div>
        </div>

        <div class="cs-stats">
          <div class="stat-block">
            <div class="stat-name">INT</div>
            <div class="stat-value">${stats.intelligence.value}</div>
            <div class="stat-mod">${formatMod(stats.intelligence.modifier)}</div>
            <div class="stat-xp-bar">
              <div class="stat-xp-fill" style="width: ${100 - stats.intelligence.xpToNext}%"></div>
            </div>
          </div>
          <div class="stat-block">
            <div class="stat-name">WIS</div>
            <div class="stat-value">${stats.wisdom.value}</div>
            <div class="stat-mod">${formatMod(stats.wisdom.modifier)}</div>
            <div class="stat-xp-bar">
              <div class="stat-xp-fill" style="width: ${100 - stats.wisdom.xpToNext}%"></div>
            </div>
          </div>
          <div class="stat-block">
            <div class="stat-name">CON</div>
            <div class="stat-value">${stats.constitution.value}</div>
            <div class="stat-mod">${formatMod(stats.constitution.modifier)}</div>
            <div class="stat-xp-bar">
              <div class="stat-xp-fill" style="width: ${100 - stats.constitution.xpToNext}%"></div>
            </div>
          </div>
          <div class="stat-block">
            <div class="stat-name">CHA</div>
            <div class="stat-value">${stats.charisma.value}</div>
            <div class="stat-mod">${formatMod(stats.charisma.modifier)}</div>
            <div class="stat-xp-bar">
              <div class="stat-xp-fill" style="width: ${100 - stats.charisma.xpToNext}%"></div>
            </div>
          </div>
        </div>

        <div class="cs-resources">
          <div class="resource">
            <span class="resource-icon">💡</span>
            <span class="resource-value">${characterData.insightPoints}</span>
            <span class="resource-label">Insight Points</span>
          </div>
          <div class="resource">
            <span class="resource-icon">🛡️</span>
            <span class="resource-value">${characterData.savedStreaks}</span>
            <span class="resource-label">Streaks Saved</span>
          </div>
          <div class="resource">
            <span class="resource-icon">⚔️</span>
            <span class="resource-value">${characterData.encountersCompleted}</span>
            <span class="resource-label">Encounters</span>
          </div>
        </div>

        <div class="cs-criticals">
          <div class="crit-stat nat20">
            <span class="crit-icon">✨</span>
            <span class="crit-count">${characterData.criticals.nat20s}</span>
            <span class="crit-label">Natural 20s</span>
          </div>
          <div class="crit-stat nat1">
            <span class="crit-icon">💀</span>
            <span class="crit-count">${characterData.criticals.nat1s}</span>
            <span class="crit-label">Natural 1s</span>
          </div>
        </div>

        <div class="cs-footer">
          <p class="cs-flavor">"Your journey through anatomy continues..."</p>
          <p class="cs-signature">— Ms. Luminara</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Show skill check prompt
   */
  showSkillCheckPrompt(checkType, cost, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'skill-check-prompt';

    const currentPoints = d20System.getInsightPoints();
    const canAfford = currentPoints >= cost;

    overlay.innerHTML = `
      <div class="skill-check-card">
        <div class="check-header">
          <span class="check-icon">🎲</span>
          <span class="check-title">${checkType}</span>
        </div>
        <div class="check-cost">
          Cost: <span class="cost-value">${cost}</span> Insight Points
          <span class="current-points">(You have: ${currentPoints})</span>
        </div>
        <div class="check-description">
          Roll a Wisdom check to receive a hint. Higher rolls = better hints!
        </div>
        <div class="check-actions">
          <button class="check-btn cancel" onclick="this.closest('.skill-check-prompt').remove()">
            Cancel
          </button>
          <button class="check-btn roll ${canAfford ? '' : 'disabled'}"
                  ${canAfford ? '' : 'disabled'}
                  onclick="window._skillCheckCallback?.(); this.closest('.skill-check-prompt').remove()">
            🎲 Roll for Insight
          </button>
        </div>
      </div>
    `;

    window._skillCheckCallback = callback;
    document.body.appendChild(overlay);
  }

  /**
   * Show insight check result
   */
  showInsightCheckResult(result, hint) {
    const overlay = document.createElement('div');
    overlay.className = 'insight-result-overlay';

    const qualityColors = {
      'perfect': 'var(--glow-warm)',
      'excellent': 'var(--correct)',
      'good': '#60a5fa',
      'vague': 'var(--text-dim)',
      'misleading': 'var(--incorrect)'
    };

    const qualityMessages = {
      'perfect': 'Perfect Insight!',
      'excellent': 'Excellent Insight!',
      'good': 'Helpful Insight',
      'vague': 'Murky Vision...',
      'misleading': 'The spirits mislead you...'
    };

    overlay.innerHTML = `
      <div class="insight-result-card">
        <div class="insight-roll">
          <span class="roll-label">Wisdom Check</span>
          <span class="roll-value">${result.roll.roll}</span>
          <span class="roll-modifier">${result.roll.modifier >= 0 ? '+' : ''}${result.roll.modifier}</span>
          <span class="roll-total">= ${result.roll.total}</span>
          <span class="roll-dc">vs DC ${result.dc}</span>
        </div>
        <div class="insight-quality" style="color: ${qualityColors[result.hintQuality]}">
          ${qualityMessages[result.hintQuality]}
        </div>
        <div class="insight-hint">
          "${hint}"
        </div>
        <div class="insight-points-remaining">
          💡 ${result.insightPoints} Insight Points remaining
        </div>
        <button class="insight-dismiss" onclick="this.closest('.insight-result-overlay').remove()">
          Continue
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Show saving throw prompt for streak protection
   */
  showStreakSavePrompt(currentStreak, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'streak-save-prompt';

    const cost = 2;
    const currentPoints = d20System.getInsightPoints();
    const canAfford = currentPoints >= cost;

    overlay.innerHTML = `
      <div class="streak-save-card">
        <div class="save-header">
          <span class="save-icon">🛡️</span>
          <span class="save-title">Streak in Danger!</span>
        </div>
        <div class="save-streak">
          Your streak of <span class="streak-value">${currentStreak}</span> is about to break!
        </div>
        <div class="save-cost">
          Spend <span class="cost-value">${cost}</span> Insight Points to attempt a Charisma save?
        </div>
        <div class="save-actions">
          <button class="save-btn decline" onclick="window._streakSaveCallback?.(false); this.closest('.streak-save-prompt').remove()">
            Let it break 💔
          </button>
          <button class="save-btn attempt ${canAfford ? '' : 'disabled'}"
                  ${canAfford ? '' : 'disabled'}
                  onclick="window._streakSaveCallback?.(true); this.closest('.streak-save-prompt').remove()">
            🎲 Roll to Save!
          </button>
        </div>
      </div>
    `;

    window._streakSaveCallback = callback;
    document.body.appendChild(overlay);
  }

  /**
   * Show encounter banner
   */
  showEncounterBanner(encounter) {
    const banner = document.createElement('div');
    banner.className = `encounter-banner encounter-${encounter.encounterType}`;

    const typeEmojis = { boss: '👹', elite: '⚔️', standard: '📖' };

    let modifierHTML = '';
    if (encounter.advantage) {
      modifierHTML = `<span class="encounter-modifier advantage">Advantage: ${encounter.advantageReason}</span>`;
    } else if (encounter.disadvantage) {
      modifierHTML = `<span class="encounter-modifier disadvantage">Disadvantage: ${encounter.disadvantageReason}</span>`;
    }

    banner.innerHTML = `
      <span class="encounter-icon">${typeEmojis[encounter.encounterType]}</span>
      <span class="encounter-title">${encounter.rewards.title}</span>
      ${modifierHTML}
      ${encounter.encounterType !== 'standard' ? `<span class="encounter-reward">XP ×${encounter.rewards.xpMultiplier}</span>` : ''}
    `;

    document.body.appendChild(banner);

    setTimeout(() => {
      banner.classList.add('hiding');
      setTimeout(() => banner.remove(), 500);
    }, 2500);
  }

  /**
   * Render mini character stats in stats bar
   */
  renderCharacterMini() {
    if (!d20System) return '';

    const sheet = d20System.getCharacterSheet();
    const formatMod = (mod) => mod >= 0 ? `+${mod}` : `${mod}`;
    const voiceEnabled = typeof voiceSystem !== 'undefined' && voiceSystem?.settings?.enabled;

    return `
      <div class="char-mini" onclick="quiz.renderer.showCharacterSheet(d20System.getCharacterSheet())">
        <span class="char-title">${sheet.title}</span>
        <div class="char-stats-mini">
          <span title="Intelligence">🧠${formatMod(sheet.stats.intelligence.modifier)}</span>
          <span title="Wisdom">👁️${formatMod(sheet.stats.wisdom.modifier)}</span>
          <span title="Charisma">✨${formatMod(sheet.stats.charisma.modifier)}</span>
        </div>
        <span class="insight-points">💡${sheet.insightPoints}</span>
      </div>
      <button class="inventory-btn" onclick="quiz.renderer.showInventory()" title="Inventory & Equipment">
        🎒
      </button>
      <button class="voice-btn ${voiceEnabled ? 'active' : ''}" onclick="quiz.renderer.toggleVoice()" title="Toggle Ms. Luminara's Voice">
        ${voiceEnabled ? '🔊' : '🔇'}
      </button>
      <button class="voice-settings-btn" onclick="quiz.renderer.showVoiceSettings()" title="Voice Settings">
        ⚙️
      </button>
    `;
  }

  /**
   * Toggle voice on/off
   */
  toggleVoice() {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    const newState = !voiceSystem.settings.enabled;
    voiceSystem.setEnabled(newState);
    this.renderStatsBar();

    if (newState) {
      voiceSystem.speak("I'm back, darling. Did you miss my voice?", { priority: 'high', emotion: 'playful' });
    }
  }

  /**
   * Show voice settings modal
   */
  showVoiceSettings() {
    // Default to simple mode for novice users
    this.showSimpleVoiceSettings();
  }

  /**
   * Simple, beginner-friendly voice settings
   * Focused on finding the perfect voice quickly
   */
  showSimpleVoiceSettings() {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) {
      console.warn('Voice system not loaded yet');
      alert('Voice system is still loading. Please try again in a moment.');
      return;
    }

    const existing = document.querySelector('.voice-settings-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'voice-settings-overlay';

    const settings = voiceSystem.settings;

    // Get saved voice cocktails for the mixer
    let savedCocktails = [];
    try {
      savedCocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {}

    // Pre-built voice blend presets for quick selection
    const voicePresets = [
      {
        name: 'Warm Teacher',
        icon: '👩‍🏫',
        description: 'Nurturing and patient',
        voices: ['en_US-amy-medium', 'en_US-kristin-medium'],
        weights: [0.6, 0.4],
        mode: 'source_filter'
      },
      {
        name: 'Playful Guide',
        icon: '✨',
        description: 'Fun and encouraging',
        voices: ['en_US-lessac-medium', 'en_GB-jenny_dioco-medium'],
        weights: [0.5, 0.5],
        mode: 'spectral_geometric'
      },
      {
        name: 'Confident Mentor',
        icon: '💪',
        description: 'Strong and assured',
        voices: ['en_US-ljspeech-medium', 'en_US-amy-medium'],
        weights: [0.55, 0.45],
        mode: 'source_filter'
      },
      {
        name: 'Gentle Whisper',
        icon: '🌙',
        description: 'Soft and calming',
        voices: ['en_US-kristin-medium', 'en_GB-cori-medium'],
        weights: [0.5, 0.5],
        mode: 'spectral_bark'
      },
      {
        name: 'Chorus of Voices',
        icon: '🎭',
        description: 'Rich blend of 5 voices',
        voices: ['en_US-amy-medium', 'en_US-lessac-medium', 'en_US-kristin-medium', 'en_GB-jenny_dioco-medium', 'en_US-ljspeech-medium'],
        weights: [0.25, 0.2, 0.2, 0.2, 0.15],
        mode: 'source_filter'
      }
    ];

    overlay.innerHTML = `
      <div class="voice-settings-panel voice-settings-simple">
        <button class="close-btn" onclick="this.closest('.voice-settings-overlay').remove()">✕</button>

        <div class="voice-header">
          <h2>🎙️ Find Your Perfect Voice</h2>
          <p class="voice-subtitle">Click any option to hear it instantly</p>
        </div>

        <!-- Quick Start: Pre-made Blends -->
        <div class="voice-section">
          <h3>✨ Quick Start - Voice Personalities</h3>
          <p class="section-hint">One-click voice blends designed for different moods</p>
          <div class="preset-voices-grid">
            ${voicePresets.map((preset, i) => `
              <button class="voice-personality-card" onclick="quiz.renderer.playVoicePreset(${i})">
                <span class="personality-icon">${preset.icon}</span>
                <span class="personality-name">${preset.name}</span>
                <span class="personality-desc">${preset.description}</span>
                <span class="personality-mix">${preset.voices.length} voices blended</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Simple Voice Mixer -->
        <div class="voice-section">
          <h3>🎚️ Voice Mixer</h3>
          <p class="section-hint">Build your own blend - add up to 7 voices!</p>

          <div class="simple-mixer">
            <div class="mixer-voices" id="mixerVoices">
              <!-- Voice slots will be added here -->
              <div class="mixer-slot empty" onclick="quiz.renderer.openVoicePicker(0)">
                <span class="slot-plus">+</span>
                <span class="slot-label">Add Voice</span>
              </div>
            </div>

            <div class="mixer-controls" id="mixerControls" style="display: none;">
              <div class="mixer-play-row">
                <button class="mixer-play-btn" onclick="quiz.renderer.playMix()">
                  ▶ Play Mix
                </button>
                <button class="mixer-stop-btn" onclick="quiz.renderer.stopBlendAudio()">
                  ◼ Stop
                </button>
              </div>
              <div class="mixer-style-row">
                <label>Blend Style:</label>
                <select id="mixerStyle" class="mixer-style-select">
                  <option value="source_filter">Natural (Best)</option>
                  <option value="spectral_geometric">Smooth</option>
                  <option value="spectral_bark">Warm</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Single Voice Selection (Simplified) -->
        <div class="voice-section">
          <h3>👤 Single Voice</h3>
          <p class="section-hint">Or just pick one voice - no blending</p>

          <div class="single-voice-row">
            <div class="single-voice-picks">
              <button class="single-voice-btn ${settings.piperModel === 'en_US-amy-medium' ? 'active' : ''}"
                      onclick="quiz.renderer.selectSingleVoice('en_US-amy-medium')">
                Amy <span class="voice-tag">Friendly</span>
              </button>
              <button class="single-voice-btn ${settings.piperModel === 'en_US-lessac-medium' ? 'active' : ''}"
                      onclick="quiz.renderer.selectSingleVoice('en_US-lessac-medium')">
                Lessac <span class="voice-tag">Clear</span>
              </button>
              <button class="single-voice-btn ${settings.piperModel === 'en_US-kristin-medium' ? 'active' : ''}"
                      onclick="quiz.renderer.selectSingleVoice('en_US-kristin-medium')">
                Kristin <span class="voice-tag">Warm</span>
              </button>
              <button class="single-voice-btn ${settings.piperModel === 'en_GB-jenny_dioco-medium' ? 'active' : ''}"
                      onclick="quiz.renderer.selectSingleVoice('en_GB-jenny_dioco-medium')">
                Jenny <span class="voice-tag">British</span>
              </button>
              <button class="single-voice-btn ${settings.piperModel === 'en_US-ljspeech-medium' ? 'active' : ''}"
                      onclick="quiz.renderer.selectSingleVoice('en_US-ljspeech-medium')">
                Linda <span class="voice-tag">Neutral</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Volume & Speed (Essential Only) -->
        <div class="voice-section compact">
          <h3>🔊 Basics</h3>
          <div class="basics-row">
            <div class="basic-control">
              <label>Volume</label>
              <input type="range" min="0" max="100" value="${settings.volume * 100}"
                     oninput="quiz.renderer.updateVoiceSetting('volume', this.value / 100)">
            </div>
            <div class="basic-control">
              <label>Speed</label>
              <input type="range" min="70" max="130" value="${settings.rate * 100}"
                     oninput="quiz.renderer.updateVoiceSetting('rate', this.value / 100)">
            </div>
            <label class="voice-toggle">
              <input type="checkbox" ${settings.enabled ? 'checked' : ''}
                     onchange="quiz.renderer.updateVoiceSetting('enabled', this.checked)">
              Voice On
            </label>
          </div>
        </div>

        <!-- Saved Blends -->
        ${savedCocktails.length > 0 ? `
        <div class="voice-section">
          <h3>💾 Your Saved Voices</h3>
          <div class="saved-voices-grid">
            ${savedCocktails.slice(0, 6).map((c, i) => `
              <button class="saved-voice-btn" onclick="quiz.renderer.loadVoiceCocktail(${i})">
                ${c.name || `Blend ${i + 1}`}
              </button>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- XTTS Voice Lab (True Voice Blending) -->
        <div class="voice-section xtts-section">
          <h3>🧬 Voice Lab <span class="xtts-badge">NEW - GPU</span></h3>
          <p class="section-hint">True voice blending in embedding space - creates hybrid voices, not overlays!</p>

          <div class="xtts-status" id="xttsStatus">
            <span class="xtts-status-icon">⏳</span>
            <span class="xtts-status-text">Checking XTTS status...</span>
          </div>

          <div class="xtts-controls" id="xttsControls" style="display: none;">
            <!-- Voice Library -->
            <div class="xtts-voices" id="xttsVoices">
              <div class="xtts-voice-header">
                <span>Your Voice Samples</span>
                <button class="xtts-capture-btn" onclick="quiz.renderer.showXttsCapture()">
                  + Capture from Piper
                </button>
                <button class="xtts-capture-btn xtts-capture-cocktails-btn" onclick="quiz.renderer.captureAllCocktails()">
                  🍸 Capture Saved Cocktails
                </button>
              </div>
              <div class="xtts-voice-list" id="xttsVoiceList">
                <p class="xtts-empty">No voice samples yet. Capture some from Piper!</p>
              </div>
            </div>

            <!-- XTTS Mixer -->
            <div class="xtts-mixer">
              <div class="xtts-mixer-header">
                <span>Voice Mixer</span>
                <button class="xtts-reset-weights-btn" onclick="quiz.renderer.resetXttsWeights()">
                  ↺ Reset Weights
                </button>
              </div>
              <div class="xtts-mixer-slots" id="xttsMixerSlots">
                <!-- Slots will be populated -->
              </div>

              <!-- Voice Personality Controls -->
              <div class="xtts-personality-controls">
                <div class="xtts-personality-header">
                  <span>🎭 Voice Character</span>
                  <select id="xttsPersonalityPreset" onchange="quiz.renderer.applyXttsPreset(this.value)">
                    <option value="">Custom</option>
                    <option value="neutral">Neutral / Professional</option>
                    <option value="warm">Warm & Friendly</option>
                    <option value="energetic">Energetic & Excited</option>
                    <option value="calm">Calm & Soothing</option>
                    <option value="playful">Playful & Teasing</option>
                    <option value="serious">Serious & Authoritative</option>
                    <option value="skeptical">Skeptical & Questioning</option>
                  </select>
                </div>
                <div class="xtts-sliders-grid">
                  <div class="xtts-slider-row">
                    <label>Speed</label>
                    <input type="range" id="xttsSpeed" min="0.5" max="1.5" step="0.05" value="1.0"
                           oninput="quiz.renderer.updateXttsParam('speed', this.value)">
                    <span id="xttsSpeedVal">1.0×</span>
                  </div>
                  <div class="xtts-slider-row">
                    <label>Expressiveness</label>
                    <input type="range" id="xttsTemperature" min="0.1" max="1.0" step="0.05" value="0.7"
                           oninput="quiz.renderer.updateXttsParam('temperature', this.value)">
                    <span id="xttsTemperatureVal">0.70</span>
                  </div>
                  <div class="xtts-slider-row">
                    <label>Variation</label>
                    <input type="range" id="xttsTopP" min="0.5" max="1.0" step="0.05" value="0.85"
                           oninput="quiz.renderer.updateXttsParam('top_p', this.value)">
                    <span id="xttsTopPVal">0.85</span>
                  </div>
                  <div class="xtts-slider-row">
                    <label>Repetition</label>
                    <input type="range" id="xttsRepPenalty" min="1.0" max="10.0" step="0.5" value="2.0"
                           oninput="quiz.renderer.updateXttsParam('repetition_penalty', this.value)">
                    <span id="xttsRepPenaltyVal">2.0</span>
                  </div>
                </div>
              </div>

              <div class="xtts-mixer-actions">
                <button class="xtts-blend-btn" onclick="quiz.renderer.playXttsBlend()" disabled>
                  🧬 Blend Voices
                </button>
                <button class="xtts-save-btn" onclick="quiz.renderer.saveXttsBlend()" disabled>
                  💾 Save Blend
                </button>
                <select id="xttsSlerp" class="xtts-slerp-select">
                  <option value="true">Spherical (Slerp) - Best</option>
                  <option value="false">Linear - Faster</option>
                </select>
              </div>
            </div>

            <!-- Solo Voice Testing -->
            <div class="xtts-solo-section">
              <div class="xtts-solo-header">
                <span>🎤 Active Voice</span>
                <span class="xtts-active-voice" id="xttsActiveVoice">None selected</span>
              </div>
              <div class="xtts-solo-controls">
                <input type="text" id="xttsSoloText" class="xtts-solo-input"
                       placeholder="Type text to test your voice..."
                       value="Hello darling. Let me show you how I sound with these settings.">
                <button class="xtts-solo-play-btn" onclick="quiz.renderer.playActiveVoice()">
                  ▶ Play
                </button>
              </div>
              <div class="xtts-quiz-use-section">
                <button class="xtts-use-quiz-btn" onclick="quiz.renderer.useXttsForQuiz()" id="xttsUseQuizBtn">
                  📚 Use for Quiz
                </button>
                <span class="xtts-quiz-status" id="xttsQuizStatus"></span>
              </div>
              <p class="xtts-solo-hint">Click ★ on any voice to set it as active. Click "Use for Quiz" to make Ms. Luminara use this voice.</p>
            </div>
          </div>

          <button class="xtts-load-btn" id="xttsLoadBtn" onclick="quiz.renderer.loadXttsModel()" style="display: none;">
            🚀 Load XTTS Model (~4GB VRAM)
          </button>
        </div>

        <div class="voice-footer">
          <button class="expert-mode-btn" onclick="quiz.renderer.showExpertVoiceSettings()">
            🔧 Expert Mode
          </button>
          <button class="done-btn" onclick="this.closest('.voice-settings-overlay').remove()">
            ✓ Done
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Store presets for later use
    this._voicePresets = voicePresets;
    this._mixerVoices = [];

    // Initialize XTTS UI
    this.initXttsUI();
  }

  /**
   * Play a pre-built voice personality preset
   */
  async playVoicePreset(index) {
    const preset = this._voicePresets[index];
    if (!preset) return;

    // Show loading state
    const cards = document.querySelectorAll('.voice-personality-card');
    cards.forEach((c, i) => c.classList.toggle('playing', i === index));

    try {
      const response = await fetch('http://localhost:5500/blend-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Hello darling. Let me show you what I sound like.",
          voices: preset.voices.map(v => ({ model: v })),
          weights: preset.weights,
          mode: preset.mode
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
        cards.forEach(c => c.classList.remove('playing'));
        URL.revokeObjectURL(url);
      };

      await this._currentAudio.play();
    } catch (e) {
      console.error('Voice preset error:', e);
      cards.forEach(c => c.classList.remove('playing'));
    }
  }

  /**
   * Open voice picker for mixer slot
   */
  openVoicePicker(slotIndex) {
    const piperVoices = voiceSystem?.backends?.piper?.voiceData || null;
    const allVoices = [
      ...(piperVoices?.grouped?.female || []),
      ...(piperVoices?.grouped?.male || [])
    ].slice(0, 20); // Limit to top 20 voices

    const picker = document.createElement('div');
    picker.className = 'voice-picker-popup';
    picker.innerHTML = `
      <div class="picker-content">
        <div class="picker-header">
          <h4>Choose a Voice</h4>
          <button class="picker-close" onclick="this.closest('.voice-picker-popup').remove()">✕</button>
        </div>
        <div class="picker-grid">
          ${allVoices.map(v => `
            <button class="picker-voice" onclick="quiz.renderer.addToMixer('${v.id}', '${v.id.split('-')[1]}')">
              ${v.id.split('-')[1]}
              <span class="picker-accent">${v.accent}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(picker);
  }

  /**
   * Add a voice to the mixer
   */
  addToMixer(voiceId, displayName) {
    // Close picker
    document.querySelector('.voice-picker-popup')?.remove();

    if (!this._mixerVoices) this._mixerVoices = [];
    if (this._mixerVoices.length >= 7) {
      alert('Maximum 7 voices in a mix!');
      return;
    }

    this._mixerVoices.push({ id: voiceId, name: displayName });
    this.updateMixerUI();
  }

  /**
   * Remove a voice from the mixer
   */
  removeFromMixer(index) {
    if (!this._mixerVoices) return;
    this._mixerVoices.splice(index, 1);
    this.updateMixerUI();
  }

  /**
   * Update the mixer UI to reflect current voices
   */
  updateMixerUI() {
    const container = document.getElementById('mixerVoices');
    const controls = document.getElementById('mixerControls');
    if (!container) return;

    const voices = this._mixerVoices || [];

    container.innerHTML = voices.map((v, i) => `
      <div class="mixer-slot filled">
        <span class="slot-name">${v.name}</span>
        <button class="slot-remove" onclick="quiz.renderer.removeFromMixer(${i})">✕</button>
      </div>
    `).join('') + (voices.length < 7 ? `
      <div class="mixer-slot empty" onclick="quiz.renderer.openVoicePicker(${voices.length})">
        <span class="slot-plus">+</span>
        <span class="slot-label">Add Voice</span>
      </div>
    ` : '');

    // Show/hide controls based on voice count
    if (controls) {
      controls.style.display = voices.length >= 2 ? 'block' : 'none';
    }
  }

  /**
   * Play the current mixer blend
   */
  async playMix() {
    const voices = this._mixerVoices || [];
    if (voices.length < 2) {
      alert('Add at least 2 voices to mix!');
      return;
    }

    const styleSelect = document.getElementById('mixerStyle');
    const mode = styleSelect?.value || 'source_filter';

    // Equal weights
    const weights = voices.map(() => 1 / voices.length);

    try {
      const btn = document.querySelector('.mixer-play-btn');
      if (btn) btn.textContent = '⏳ Mixing...';

      const response = await fetch('http://localhost:5500/blend-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Hello darling. This is your custom voice blend.",
          voices: voices.map(v => ({ model: v.id })),
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
        if (btn) btn.textContent = '▶ Play Mix';
        URL.revokeObjectURL(url);
      };

      await this._currentAudio.play();
      if (btn) btn.textContent = '▶ Play Mix';
    } catch (e) {
      console.error('Mix error:', e);
      const btn = document.querySelector('.mixer-play-btn');
      if (btn) btn.textContent = '▶ Play Mix';
    }
  }

  /**
   * Select a single voice (no blending)
   */
  async selectSingleVoice(voiceId) {
    if (!voiceSystem) return;

    // Update settings
    voiceSystem.settings.piperModel = voiceId;
    voiceSystem.settings.useBlendedVoice = false;
    voiceSystem.saveSettings();

    // Update UI
    document.querySelectorAll('.single-voice-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(voiceId.split('-')[1]));
    });

    // Play preview
    await voiceSystem.previewVoice({ backend: 'piper', id: voiceId }, 'short');
  }

  /**
   * Show the expert/advanced voice settings (original complex UI)
   */
  showExpertVoiceSettings() {
    const existing = document.querySelector('.voice-settings-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'voice-settings-overlay';

    const settings = voiceSystem.settings;
    const piperVoices = voiceSystem.backends.piper.voiceData || null;
    const femaleVoices = piperVoices?.grouped?.female || [];
    const maleVoices = piperVoices?.grouped?.male || [];
    const multiVoices = piperVoices?.grouped?.multi || [];

    overlay.innerHTML = `
      <div class="voice-settings-panel voice-settings-wide">
        <button class="close-btn" onclick="this.closest('.voice-settings-overlay').remove()">✕</button>

        <div class="voice-header">
          <h2>🔧 Expert Voice Settings</h2>
          <div class="header-controls">
            <button class="simple-mode-btn" onclick="quiz.renderer.showSimpleVoiceSettings()">← Simple Mode</button>
            <span class="backend-indicator ${settings.backend === 'xtts' ? 'xtts-active' : ''}" id="backendIndicator">
              ${settings.backend === 'xtts' ? '🔬 XTTS Voice Lab' : settings.backend === 'piper' ? '🎤 Piper TTS' : '🌐 Browser TTS'}
            </span>
            <label class="enable-toggle">
              <input type="checkbox" ${settings.enabled ? 'checked' : ''} onchange="quiz.renderer.updateVoiceSetting('enabled', this.checked)">
              Voice Enabled
            </label>
            <button class="test-btn-main" onclick="voiceSystem.testVoice()">🔊 Test Voice</button>
          </div>
        </div>

        <div class="voice-layout">
          <!-- LEFT COLUMN: Voice Selection -->
          <div class="voice-col voice-col-left">
            <h3>👩 Feminine Voices</h3>
            <div class="voice-list">
              ${femaleVoices.map(v => `
                <button class="voice-item ${settings.piperModel === v.id ? 'selected' : ''}"
                        onclick="quiz.renderer.quickAudition('${v.id}')"
                        data-voice="${v.id}">
                  <span class="vi-name">${v.id.split('-')[1]}</span>
                  <span class="vi-accent">${v.accent}</span>
                  <span class="vi-desc">${v.description.replace(/^[^-]+ - /, '')}</span>
                </button>
              `).join('')}
            </div>

            <h3>👨 Masculine Voices</h3>
            <div class="voice-list">
              ${maleVoices.map(v => `
                <button class="voice-item ${settings.piperModel === v.id ? 'selected' : ''}"
                        onclick="quiz.renderer.quickAudition('${v.id}')"
                        data-voice="${v.id}">
                  <span class="vi-name">${v.id.split('-')[1]}</span>
                  <span class="vi-accent">${v.accent}</span>
                  <span class="vi-desc">${v.description.replace(/^[^-]+ - /, '')}</span>
                </button>
              `).join('')}
            </div>

            <h3>👥 Multi-Speaker Models</h3>
            <p class="voice-hint">Click to explore - use Speaker ID slider in Voice Lab!</p>

            <h4 class="accent-header">🇺🇸 American English</h4>
            <div class="voice-list">
              ${multiVoices.filter(v => v.accent === 'US').map(v => {
                const speakerCounts = {
                  'en_US-libritts-high': 904,
                  'en_US-libritts_r-medium': 904,
                  'en_US-arctic-medium': 18,
                  'en_US-l2arctic-medium': 24
                };
                const count = speakerCounts[v.id] || '?';
                const labels = {
                  'en_US-libritts-high': '⭐ Best Quality',
                  'en_US-libritts_r-medium': 'Enhanced',
                  'en_US-arctic-medium': 'US Accents',
                  'en_US-l2arctic-medium': 'Foreign Accents'
                };
                return `
                <button class="voice-item multi-speaker ${settings.piperModel === v.id ? 'selected' : ''}"
                        onclick="quiz.renderer.selectMultiSpeakerModel('${v.id}', ${count})"
                        data-voice="${v.id}">
                  <span class="vi-name">${v.id.split('-')[1]}</span>
                  <span class="vi-count">${count} speakers</span>
                  <span class="vi-label">${labels[v.id] || ''}</span>
                </button>
              `}).join('')}
            </div>

            <h4 class="accent-header">🇬🇧 British English</h4>
            <div class="voice-list">
              ${multiVoices.filter(v => v.accent === 'UK').map(v => {
                const speakerCounts = {
                  'en_GB-vctk-medium': 109,
                  'en_GB-semaine-medium': 4,
                  'en_GB-aru-medium': 12
                };
                const count = speakerCounts[v.id] || '?';
                const labels = {
                  'en_GB-vctk-medium': '⭐ Most Variety',
                  'en_GB-semaine-medium': 'Emotional',
                  'en_GB-aru-medium': 'British Mix'
                };
                return `
                <button class="voice-item multi-speaker ${settings.piperModel === v.id ? 'selected' : ''}"
                        onclick="quiz.renderer.selectMultiSpeakerModel('${v.id}', ${count})"
                        data-voice="${v.id}">
                  <span class="vi-name">${v.id.split('-')[1]}</span>
                  <span class="vi-count">${count} speakers</span>
                  <span class="vi-label">${labels[v.id] || ''}</span>
                </button>
              `}).join('')}
            </div>
          </div>

          <!-- RIGHT COLUMN: Settings & Controls -->
          <div class="voice-col voice-col-right">
            <!-- Sample Type -->
            <div class="settings-section">
              <h4>Sample Type</h4>
              <div class="sample-btns">
                <button class="sample-btn active" data-type="short" onclick="quiz.renderer.setAuditionSampleType('short')">Short</button>
                <button class="sample-btn" data-type="medium" onclick="quiz.renderer.setAuditionSampleType('medium')">Medium</button>
                <button class="sample-btn" data-type="long" onclick="quiz.renderer.setAuditionSampleType('long')">Long</button>
                <button class="sample-btn" data-type="poke" onclick="quiz.renderer.setAuditionSampleType('poke')">Poke</button>
              </div>
            </div>

            <!-- Mood Presets -->
            <div class="settings-section">
              <h4>Mood Presets</h4>
              <div class="preset-grid">
                <button class="preset-chip" onclick="quiz.renderer.applyVoicePreset('recommended')">🎭 Balanced</button>
                <button class="preset-chip" onclick="quiz.renderer.applyVoicePreset('Energetic')">⚡ Energetic</button>
                <button class="preset-chip" onclick="quiz.renderer.applyVoicePreset('Contemplative')">🌙 Slow</button>
                <button class="preset-chip" onclick="quiz.renderer.applyVoicePreset('Playful')">😏 Playful</button>
                <button class="preset-chip" onclick="quiz.renderer.applyVoicePreset('Deadpan')">💀 Deadpan</button>
                <button class="preset-chip" onclick="quiz.renderer.applyVoicePreset('Intimate')">💜 Intimate</button>
              </div>
            </div>

            <!-- Main Sliders -->
            <div class="settings-section">
              <h4>Audio</h4>
              <div class="slider-row">
                <label>Volume</label>
                <input type="range" min="0" max="100" value="${settings.volume * 100}"
                       oninput="this.nextElementSibling.textContent = this.value + '%'"
                       onchange="quiz.renderer.updateVoiceSetting('volume', this.value / 100)">
                <span class="slider-val">${Math.round(settings.volume * 100)}%</span>
              </div>
              <div class="slider-row">
                <label>Speed</label>
                <input type="range" min="50" max="150" value="${settings.rate * 100}"
                       oninput="this.nextElementSibling.textContent = (this.value / 100).toFixed(2) + 'x'"
                       onchange="quiz.renderer.updateVoiceSetting('rate', this.value / 100)">
                <span class="slider-val">${settings.rate.toFixed(2)}x</span>
              </div>
              <div class="slider-row">
                <label>Length</label>
                <input type="range" min="50" max="200" value="${(settings.piperLengthScale || 1.0) * 100}"
                       oninput="this.nextElementSibling.textContent = (this.value / 100).toFixed(2)"
                       onchange="quiz.renderer.updateVoiceSetting('piperLengthScale', this.value / 100)">
                <span class="slider-val">${(settings.piperLengthScale || 1.0).toFixed(2)}</span>
              </div>
              <div class="slider-row">
                <label>Expression</label>
                <input type="range" min="0" max="100" value="${(settings.piperNoiseScale || 0.667) * 100}"
                       oninput="this.nextElementSibling.textContent = this.value + '%'"
                       onchange="quiz.renderer.updateVoiceSetting('piperNoiseScale', this.value / 100)">
                <span class="slider-val">${Math.round((settings.piperNoiseScale || 0.667) * 100)}%</span>
              </div>
            </div>

            <!-- Behavior Toggles -->
            <div class="settings-section">
              <h4>Behavior</h4>
              <div class="toggle-list">
                <label><input type="checkbox" ${settings.speakIntros ? 'checked' : ''} onchange="quiz.renderer.updateVoiceSetting('speakIntros', this.checked)"> Speak Intros</label>
                <label><input type="checkbox" ${settings.speakExplanations ? 'checked' : ''} onchange="quiz.renderer.updateVoiceSetting('speakExplanations', this.checked)"> Speak Explanations</label>
                <label><input type="checkbox" ${settings.readQuestionsAloud ? 'checked' : ''} onchange="quiz.renderer.updateVoiceSetting('readQuestionsAloud', this.checked)"> Read Questions</label>
                <label><input type="checkbox" ${settings.playfulPokes ? 'checked' : ''} onchange="quiz.renderer.updateVoiceSetting('playfulPokes', this.checked)"> Idle Pokes</label>
              </div>
            </div>

            <!-- Voice Lab -->
            <div class="settings-section lab-section expanded">
              <h4 onclick="this.parentElement.classList.toggle('expanded')">🧪 Voice Lab <span class="expand-icon">▼</span></h4>
              <div class="lab-content">
                <p class="lab-intro">Explore multi-speaker models - find the perfect voice!</p>

                <div class="lab-model-info">
                  <strong>Current:</strong> <span id="labCurrentModel">${settings.piperModel || 'None'}</span>
                  <span id="labSpeakerInfo">${settings.piperSpeakerId ? `(Speaker #${settings.piperSpeakerId})` : ''}</span>
                </div>

                <div class="lab-row">
                  <label>Speaker ID: <span id="labSpeakerIdVal">${settings.piperSpeakerId || 0}</span></label>
                  <input type="range" id="labSpeakerId" min="0" max="${this._labMaxSpeakers || 108}"
                         value="${settings.piperSpeakerId || 0}"
                         oninput="document.getElementById('labSpeakerIdVal').textContent = this.value">
                </div>

                <div class="lab-btns">
                  <button class="lab-btn" onclick="quiz.renderer.labPreviewSpeaker()">▶ Preview</button>
                  <button class="lab-btn" onclick="quiz.renderer.labRandomSpeaker()">🎲 Random</button>
                  <button class="lab-btn" onclick="quiz.renderer.labPrevSpeaker()">◀ Prev</button>
                  <button class="lab-btn" onclick="quiz.renderer.labNextSpeaker()">Next ▶</button>
                </div>

                <div class="lab-btns">
                  <button class="lab-btn primary" onclick="quiz.renderer.adoptLabVoice()">✓ Use This Voice</button>
                  <button class="lab-btn" onclick="quiz.renderer.saveVoiceCocktail()">💾 Save as Preset</button>
                </div>

                <div class="lab-favorites">
                  <h5>Saved Voices</h5>
                  <div id="savedCocktails" class="saved-cocktails-list">
                    <!-- Dynamically populated -->
                  </div>
                </div>

                <label class="roulette-toggle">
                  <input type="checkbox" ${settings.voiceRouletteEnabled ? 'checked' : ''} onchange="quiz.renderer.toggleVoiceRoulette(this.checked)">
                  🎰 Voice Roulette (random speaker each sentence)
                </label>

                <!-- Voice Blender - Professional Voice Morphing -->
                <div class="blender-section">
                  <h5>🎛️ Voice Morpher (Advanced)</h5>
                  <p class="lab-hint">Professional voice morphing with formant control, pitch alignment, and transient preservation</p>

                  <!-- Voice Selection -->
                  <div class="blender-selects">
                    <select id="blendVoiceA" class="blend-select">
                      <option value="">Voice A...</option>
                    </select>
                    <span class="blend-plus">+</span>
                    <select id="blendVoiceB" class="blend-select">
                      <option value="">Voice B...</option>
                    </select>
                  </div>

                  <!-- Main Blend Controls -->
                  <div class="morph-row">
                    <div class="morph-control">
                      <label>Blend Ratio:</label>
                      <div class="ratio-slider">
                        <span>A</span>
                        <input type="range" id="blendRatio" min="0" max="100" value="50"
                               oninput="quiz.renderer.onMorphParamChange('ratio', this.value)">
                        <span>B</span>
                        <span id="blendRatioVal" class="blend-ratio-val">50%</span>
                      </div>
                    </div>
                    <div class="morph-control">
                      <label>Mode:</label>
                      <select id="blendMode" onchange="quiz.renderer.onMorphParamChange('mode', this.value)">
                        <option value="source_filter">Source-Filter (Best)</option>
                        <option value="spectral_bark">Perceptual (Bark)</option>
                        <option value="harmonic_percussive">Harmonic-Percussive</option>
                        <option value="spectral_geometric">Spectral Geometric</option>
                        <option value="spectral_lpc">Spectral + LPC</option>
                        <option value="spectral">Legacy FFT</option>
                      </select>
                    </div>
                  </div>

                  <!-- Quick Preset Buttons -->
                  <div class="morph-row preset-buttons">
                    <button class="preset-btn active" data-preset="natural" onclick="quiz.renderer.applyPreset('natural')" title="Best for natural voice blend">Natural</button>
                    <button class="preset-btn" data-preset="smooth_morph" onclick="quiz.renderer.applyPreset('smooth_morph')" title="Smooth gradual blend">Smooth</button>
                    <button class="preset-btn" data-preset="crisp_consonants" onclick="quiz.renderer.applyPreset('crisp_consonants')" title="Clear consonants">Crisp</button>
                    <button class="preset-btn" data-preset="legacy" onclick="quiz.renderer.applyPreset('legacy')" title="Original FFT blend">Legacy</button>
                  </div>

                  <!-- Playback Controls -->
                  <div class="morph-playback">
                    <button class="play-btn" id="previewBlendBtn2" onclick="quiz.renderer.previewBlend()">▶ Play</button>
                    <button class="stop-btn" onclick="quiz.renderer.stopBlendAudio()">◼ Stop</button>
                    <button class="replay-btn" onclick="quiz.renderer.replayBlend()">↻</button>
                  </div>

                  <!-- Formant Control -->
                  <div class="morph-section">
                    <div class="morph-section-header">Formant Control</div>
                    <div class="morph-row">
                      <div class="morph-control">
                        <label>Formant Ratio:</label>
                        <input type="range" id="formantRatio" min="0" max="100" value="50"
                               oninput="quiz.renderer.onMorphParamChange('formant_ratio', this.value)">
                        <span class="morph-val" id="formantRatioVal">50%</span>
                      </div>
                      <div class="morph-control">
                        <label>LPC Order:</label>
                        <input type="number" id="lpcOrder" min="8" max="20" value="14"
                               onchange="quiz.renderer.onMorphParamChange('lpc_order', this.value)">
                      </div>
                    </div>
                    <div class="morph-row">
                      <div class="morph-control">
                        <label>Shift A:</label>
                        <input type="range" id="formantShiftA" min="-12" max="12" value="0"
                               oninput="quiz.renderer.onMorphParamChange('formant_shift_a', this.value)">
                        <span class="morph-val" id="formantShiftAVal">0 st</span>
                      </div>
                      <div class="morph-control">
                        <label>Shift B:</label>
                        <input type="range" id="formantShiftB" min="-12" max="12" value="0"
                               oninput="quiz.renderer.onMorphParamChange('formant_shift_b', this.value)">
                        <span class="morph-val" id="formantShiftBVal">0 st</span>
                      </div>
                    </div>
                  </div>

                  <!-- Pitch Alignment -->
                  <div class="morph-section">
                    <div class="morph-section-header">
                      <label class="morph-toggle">
                        <input type="checkbox" id="pitchAlign" onchange="quiz.renderer.onMorphParamChange('pitch_align', this.checked)">
                        Pitch Alignment
                      </label>
                    </div>
                    <div class="morph-row" id="pitchTargetRow">
                      <label>Target:</label>
                      <div class="radio-group">
                        <label><input type="radio" name="pitchTarget" value="a" onchange="quiz.renderer.onMorphParamChange('pitch_target', 'a')"> Voice A</label>
                        <label><input type="radio" name="pitchTarget" value="b" onchange="quiz.renderer.onMorphParamChange('pitch_target', 'b')"> Voice B</label>
                        <label><input type="radio" name="pitchTarget" value="avg" checked onchange="quiz.renderer.onMorphParamChange('pitch_target', 'avg')"> Average</label>
                      </div>
                    </div>
                  </div>

                  <!-- Phase & Timing -->
                  <div class="morph-section">
                    <div class="morph-section-header">Phase & Timing</div>
                    <div class="morph-row">
                      <div class="morph-control">
                        <label>Phase A:</label>
                        <input type="range" id="phaseOffsetA" min="-180" max="180" value="0"
                               oninput="quiz.renderer.syncPhaseInput('A', this.value)">
                        <input type="number" id="phaseOffsetANum" min="-180" max="180" value="0" class="phase-num"
                               oninput="quiz.renderer.syncPhaseSlider('A', this.value)">
                        <span>°</span>
                      </div>
                      <div class="morph-control">
                        <label>Phase B:</label>
                        <input type="range" id="phaseOffsetB" min="-180" max="180" value="0"
                               oninput="quiz.renderer.syncPhaseInput('B', this.value)">
                        <input type="number" id="phaseOffsetBNum" min="-180" max="180" value="0" class="phase-num"
                               oninput="quiz.renderer.syncPhaseSlider('B', this.value)">
                        <span>°</span>
                      </div>
                    </div>
                    <div class="morph-row">
                      <div class="morph-control">
                        <label>Delay A:</label>
                        <input type="range" id="timeDelayA" min="-200" max="200" value="0"
                               oninput="quiz.renderer.syncDelayInput('A', this.value)">
                        <input type="number" id="timeDelayANum" min="-200" max="200" value="0" class="phase-num"
                               oninput="quiz.renderer.syncDelaySlider('A', this.value)">
                        <span>ms</span>
                      </div>
                      <div class="morph-control">
                        <label>Delay B:</label>
                        <input type="range" id="timeDelayB" min="-200" max="200" value="0"
                               oninput="quiz.renderer.syncDelayInput('B', this.value)">
                        <input type="number" id="timeDelayBNum" min="-200" max="200" value="0" class="phase-num"
                               oninput="quiz.renderer.syncDelaySlider('B', this.value)">
                        <span>ms</span>
                      </div>
                    </div>
                    <div class="phase-buttons-row">
                      <button class="phase-btn" onclick="quiz.renderer.resetPhaseOffsets()" title="Reset all to 0">↺ Reset</button>
                      <button class="phase-btn auto" onclick="quiz.renderer.autoFindPhase()" title="Auto-find optimal phase">🔍 Auto Phase</button>
                      <button class="phase-btn auto" onclick="quiz.renderer.autoFindDelay()" title="Auto-find optimal delay">🔍 Auto Delay</button>
                    </div>
                  </div>

                  <!-- Transient & Perceptual -->
                  <div class="morph-section">
                    <div class="morph-section-header">Transient & Perceptual</div>
                    <div class="morph-row">
                      <div class="morph-control">
                        <label>Transients:</label>
                        <select id="transientMode" onchange="quiz.renderer.onMorphParamChange('transient_mode', this.value)">
                          <option value="max">Preserve Loudest</option>
                          <option value="a">From Voice A</option>
                          <option value="b">From Voice B</option>
                          <option value="blend">Blend All</option>
                        </select>
                      </div>
                      <div class="morph-control">
                        <label>Sensitivity:</label>
                        <input type="range" id="transientThreshold" min="5" max="50" value="20"
                               oninput="quiz.renderer.onMorphParamChange('transient_threshold', this.value / 10)">
                        <span class="morph-val" id="transientThresholdVal">2.0</span>
                      </div>
                    </div>
                    <div class="morph-row checkbox-row">
                      <label class="morph-checkbox">
                        <input type="checkbox" id="perceptualWeight" checked
                               onchange="quiz.renderer.onMorphParamChange('perceptual_weight', this.checked)">
                        Bark Scale Weighting
                      </label>
                      <label class="morph-checkbox">
                        <input type="checkbox" id="verticalPhaseLock" checked
                               onchange="quiz.renderer.onMorphParamChange('vertical_phase_lock', this.checked)">
                        Vertical Phase Lock
                      </label>
                      <label class="morph-checkbox">
                        <input type="checkbox" id="windowAdaptive" checked
                               onchange="quiz.renderer.onMorphParamChange('window_adaptive', this.checked)">
                        Adaptive Windowing
                      </label>
                    </div>
                  </div>

                  <!-- Sample Scripts -->
                  <div class="blend-sample-section">
                    <label>Sample Script:</label>
                    <div class="blend-sample-btns">
                      <button class="sample-chip active" data-sample="action" onclick="quiz.renderer.setBlendSample('action')">Action</button>
                      <button class="sample-chip" data-sample="suspense" onclick="quiz.renderer.setBlendSample('suspense')">Suspense</button>
                      <button class="sample-chip" data-sample="seductive" onclick="quiz.renderer.setBlendSample('seductive')">Seductive</button>
                      <button class="sample-chip" data-sample="nurturing" onclick="quiz.renderer.setBlendSample('nurturing')">Nurturing</button>
                      <button class="sample-chip" data-sample="showcase" onclick="quiz.renderer.setBlendSample('showcase')">Showcase</button>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="blend-progress" id="blendProgress" style="display: none;">
                    <div class="blend-progress-bar">
                      <div class="blend-progress-fill" id="blendProgressFill"></div>
                    </div>
                    <div class="blend-progress-text" id="blendProgressText">Starting...</div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="lab-btns">
                    <button class="lab-btn primary" id="previewBlendBtn" onclick="quiz.renderer.previewBlend()">▶ Preview</button>
                    <button class="lab-btn" id="replayBlendBtn" onclick="quiz.renderer.replayBlend()" style="display: none;">↻ Replay</button>
                    <button class="lab-btn" onclick="quiz.renderer.saveBlendedVoice()">💾 Save</button>
                    <button class="lab-btn danger" id="clearBlendBtn" onclick="quiz.renderer.clearBlendCache()" style="display: none;">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="voice-footer">
          <button class="done-btn" onclick="this.closest('.voice-settings-overlay').remove()">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.renderSavedCocktails();
  }

  /**
   * Audition a voice (play sample and optionally select it)
   * @param {string} voiceId - Voice model ID
   * @param {string} sampleType - 'short', 'medium', 'long', 'question', 'poke', 'enthusiastic'
   */
  async auditionVoice(voiceId, sampleType = 'medium') {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    // Update visual selection
    document.querySelectorAll('.voice-card').forEach(card => {
      card.classList.remove('auditioning');
    });
    const card = document.querySelector(`[data-voice="${voiceId}"]`);
    if (card) card.classList.add('auditioning');

    // Use the new previewVoice method from voice system
    await voiceSystem.previewVoice({ backend: 'piper', id: voiceId }, sampleType);

    // Keep this voice selected after preview
    voiceSystem.settings.piperModel = voiceId;
    voiceSystem.saveSettings();

    // Update UI to show new selection
    document.querySelectorAll('.voice-card').forEach(card => {
      card.classList.remove('selected', 'auditioning');
      card.querySelector('.voice-active')?.remove();
    });
    if (card) {
      card.classList.add('selected');
      card.insertAdjacentHTML('beforeend', '<span class="voice-active">✓ Active</span>');
    }

    this.renderStatsBar();
  }

  /**
   * Compare two voices side by side
   * @param {string} voice1Id - First voice to compare
   * @param {string} voice2Id - Second voice to compare
   */
  async compareVoices(voice1Id, voice2Id) {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    // Highlight both cards
    document.querySelectorAll('.voice-card').forEach(card => {
      card.classList.remove('comparing');
    });
    document.querySelector(`[data-voice="${voice1Id}"]`)?.classList.add('comparing');
    document.querySelector(`[data-voice="${voice2Id}"]`)?.classList.add('comparing');

    await voiceSystem.compareVoices(
      { backend: 'piper', id: voice1Id },
      { backend: 'piper', id: voice2Id },
      'medium'
    );

    // Remove highlight
    document.querySelectorAll('.voice-card').forEach(card => {
      card.classList.remove('comparing');
    });
  }

  /**
   * Quick audition of a recommended voice
   * @param {string} voiceId - Voice model ID
   */
  async quickAudition(voiceId) {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    // Update visual selection for recommended voices
    document.querySelectorAll('.voice-pick').forEach(btn => {
      btn.classList.remove('active', 'playing');
    });
    const btn = document.querySelector(`.voice-pick[onclick*="${voiceId}"]`);
    if (btn) btn.classList.add('playing');

    // Use a Ms. Luminara-appropriate sample phrase
    const sampleType = this.getAuditionSampleType();

    // Set the voice
    voiceSystem.settings.piperModel = voiceId;
    voiceSystem.saveSettings();

    // Preview it
    await voiceSystem.previewVoice({ backend: 'piper', id: voiceId }, sampleType);

    // Mark as active
    document.querySelectorAll('.voice-pick').forEach(b => b.classList.remove('playing'));
    if (btn) btn.classList.add('active');

    // Also update the main voice grid if visible
    document.querySelectorAll('.voice-card').forEach(card => {
      card.classList.remove('selected');
      card.querySelector('.voice-active')?.remove();
    });
    const voiceCard = document.querySelector(`[data-voice="${voiceId}"]`);
    if (voiceCard) {
      voiceCard.classList.add('selected');
      voiceCard.insertAdjacentHTML('beforeend', '<span class="voice-active">✓ Active</span>');
    }
  }

  /**
   * Run a voice showdown - play all recommended voices back-to-back
   */
  async runVoiceShowdown() {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    const recommendedVoices = [
      { id: 'en_US-lessac-high', name: 'Lessac' },
      { id: 'en_GB-jenny_dioco-medium', name: 'Jenny' },
      { id: 'en_US-amy-medium', name: 'Amy' },
      { id: 'en_US-kristin-medium', name: 'Kristin' }
    ];

    const compareBtn = document.querySelector('.compare-btn');
    if (compareBtn) {
      compareBtn.disabled = true;
      compareBtn.textContent = '🔄 Playing...';
    }

    const sampleText = "Hello darling. Let's see what you're made of.";

    for (const voice of recommendedVoices) {
      // Update UI to show current voice
      document.querySelectorAll('.voice-pick').forEach(btn => {
        btn.classList.remove('playing');
      });
      const btn = document.querySelector(`.voice-pick[onclick*="${voice.id}"]`);
      if (btn) btn.classList.add('playing');

      if (compareBtn) {
        compareBtn.textContent = `🔄 ${voice.name}...`;
      }

      // Speak with this voice
      const originalModel = voiceSystem.settings.piperModel;
      voiceSystem.settings.piperModel = voice.id;

      await voiceSystem.speak(sampleText, { priority: 'high' });

      // Wait a bit between voices
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // Restore UI
    document.querySelectorAll('.voice-pick').forEach(btn => {
      btn.classList.remove('playing');
    });
    if (compareBtn) {
      compareBtn.disabled = false;
      compareBtn.textContent = '🔄 Play All 4 Back-to-Back';
    }

    // Mark the current setting as active
    const currentVoice = voiceSystem.settings.piperModel;
    const activeBtn = document.querySelector(`.voice-pick[onclick*="${currentVoice}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  /**
   * Set the sample type for voice auditions
   */
  setAuditionSampleType(type) {
    this._auditionSampleType = type;
    // Update UI to show selected sample type
    document.querySelectorAll('.sample-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });
    console.log('Sample type set to:', type);
  }

  /**
   * Get current audition sample type
   */
  getAuditionSampleType() {
    return this._auditionSampleType || 'medium';
  }

  // ═══════════════════════════════════════════════════════════════
  // VOICE LAB - Experimental Features
  // ═══════════════════════════════════════════════════════════════

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
  }

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
      'en_GB-aru-medium': 12
    };
    const max = speakerCounts[modelId] || 50;
    this.selectMultiSpeakerModel(modelId, max);
  }

  /**
   * Preview the current lab speaker
   */
  async labPreviewSpeaker() {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    const model = this._labModel || 'en_GB-vctk-medium';
    const speakerId = parseInt(document.getElementById('labSpeakerId')?.value || 0);

    // Temporarily set model and speaker
    const originalModel = voiceSystem.settings.piperModel;
    const originalSpeaker = voiceSystem.settings.piperSpeakerId;

    voiceSystem.settings.piperModel = model;
    voiceSystem.settings.piperSpeakerId = speakerId;

    await voiceSystem.speak("Hello darling. Shall we explore something interesting together?", { priority: 'high' });

    // Don't restore - let them hear what they selected
  }

  /**
   * Pick a random speaker from the current lab model
   */
  async labRandomSpeaker() {
    const slider = document.getElementById('labSpeakerId');
    if (!slider) return;

    const max = parseInt(slider.max);
    const randomId = Math.floor(Math.random() * (max + 1));
    slider.value = randomId;
    document.getElementById('labSpeakerIdVal').textContent = randomId;

    await this.labPreviewSpeaker();
  }

  /**
   * Go to previous speaker
   */
  async labPrevSpeaker() {
    const slider = document.getElementById('labSpeakerId');
    if (!slider) return;

    let current = parseInt(slider.value);
    if (current > 0) {
      current--;
      slider.value = current;
      document.getElementById('labSpeakerIdVal').textContent = current;
      await this.labPreviewSpeaker();
    }
  }

  /**
   * Go to next speaker
   */
  async labNextSpeaker() {
    const slider = document.getElementById('labSpeakerId');
    if (!slider) return;

    let current = parseInt(slider.value);
    const max = parseInt(slider.max);
    if (current < max) {
      current++;
      slider.value = current;
      document.getElementById('labSpeakerIdVal').textContent = current;
      await this.labPreviewSpeaker();
    }
  }

  /**
   * Adopt the current lab voice as Ms. Luminara's voice
   */
  adoptLabVoice() {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    const model = this._labModel || voiceSystem.settings.piperModel;
    const speakerId = parseInt(document.getElementById('labSpeakerId')?.value || 0);

    voiceSystem.settings.piperModel = model;
    voiceSystem.settings.piperSpeakerId = speakerId;
    voiceSystem.saveSettings();

    // Refresh the settings panel
    this.showVoiceSettings();

    // Confirm with voice
    voiceSystem.speak("This is my voice now. Do you like it?", { priority: 'high' });
  }

  /**
   * Toggle voice roulette mode (random speaker each sentence)
   */
  toggleVoiceRoulette(enabled) {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    voiceSystem.settings.voiceRouletteEnabled = enabled;
    voiceSystem.saveSettings();

    if (enabled) {
      voiceSystem.speak("Voice roulette activated! Each sentence will be a surprise.", { priority: 'high' });
    }
  }

  /**
   * Toggle scene mode (context-aware voice changes)
   */
  toggleSceneMode(enabled) {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    voiceSystem.settings.sceneModeEnabled = enabled;
    voiceSystem.saveSettings();

    const mappings = document.querySelector('.scene-mappings');
    if (mappings) {
      mappings.classList.toggle('disabled', !enabled);
    }
  }

  /**
   * Set voice for a specific scene type
   */
  setSceneVoice(sceneType, voiceStyle) {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    if (!voiceSystem.settings.sceneVoices) {
      voiceSystem.settings.sceneVoices = {};
    }
    voiceSystem.settings.sceneVoices[sceneType] = voiceStyle;
    voiceSystem.saveSettings();
  }

  /**
   * Save current settings as a named "cocktail"
   */
  saveVoiceCocktail() {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    // Try to get name from input, or prompt for one
    let nameInput = document.getElementById('cocktailName');
    let name = nameInput?.value?.trim();

    if (!name) {
      // Generate a name based on current settings
      const model = voiceSystem.settings.piperModel || 'voice';
      const speaker = voiceSystem.settings.piperSpeakerId || 0;
      name = `${model.split('-')[1]}-${speaker}`;

      // Ask user to confirm/rename
      name = prompt('Name this voice preset:', name);
      if (!name) return;
    }

    // Get current settings
    const cocktail = {
      name,
      model: voiceSystem.settings.piperModel,
      speakerId: voiceSystem.settings.piperSpeakerId || 0,
      rate: voiceSystem.settings.rate,
      volume: voiceSystem.settings.volume,
      piperLengthScale: voiceSystem.settings.piperLengthScale,
      piperNoiseScale: voiceSystem.settings.piperNoiseScale,
      piperNoiseW: voiceSystem.settings.piperNoiseW,
      createdAt: Date.now()
    };

    // Load existing cocktails
    let cocktails = [];
    try {
      cocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {}

    // Add new one (limit to 10)
    cocktails.unshift(cocktail);
    if (cocktails.length > 10) cocktails = cocktails.slice(0, 10);

    localStorage.setItem('ms_luminara_cocktails', JSON.stringify(cocktails));

    // Clear input and refresh display
    if (nameInput) nameInput.value = '';
    this.renderSavedCocktails();

    voiceSystem.speak(`Voice cocktail "${name}" saved!`, { priority: 'high' });
  }

  /**
   * Load a saved voice cocktail
   */
  loadVoiceCocktail(index) {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    let cocktails = [];
    try {
      cocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {}

    const cocktail = cocktails[index];
    if (!cocktail) return;

    // Apply settings
    voiceSystem.settings.piperModel = cocktail.model;
    voiceSystem.settings.piperSpeakerId = cocktail.speakerId || 0;
    voiceSystem.settings.rate = cocktail.rate;
    voiceSystem.settings.volume = cocktail.volume;
    voiceSystem.settings.piperLengthScale = cocktail.piperLengthScale;
    voiceSystem.settings.piperNoiseScale = cocktail.piperNoiseScale;
    voiceSystem.settings.piperNoiseW = cocktail.piperNoiseW;
    voiceSystem.saveSettings();

    // Refresh and test
    this.showVoiceSettings();
    voiceSystem.speak(`${cocktail.name}. How do I sound?`, { priority: 'high' });
  }

  /**
   * Delete a saved cocktail
   */
  deleteCocktail(index) {
    let cocktails = [];
    try {
      cocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {}

    cocktails.splice(index, 1);
    localStorage.setItem('ms_luminara_cocktails', JSON.stringify(cocktails));
    this.renderSavedCocktails();
  }

  /**
   * Render saved cocktails in the UI
   */
  renderSavedCocktails() {
    const container = document.getElementById('savedCocktails');
    if (!container) return;

    let cocktails = [];
    try {
      cocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {}

    if (cocktails.length === 0) {
      container.innerHTML = '<p class="no-cocktails">No saved cocktails yet</p>';
      return;
    }

    container.innerHTML = cocktails.map((c, i) => `
      <div class="saved-cocktail-item">
        <span class="cocktail-name" onclick="quiz.renderer.loadVoiceCocktail(${i})">
          🍸 ${c.name}
        </span>
        <span class="cocktail-delete" onclick="quiz.renderer.deleteCocktail(${i})">✕</span>
      </div>
    `).join('');

    // Also populate the blend selects
    this.populateBlendSelects(cocktails);
  }

  /**
   * Populate the voice blender dropdowns
   */
  populateBlendSelects(cocktails = null) {
    if (!cocktails) {
      try {
        cocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
      } catch (e) {
        cocktails = [];
      }
    }

    const selectA = document.getElementById('blendVoiceA');
    const selectB = document.getElementById('blendVoiceB');
    if (!selectA || !selectB) return;

    const options = cocktails.map((c, i) =>
      `<option value="${i}">${c.name} (${c.model.split('-')[1]} #${c.speakerId || 0})</option>`
    ).join('');

    selectA.innerHTML = '<option value="">Voice A...</option>' + options;
    selectB.innerHTML = '<option value="">Voice B...</option>' + options;
  }

  // Blend sample scripts for different moods
  blendSampleScripts = {
    action: `Time is running out! We need to move, now! Every second counts, and I won't let you fall behind. Stay sharp, stay focused, and follow my lead.`,

    suspense: `Did you hear that? No, don't turn around. Something is watching us from the shadows. I can feel it. Keep your voice low, and whatever you do, don't. Stop. Moving.`,

    seductive: `Well, well. Look who finally showed up. I've been waiting for you, you know. Come closer. Let me show you something absolutely fascinating. I promise you won't be disappointed.`,

    nurturing: `You're doing wonderfully, darling. I know this feels difficult right now, but I believe in you completely. Take a deep breath. We'll work through this together, one step at a time. You've got this.`,

    showcase: `Welcome to my study session, darling. I'm Miss Luminara, and I'll be your guide through the labyrinth of knowledge today. Some find me encouraging, others find me delightfully insufferable, but everyone agrees on one thing: I make learning unforgettable. Whether we're diving into the intricacies of cellular biology or untangling the mysteries of neuroanatomy, I'll be right here, equal parts teacher, cheerleader, and affectionate tormentor. Now then, shall we see what that beautiful brain of yours is capable of? I have a feeling you're going to surprise both of us.`
  };

  // Current blend sample selection
  _blendSampleType = 'action';

  /**
   * Set the blend sample script type
   */
  setBlendSample(type) {
    this._blendSampleType = type;
    document.querySelectorAll('.blend-sample-btns .sample-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sample === type);
    });
  }

  /**
   * Get the current blend sample text
   */
  getBlendSampleText() {
    return this.blendSampleScripts[this._blendSampleType] || this.blendSampleScripts.action;
  }

  /**
   * Sync phase slider to number input
   */
  syncPhaseInput(which, value) {
    const numInput = document.getElementById(`phaseOffset${which}Num`);
    if (numInput) numInput.value = value;
  }

  /**
   * Sync phase number input to slider
   */
  syncPhaseSlider(which, value) {
    const slider = document.getElementById(`phaseOffset${which}`);
    let val = parseInt(value) || 0;
    val = Math.max(-180, Math.min(180, val));
    if (slider) slider.value = val;
  }

  /**
   * Sync delay slider to number input
   */
  syncDelayInput(which, value) {
    const numInput = document.getElementById(`timeDelay${which}Num`);
    if (numInput) numInput.value = value;
  }

  /**
   * Sync delay number input to slider
   */
  syncDelaySlider(which, value) {
    const slider = document.getElementById(`timeDelay${which}`);
    let val = parseInt(value) || 0;
    val = Math.max(-200, Math.min(200, val));
    if (slider) slider.value = val;
  }

  /**
   * Reset phase and delay sliders to 0
   */
  resetPhaseOffsets() {
    ['A', 'B'].forEach(which => {
      const phaseSlider = document.getElementById(`phaseOffset${which}`);
      const phaseNum = document.getElementById(`phaseOffset${which}Num`);
      const delaySlider = document.getElementById(`timeDelay${which}`);
      const delayNum = document.getElementById(`timeDelay${which}Num`);
      if (phaseSlider) phaseSlider.value = 0;
      if (phaseNum) phaseNum.value = 0;
      if (delaySlider) delaySlider.value = 0;
      if (delayNum) delayNum.value = 0;
    });
  }

  // ==========================================================================
  // ADVANCED MORPH CONTROLS
  // ==========================================================================

  // Debounce timer for real-time preview
  _morphPreviewTimeout = null;

  /**
   * Handle morph parameter changes with real-time preview
   */
  onMorphParamChange(param, value) {
    // Update UI displays
    switch (param) {
      case 'ratio':
        document.getElementById('blendRatioVal').textContent = value + '%';
        break;
      case 'formant_ratio':
        document.getElementById('formantRatioVal').textContent = value + '%';
        break;
      case 'formant_shift_a':
        document.getElementById('formantShiftAVal').textContent = value + ' st';
        break;
      case 'formant_shift_b':
        document.getElementById('formantShiftBVal').textContent = value + ' st';
        break;
      case 'transient_threshold':
        document.getElementById('transientThresholdVal').textContent = value.toFixed(1);
        break;
    }

    // Trigger debounced real-time preview
    this.triggerRealtimePreview();
  }

  /**
   * Trigger real-time preview with debounce
   */
  triggerRealtimePreview() {
    // Clear existing timeout
    if (this._morphPreviewTimeout) {
      clearTimeout(this._morphPreviewTimeout);
    }

    // Show "updating" indicator
    const progressEl = document.getElementById('blendProgress');
    const progressText = document.getElementById('blendProgressText');
    if (progressEl) {
      progressEl.style.display = 'block';
      if (progressText) progressText.textContent = 'Updating preview...';
    }

    // Debounce: wait 300ms before regenerating
    this._morphPreviewTimeout = setTimeout(() => {
      // Only preview if both voices are selected
      const selectA = document.getElementById('blendVoiceA');
      const selectB = document.getElementById('blendVoiceB');
      if (selectA?.value && selectB?.value) {
        this.previewBlend(true);  // true = quick mode
      } else {
        if (progressEl) progressEl.style.display = 'none';
      }
    }, 300);
  }

  /**
   * Gather all morph parameters from UI
   */
  gatherMorphParams() {
    const ratio = parseInt(document.getElementById('blendRatio')?.value || 50) / 100;

    return {
      ratio: ratio,
      mode: document.getElementById('blendMode')?.value || 'source_filter',

      // Formant
      formant_ratio: parseInt(document.getElementById('formantRatio')?.value || 50) / 100,
      formant_shift_a: parseInt(document.getElementById('formantShiftA')?.value || 0),
      formant_shift_b: parseInt(document.getElementById('formantShiftB')?.value || 0),
      lpc_order: parseInt(document.getElementById('lpcOrder')?.value || 14),

      // Pitch alignment
      pitch_align: document.getElementById('pitchAlign')?.checked || false,
      pitch_target: document.querySelector('input[name="pitchTarget"]:checked')?.value || 'avg',

      // Phase & timing
      phase_offset_a: (parseInt(document.getElementById('phaseOffsetA')?.value || 0)) * Math.PI / 180,
      phase_offset_b: (parseInt(document.getElementById('phaseOffsetB')?.value || 0)) * Math.PI / 180,
      time_delay_a: parseInt(document.getElementById('timeDelayA')?.value || 0),
      time_delay_b: parseInt(document.getElementById('timeDelayB')?.value || 0),

      // Transient & perceptual
      transient_mode: document.getElementById('transientMode')?.value || 'max',
      transient_threshold: parseInt(document.getElementById('transientThreshold')?.value || 20) / 10,
      perceptual_weight: document.getElementById('perceptualWeight')?.checked !== false,
      vertical_phase_lock: document.getElementById('verticalPhaseLock')?.checked !== false,
      window_adaptive: document.getElementById('windowAdaptive')?.checked !== false
    };
  }

  /**
   * Apply preset and immediately preview
   */
  async applyPreset(presetName) {
    // Update button states
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === presetName);
    });

    // Load the preset
    await this.loadMorphPreset(presetName);

    // Auto-preview after applying preset
    this.previewBlend(false);
  }

  /**
   * Load a morph preset
   */
  async loadMorphPreset(presetName) {
    if (!presetName) {
      // "Custom" selected - don't change anything
      return;
    }

    try {
      const response = await fetch(`http://localhost:5500/blend/presets/${presetName}`);
      if (!response.ok) return;

      const preset = await response.json();
      const params = preset.parameters || {};

      // Apply parameters to UI
      if (params.mode) {
        const modeSelect = document.getElementById('blendMode');
        if (modeSelect) modeSelect.value = params.mode;
      }

      if (params.formant_ratio !== undefined && params.formant_ratio !== null) {
        const slider = document.getElementById('formantRatio');
        if (slider) {
          slider.value = params.formant_ratio * 100;
          this.onMorphParamChange('formant_ratio', params.formant_ratio * 100);
        }
      }

      if (params.pitch_align !== undefined) {
        const checkbox = document.getElementById('pitchAlign');
        if (checkbox) checkbox.checked = params.pitch_align;
      }

      if (params.pitch_target) {
        const radio = document.querySelector(`input[name="pitchTarget"][value="${params.pitch_target}"]`);
        if (radio) radio.checked = true;
      }

      if (params.transient_mode) {
        const select = document.getElementById('transientMode');
        if (select) select.value = params.transient_mode;
      }

      if (params.transient_threshold !== undefined) {
        const slider = document.getElementById('transientThreshold');
        if (slider) {
          slider.value = params.transient_threshold * 10;
          this.onMorphParamChange('transient_threshold', params.transient_threshold);
        }
      }

      if (params.perceptual_weight !== undefined) {
        const checkbox = document.getElementById('perceptualWeight');
        if (checkbox) checkbox.checked = params.perceptual_weight;
      }

      if (params.vertical_phase_lock !== undefined) {
        const checkbox = document.getElementById('verticalPhaseLock');
        if (checkbox) checkbox.checked = params.vertical_phase_lock;
      }

      if (params.window_adaptive !== undefined) {
        const checkbox = document.getElementById('windowAdaptive');
        if (checkbox) checkbox.checked = params.window_adaptive;
      }

      console.log(`Loaded preset: ${preset.name}`);

    } catch (e) {
      console.error('Failed to load preset:', e);
    }
  }

  /**
   * Save current morph settings as a preset
   */
  async saveMorphPreset() {
    const name = prompt('Enter preset name:');
    if (!name || !name.trim()) return;

    const safeName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const params = this.gatherMorphParams();

    // Remove phase/delay offsets from preset (those are voice-specific)
    delete params.phase_offset_a;
    delete params.phase_offset_b;
    delete params.time_delay_a;
    delete params.time_delay_b;

    try {
      const response = await fetch(`http://localhost:5500/blend/presets/${safeName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: `User preset created ${new Date().toLocaleDateString()}`,
          author: 'user',
          parameters: params
        })
      });

      if (response.ok) {
        alert(`Preset "${name}" saved!`);

        // Add to preset dropdown
        const select = document.getElementById('morphPreset');
        if (select) {
          const option = document.createElement('option');
          option.value = safeName;
          option.textContent = name;
          select.appendChild(option);
          select.value = safeName;
        }
      } else {
        alert('Failed to save preset');
      }
    } catch (e) {
      console.error('Failed to save preset:', e);
      alert('Failed to save preset: ' + e.message);
    }
  }

  /**
   * Auto-find optimal phase alignment using PARALLEL batch search
   * Uses Wheatstone bridge differential scoring to filter chaotic interference
   */
  async autoFindPhase() {
    console.log('autoFindPhase called - using parallel batch search');

    const selectA = document.getElementById('blendVoiceA');
    const selectB = document.getElementById('blendVoiceB');

    console.log('Voice A:', selectA?.value, 'Voice B:', selectB?.value);

    if (!selectA?.value || !selectB?.value) {
      alert('Please select two voices first');
      return;
    }

    const autoBtn = document.querySelector('.phase-btn.auto');
    if (autoBtn) {
      autoBtn.disabled = true;
      autoBtn.textContent = '🔍 Searching...';
    }

    this.updateBlendProgress(0, 'Generating test audio...', true);
    console.log('Starting parallel phase search...');

    try {
      // Get current settings
      let cocktails = [];
      try {
        cocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
      } catch (e) {}

      const idxA = parseInt(selectA.value, 10);
      const idxB = parseInt(selectB.value, 10);
      const cocktailA = cocktails[idxA];
      const cocktailB = cocktails[idxB];

      if (!cocktailA || !cocktailB) {
        throw new Error('Invalid voice selections - please save cocktails first');
      }

      const ratioSlider = document.getElementById('blendRatio');
      const ratio = parseFloat(ratioSlider?.value || 50) / 100;

      // Use a short test phrase for faster searching
      const testText = "Hello darling, testing phase alignment.";

      // Coarse search: every 15 degrees (more granular since it's now fast)
      const coarseAngles = [];
      for (let deg = -180; deg <= 180; deg += 15) {
        coarseAngles.push(deg);
      }

      this.updateBlendProgress(10, `Coarse search: ${coarseAngles.length} angles in parallel...`);

      // PARALLEL batch search - all coarse angles at once
      const coarseResponse = await fetch('http://localhost:5500/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceA: {
            model: cocktailA.model,
            speaker_id: cocktailA.speakerId || 0,
            length_scale: cocktailA.piperLengthScale || 1.0,
            noise_scale: cocktailA.piperNoiseScale || 0.667,
            noise_w: cocktailA.piperNoiseW || 0.8
          },
          voiceB: {
            model: cocktailB.model,
            speaker_id: cocktailB.speakerId || 0,
            length_scale: cocktailB.piperLengthScale || 1.0,
            noise_scale: cocktailB.piperNoiseScale || 0.667,
            noise_w: cocktailB.piperNoiseW || 0.8
          },
          ratio: ratio,
          searchType: 'phase',
          searchValues: coarseAngles
        })
      });

      if (!coarseResponse.ok) {
        throw new Error(`Coarse search failed: ${coarseResponse.status}`);
      }

      const coarseResult = await coarseResponse.json();
      console.log('Coarse search results:', coarseResult);

      // Wheatstone bridge filter: identify stable regions by checking neighbors
      // A good phase has consistent scores with its neighbors (not chaotic)
      const stableResults = this.filterWheatstonePhase(coarseResult.results);

      let bestCoarse = coarseResult.best;
      if (stableResults.length > 0) {
        // Prefer the most stable high-scoring result
        bestCoarse = stableResults[0];
        console.log(`Wheatstone filter selected: ${bestCoarse.value}° (stability-adjusted)`);
      }

      this.updateBlendProgress(50, `Best coarse: ${bestCoarse.value}° - fine searching...`);

      // Fine search around best coarse result: +/- 10 degrees in 2 degree steps
      const fineAngles = [];
      for (let deg = bestCoarse.value - 10; deg <= bestCoarse.value + 10; deg += 2) {
        if (deg >= -180 && deg <= 180) {
          fineAngles.push(deg);
        }
      }

      // PARALLEL batch search - all fine angles at once
      const fineResponse = await fetch('http://localhost:5500/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceA: {
            model: cocktailA.model,
            speaker_id: cocktailA.speakerId || 0,
            length_scale: cocktailA.piperLengthScale || 1.0,
            noise_scale: cocktailA.piperNoiseScale || 0.667,
            noise_w: cocktailA.piperNoiseW || 0.8
          },
          voiceB: {
            model: cocktailB.model,
            speaker_id: cocktailB.speakerId || 0,
            length_scale: cocktailB.piperLengthScale || 1.0,
            noise_scale: cocktailB.piperNoiseScale || 0.667,
            noise_w: cocktailB.piperNoiseW || 0.8
          },
          ratio: ratio,
          searchType: 'phase',
          searchValues: fineAngles
        })
      });

      let bestPhaseB = bestCoarse.value;
      let bestScore = bestCoarse.score;

      if (fineResponse.ok) {
        const fineResult = await fineResponse.json();
        console.log('Fine search results:', fineResult);

        // Apply Wheatstone filter to fine results too
        const stableFine = this.filterWheatstonePhase(fineResult.results);
        if (stableFine.length > 0 && stableFine[0].score > bestScore) {
          bestPhaseB = stableFine[0].value;
          bestScore = stableFine[0].score;
        } else if (fineResult.best.score > bestScore) {
          bestPhaseB = fineResult.best.value;
          bestScore = fineResult.best.score;
        }
      }

      console.log(`Search complete. Best phase: ${bestPhaseB}°, score: ${bestScore}`);

      if (bestScore === -Infinity) {
        this.updateBlendProgress(0, 'Search failed - server may need restart', true);
        alert('Phase search failed. Please restart the TTS server.');
        return;
      }

      // Apply best phase
      this.updateBlendProgress(95, `Found optimal: B = ${bestPhaseB}°`);

      // Set the sliders
      const sliderA = document.getElementById('phaseOffsetA');
      const sliderB = document.getElementById('phaseOffsetB');
      const numA = document.getElementById('phaseOffsetANum');
      const numB = document.getElementById('phaseOffsetBNum');

      if (sliderA) sliderA.value = 0;
      if (numA) numA.value = 0;
      if (sliderB) sliderB.value = bestPhaseB;
      if (numB) numB.value = bestPhaseB;

      this.updateBlendProgress(100, `Optimal phase: B = ${bestPhaseB}° (score: ${bestScore.toFixed(3)})`);

      // Preview with optimal phase
      setTimeout(() => this.previewBlend(), 500);

    } catch (e) {
      console.error('Auto phase search failed:', e);
      this.updateBlendProgress(0, 'Search failed: ' + e.message, true);
    } finally {
      if (autoBtn) {
        autoBtn.disabled = false;
        autoBtn.textContent = '🔍 Auto Phase';
      }
    }
  }

  /**
   * Wheatstone bridge filter for phase results
   * Identifies stable regions where neighboring values have consistent scores
   * This filters out chaotic interference peaks that are unreliable
   */
  filterWheatstonePhase(results) {
    if (results.length < 3) return results;

    // Sort by value to get neighbors
    const sorted = [...results].sort((a, b) => a.value - b.value);

    // Calculate stability score for each result based on neighbors
    const withStability = sorted.map((r, i) => {
      let stability = 0;
      let neighborCount = 0;

      // Check left neighbor
      if (i > 0) {
        const diff = Math.abs(r.score - sorted[i - 1].score);
        stability += 1 / (1 + diff * 5); // Low diff = high stability
        neighborCount++;
      }

      // Check right neighbor
      if (i < sorted.length - 1) {
        const diff = Math.abs(r.score - sorted[i + 1].score);
        stability += 1 / (1 + diff * 5);
        neighborCount++;
      }

      stability = neighborCount > 0 ? stability / neighborCount : 0;

      // Combined score: original score weighted by stability
      // High score + high stability = good candidate
      const combinedScore = r.score * 0.7 + stability * 0.3;

      return { ...r, stability, combinedScore };
    });

    // Sort by combined score (best first)
    return withStability.sort((a, b) => b.combinedScore - a.combinedScore);
  }

  /**
   * Wheatstone bridge filter for delay results
   * Similar to phase filter - identifies stable regions and filters chaotic peaks
   */
  filterWheatstoneDelay(results) {
    if (results.length < 3) return results;

    // Sort by value (delay ms) to get neighbors
    const sorted = [...results].sort((a, b) => a.value - b.value);

    // Calculate stability score for each result based on neighbors
    const withStability = sorted.map((r, i) => {
      let stability = 0;
      let neighborCount = 0;

      // Check left neighbor
      if (i > 0) {
        const diff = Math.abs(r.score - sorted[i - 1].score);
        stability += 1 / (1 + diff * 5);
        neighborCount++;
      }

      // Check right neighbor
      if (i < sorted.length - 1) {
        const diff = Math.abs(r.score - sorted[i + 1].score);
        stability += 1 / (1 + diff * 5);
        neighborCount++;
      }

      stability = neighborCount > 0 ? stability / neighborCount : 0;

      // Combined score: original score weighted by stability
      const combinedScore = r.score * 0.7 + stability * 0.3;

      return { ...r, stability, combinedScore };
    });

    // Sort by combined score (best first)
    return withStability.sort((a, b) => b.combinedScore - a.combinedScore);
  }

  /**
   * Auto-find optimal time delay alignment using PARALLEL batch search
   * Uses Wheatstone bridge differential scoring to filter chaotic interference
   */
  async autoFindDelay() {
    console.log('autoFindDelay called - using parallel batch search');

    const selectA = document.getElementById('blendVoiceA');
    const selectB = document.getElementById('blendVoiceB');

    if (!selectA?.value || !selectB?.value) {
      alert('Please select two voices first');
      return;
    }

    const autoBtn = document.querySelectorAll('.phase-btn.auto')[1]; // Second auto button
    if (autoBtn) {
      autoBtn.disabled = true;
      autoBtn.textContent = '🔍 Searching...';
    }

    this.updateBlendProgress(0, 'Generating test audio...', true);

    try {
      let cocktails = [];
      try {
        cocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
      } catch (e) {}

      const idxA = parseInt(selectA.value, 10);
      const idxB = parseInt(selectB.value, 10);
      const cocktailA = cocktails[idxA];
      const cocktailB = cocktails[idxB];

      if (!cocktailA || !cocktailB) {
        throw new Error('Invalid voice selections - please save cocktails first');
      }

      const ratioSlider = document.getElementById('blendRatio');
      const ratio = parseFloat(ratioSlider?.value || 50) / 100;

      const testText = "Hello darling, testing delay alignment.";

      // Coarse search: -100ms to +100ms in 5ms steps (more granular since parallel)
      const coarseDelays = [];
      for (let ms = -100; ms <= 100; ms += 5) {
        coarseDelays.push(ms);
      }

      this.updateBlendProgress(10, `Coarse search: ${coarseDelays.length} delays in parallel...`);

      // PARALLEL batch search - all coarse delays at once
      const coarseResponse = await fetch('http://localhost:5500/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceA: {
            model: cocktailA.model,
            speaker_id: cocktailA.speakerId || 0,
            length_scale: cocktailA.piperLengthScale || 1.0,
            noise_scale: cocktailA.piperNoiseScale || 0.667,
            noise_w: cocktailA.piperNoiseW || 0.8
          },
          voiceB: {
            model: cocktailB.model,
            speaker_id: cocktailB.speakerId || 0,
            length_scale: cocktailB.piperLengthScale || 1.0,
            noise_scale: cocktailB.piperNoiseScale || 0.667,
            noise_w: cocktailB.piperNoiseW || 0.8
          },
          ratio: ratio,
          searchType: 'delay',
          searchValues: coarseDelays
        })
      });

      if (!coarseResponse.ok) {
        throw new Error(`Coarse search failed: ${coarseResponse.status}`);
      }

      const coarseResult = await coarseResponse.json();
      console.log('Coarse delay search results:', coarseResult);

      // Wheatstone bridge filter: identify stable regions
      const stableResults = this.filterWheatstoneDelay(coarseResult.results);

      let bestCoarse = coarseResult.best;
      if (stableResults.length > 0) {
        bestCoarse = stableResults[0];
        console.log(`Wheatstone filter selected: ${bestCoarse.value}ms (stability-adjusted)`);
      }

      this.updateBlendProgress(50, `Best coarse: ${bestCoarse.value}ms - fine searching...`);

      // Fine search around best coarse result: +/- 5ms in 1ms steps
      const fineDelays = [];
      for (let ms = bestCoarse.value - 5; ms <= bestCoarse.value + 5; ms += 1) {
        if (ms >= -200 && ms <= 200) {
          fineDelays.push(ms);
        }
      }

      // PARALLEL batch search - all fine delays at once
      const fineResponse = await fetch('http://localhost:5500/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceA: {
            model: cocktailA.model,
            speaker_id: cocktailA.speakerId || 0,
            length_scale: cocktailA.piperLengthScale || 1.0,
            noise_scale: cocktailA.piperNoiseScale || 0.667,
            noise_w: cocktailA.piperNoiseW || 0.8
          },
          voiceB: {
            model: cocktailB.model,
            speaker_id: cocktailB.speakerId || 0,
            length_scale: cocktailB.piperLengthScale || 1.0,
            noise_scale: cocktailB.piperNoiseScale || 0.667,
            noise_w: cocktailB.piperNoiseW || 0.8
          },
          ratio: ratio,
          searchType: 'delay',
          searchValues: fineDelays
        })
      });

      let bestDelayB = bestCoarse.value;
      let bestScore = bestCoarse.score;

      if (fineResponse.ok) {
        const fineResult = await fineResponse.json();
        console.log('Fine delay search results:', fineResult);

        // Apply Wheatstone filter to fine results too
        const stableFine = this.filterWheatstoneDelay(fineResult.results);
        if (stableFine.length > 0 && stableFine[0].score > bestScore) {
          bestDelayB = stableFine[0].value;
          bestScore = stableFine[0].score;
        } else if (fineResult.best.score > bestScore) {
          bestDelayB = fineResult.best.value;
          bestScore = fineResult.best.score;
        }
      }

      console.log(`Delay search complete. Best delay: ${bestDelayB}ms, score: ${bestScore}`);

      if (bestScore === -Infinity) {
        this.updateBlendProgress(0, 'Search failed - server may need restart', true);
        alert('Delay search failed. Please restart the TTS server.');
        return;
      }

      // Apply best delay
      this.updateBlendProgress(95, `Found optimal: B = ${bestDelayB}ms`);

      const delaySliderA = document.getElementById('timeDelayA');
      const delaySliderB = document.getElementById('timeDelayB');
      const delayNumA = document.getElementById('timeDelayANum');
      const delayNumB = document.getElementById('timeDelayBNum');

      if (delaySliderA) delaySliderA.value = 0;
      if (delayNumA) delayNumA.value = 0;
      if (delaySliderB) delaySliderB.value = bestDelayB;
      if (delayNumB) delayNumB.value = bestDelayB;

      this.updateBlendProgress(100, `Optimal delay: B = ${bestDelayB}ms (score: ${bestScore.toFixed(3)})`);

      // Preview with optimal delay
      setTimeout(() => this.previewBlend(), 500);

    } catch (e) {
      console.error('Auto delay search failed:', e);
      this.updateBlendProgress(0, 'Search failed: ' + e.message, true);
    } finally {
      if (autoBtn) {
        autoBtn.disabled = false;
        autoBtn.textContent = '🔍 Auto Delay';
      }
    }
  }

  // Current cached blend ID
  _cachedBlendId = null;
  _cachedBlendAudio = null;

  // AbortController for cancelling in-flight preview requests
  _previewAbortController = null;

  // Current playing audio element (to stop on new preview)
  _currentAudio = null;

  /**
   * Update blend progress UI
   */
  updateBlendProgress(percent, message, show = true) {
    const progressDiv = document.getElementById('blendProgress');
    const progressFill = document.getElementById('blendProgressFill');
    const progressText = document.getElementById('blendProgressText');

    if (progressDiv) {
      progressDiv.style.display = show ? 'block' : 'none';
    }
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
    if (progressText) {
      progressText.textContent = message;
    }
  }

  /**
   * Preview the blended voice with progress tracking
   * @param {boolean} quickMode - If true, use quick/low-quality mode for real-time preview
   */
  async previewBlend(quickMode = false) {
    const selectA = document.getElementById('blendVoiceA');
    const selectB = document.getElementById('blendVoiceB');

    const indexA = selectA?.value;
    const indexB = selectB?.value;

    if (!indexA || !indexB) {
      if (!quickMode) alert('Please select two voices to blend');
      return;
    }

    let cocktails = [];
    try {
      cocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {}

    const cocktailA = cocktails[parseInt(indexA)];
    const cocktailB = cocktails[parseInt(indexB)];

    if (!cocktailA || !cocktailB) {
      if (!quickMode) alert('Could not load selected voices');
      return;
    }

    // Gather all morph parameters from UI
    const morphParams = this.gatherMorphParams();
    const sampleText = this.getBlendSampleText();

    console.log('Morphing:', cocktailA.name, '+', cocktailB.name);
    console.log('Parameters:', morphParams);
    console.log('Quick mode:', quickMode);

    // Show progress UI
    this.updateBlendProgress(0, quickMode ? 'Quick preview...' : 'Starting morph...', true);

    const previewBtn = document.getElementById('previewBlendBtn');
    const replayBtn = document.getElementById('replayBlendBtn');
    const clearBtn = document.getElementById('clearBlendBtn');

    if (previewBtn && !quickMode) {
      previewBtn.disabled = true;
      previewBtn.textContent = '⏳ Processing...';
    }

    try {
      // Stop any currently playing audio
      this.stopBlendAudio();

      // Cancel any in-flight preview request
      if (this._previewAbortController) {
        this._previewAbortController.abort();
      }
      this._previewAbortController = new AbortController();
      const currentRequestId = Date.now(); // Track this request
      this._currentPreviewRequestId = currentRequestId;

      // Start the blend request using ADVANCED endpoint
      this.updateBlendProgress(5, 'Sending request...');

      const response = await fetch('http://localhost:5500/blend-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voiceA: {
            model: cocktailA.model,
            speaker_id: cocktailA.speakerId || 0,
            length_scale: cocktailA.piperLengthScale || 1.0,
            noise_scale: cocktailA.piperNoiseScale || 0.667,
            noise_w: cocktailA.piperNoiseW || 0.8
          },
          voiceB: {
            model: cocktailB.model,
            speaker_id: cocktailB.speakerId || 0,
            length_scale: cocktailB.piperLengthScale || 1.0,
            noise_scale: cocktailB.piperNoiseScale || 0.667,
            noise_w: cocktailB.piperNoiseW || 0.8
          },
          // All advanced morph parameters
          ...morphParams,
          quick_mode: quickMode
        }),
        signal: this._previewAbortController.signal
      });

      // Check if this request is still the latest one
      if (this._currentPreviewRequestId !== currentRequestId) {
        console.log('Stale request ignored:', currentRequestId);
        return; // A newer request superseded this one
      }

      // Get blend ID from header
      const blendId = response.headers.get('X-Blend-Id');
      console.log('Blend ID:', blendId);

      // Poll for progress while waiting
      if (blendId) {
        this._cachedBlendId = blendId;

        // Simple progress simulation since request is in-flight
        let progressSim = 10;
        const progressInterval = setInterval(() => {
          if (progressSim < 85) {
            progressSim += Math.random() * 15;
            const messages = [
              'Generating Voice A...',
              'Generating Voice B...',
              'Aligning phases...',
              'Blending audio...',
              'Processing...'
            ];
            this.updateBlendProgress(progressSim, messages[Math.floor(Math.random() * messages.length)]);
          }
        }, 300);

        // Wait for response
        if (!response.ok) {
          clearInterval(progressInterval);
          let errMsg = 'Blend request failed';
          try {
            const err = await response.json();
            errMsg = err.error || errMsg;
          } catch (e) {}
          throw new Error(errMsg);
        }

        clearInterval(progressInterval);
      }

      this.updateBlendProgress(90, 'Receiving audio...');

      // Get the blended audio
      const audioBlob = await response.blob();
      console.log('Received audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);

      if (audioBlob.size < 100) {
        throw new Error('Audio response too small - server may have failed');
      }

      // Cache the audio locally for replay
      this._cachedBlendAudio = audioBlob;

      this.updateBlendProgress(95, 'Playing...');

      // Play the audio
      await this.playBlendAudio(audioBlob);

      this.updateBlendProgress(100, 'Complete!');

      // Show replay/clear buttons
      if (replayBtn) replayBtn.style.display = 'inline-block';
      if (clearBtn) clearBtn.style.display = 'inline-block';

      // Hide progress after a moment
      setTimeout(() => {
        this.updateBlendProgress(100, 'Cached - ready for replay', true);
      }, 1000);

    } catch (e) {
      // Ignore abort errors (expected when newer request supersedes)
      if (e.name === 'AbortError') {
        console.log('Preview request aborted (newer request pending)');
        return;
      }
      console.error('Blend error:', e);
      this.updateBlendProgress(0, 'Error: ' + e.message, true);
      if (!quickMode) {
        alert('Blend failed: ' + e.message);
      }
    } finally {
      if (previewBtn) {
        previewBtn.disabled = false;
        previewBtn.textContent = '▶ Preview Blend';
      }
    }
  }

  /**
   * Stop any currently playing blend audio
   */
  stopBlendAudio() {
    if (this._currentAudio) {
      try {
        this._currentAudio.pause();
        // Only set currentTime if audio is loaded enough
        if (this._currentAudio.readyState >= 1) {
          this._currentAudio.currentTime = 0;
        }
      } catch (e) {
        // Audio may already be disposed
        console.debug('Audio stop warning:', e.message);
      }
      if (this._currentAudio._blobUrl) {
        URL.revokeObjectURL(this._currentAudio._blobUrl);
      }
      this._currentAudio = null;
    }
  }

  // ==========================================================================
  // XTTS Voice Lab Methods (True Embedding-Space Voice Blending)
  // ==========================================================================

  /**
   * Initialize XTTS UI when voice settings panel opens
   */
  async initXttsUI() {
    const statusEl = document.getElementById('xttsStatus');
    const controlsEl = document.getElementById('xttsControls');
    const loadBtn = document.getElementById('xttsLoadBtn');

    if (!statusEl) return;

    try {
      const response = await fetch('http://localhost:5500/xtts/status');
      const status = await response.json();

      if (status.available) {
        if (status.loaded) {
          statusEl.innerHTML = `
            <span class="xtts-status-icon">✓</span>
            <span class="xtts-status-text">XTTS Ready (GPU: ${status.gpu ? 'Yes' : 'No'})</span>
          `;
          statusEl.classList.add('ready');
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
          <span class="xtts-status-text">XTTS not available: ${status.error || 'Unknown error'}</span>
        `;
        loadBtn.style.display = 'none';
        controlsEl.style.display = 'none';
      }
    } catch (e) {
      statusEl.innerHTML = `
        <span class="xtts-status-icon">❌</span>
        <span class="xtts-status-text">Cannot connect to TTS server</span>
      `;
    }
  }

  /**
   * Load the XTTS model into GPU memory
   */
  async loadXttsModel() {
    const loadBtn = document.getElementById('xttsLoadBtn');
    const statusEl = document.getElementById('xttsStatus');

    if (loadBtn) loadBtn.disabled = true;
    if (statusEl) {
      statusEl.innerHTML = `
        <span class="xtts-status-icon">⏳</span>
        <span class="xtts-status-text">Loading XTTS model (this may take a minute)...</span>
      `;
    }

    try {
      const response = await fetch('http://localhost:5500/xtts/load', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        this.initXttsUI();
      } else {
        throw new Error(result.error || 'Load failed');
      }
    } catch (e) {
      if (statusEl) {
        statusEl.innerHTML = `
          <span class="xtts-status-icon">❌</span>
          <span class="xtts-status-text">Failed to load: ${e.message}</span>
        `;
      }
      if (loadBtn) loadBtn.disabled = false;
    }
  }

  /**
   * Load available XTTS voice samples
   */
  async loadXttsVoices() {
    const listEl = document.getElementById('xttsVoiceList');
    if (!listEl) return;

    try {
      const response = await fetch('http://localhost:5500/xtts/voices');
      const voices = await response.json();

      this._xttsVoices = voices;

      if (voices.length === 0) {
        listEl.innerHTML = '<p class="xtts-empty">No voice samples yet. Capture some from Piper!</p>';
      } else {
        listEl.innerHTML = voices.map(v => `
          <div class="xtts-voice-item" data-id="${v.id}">
            <input type="checkbox" class="xtts-voice-check" data-id="${v.id}" data-path="${v.path}"
                   onchange="quiz.renderer.updateXttsMixer()">
            <span class="xtts-voice-name">${v.name}</span>
            ${v.description ? `<span class="xtts-voice-desc">${v.description}</span>` : ''}
            <button class="xtts-voice-play" onclick="quiz.renderer.playXttsVoiceSolo('${v.id}')" title="Preview this voice">▶</button>
            <button class="xtts-voice-use" onclick="quiz.renderer.setActiveXttsVoice('${v.id}')" title="Use as active voice">★</button>
            <button class="xtts-voice-delete" onclick="quiz.renderer.deleteXttsVoice('${v.id}')" title="Delete">🗑️</button>
          </div>
        `).join('');
      }

      this.updateXttsMixer();

      // Restore active voice from VoiceSystem settings if XTTS is the backend
      if (voiceSystem?.settings?.backend === 'xtts' && voiceSystem.settings.xttsVoiceId) {
        const savedVoiceId = voiceSystem.settings.xttsVoiceId;
        // Check if this voice still exists
        if (voices.some(v => v.id === savedVoiceId)) {
          this._activeXttsVoice = savedVoiceId;
          this.updateActiveVoiceDisplay();
          // Highlight the active voice in the list
          document.querySelectorAll('.xtts-voice-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === savedVoiceId);
          });
          // Show quiz status
          const statusEl = document.getElementById('xttsQuizStatus');
          const voice = voices.find(v => v.id === savedVoiceId);
          if (statusEl && voice) {
            statusEl.textContent = `✓ Active: ${voice.name || savedVoiceId}`;
            statusEl.classList.add('active');
          }
        }
      }
    } catch (e) {
      listEl.innerHTML = `<p class="xtts-error">Error loading voices: ${e.message}</p>`;
    }
  }

  /**
   * Update the XTTS mixer based on selected voices
   */
  updateXttsMixer() {
    const checkboxes = document.querySelectorAll('.xtts-voice-check:checked');
    const blendBtn = document.querySelector('.xtts-blend-btn');
    const slotsEl = document.getElementById('xttsMixerSlots');

    // Preserve existing weights when possible
    const oldWeights = {};
    if (this._xttsSelectedVoices && Array.isArray(this._xttsSelectedVoices)) {
      this._xttsSelectedVoices.forEach(v => {
        if (v && v.id) {
          oldWeights[v.id] = v.weight || 1.0;
        }
      });
    }

    this._xttsSelectedVoices = Array.from(checkboxes).map(cb => ({
      id: cb.dataset.id,
      path: cb.dataset.path,
      weight: oldWeights[cb.dataset.id] || 1.0
    }));

    if (slotsEl) {
      if (this._xttsSelectedVoices.length === 0) {
        slotsEl.innerHTML = '<span class="xtts-mixer-empty">Select voices above to blend</span>';
      } else {
        slotsEl.innerHTML = this._xttsSelectedVoices.map((v, i) => `
          <div class="xtts-mixer-slot">
            <span class="slot-num">${i + 1}</span>
            <span class="slot-voice">${v.id}</span>
            <input type="range"
                   class="xtts-weight-slider"
                   data-index="${i}"
                   min="0" max="2" step="0.1"
                   value="${v.weight}"
                   oninput="quiz.renderer.updateXttsWeight(${i}, this.value)">
            <span class="slot-weight" id="xttsWeight${i}">${(v.weight * 100).toFixed(0)}%</span>
          </div>
        `).join('');
      }
    }

    const hasEnoughVoices = this._xttsSelectedVoices.length >= 2;
    if (blendBtn) {
      blendBtn.disabled = !hasEnoughVoices;
    }
    const saveBtn = document.querySelector('.xtts-save-btn');
    if (saveBtn) {
      saveBtn.disabled = !hasEnoughVoices;
    }
  }

  /**
   * Update a voice weight in the XTTS mixer
   */
  updateXttsWeight(index, value) {
    const weight = parseFloat(value);
    if (this._xttsSelectedVoices && this._xttsSelectedVoices[index]) {
      this._xttsSelectedVoices[index].weight = weight;
      const label = document.getElementById(`xttsWeight${index}`);
      if (label) {
        label.textContent = `${(weight * 100).toFixed(0)}%`;
      }
    }
  }

  /**
   * Reset all voice weights to equal (1.0)
   */
  resetXttsWeights() {
    if (!this._xttsSelectedVoices) return;

    this._xttsSelectedVoices.forEach((v, i) => {
      v.weight = 1.0;
      const slider = document.querySelector(`.xtts-weight-slider[data-index="${i}"]`);
      const label = document.getElementById(`xttsWeight${i}`);
      if (slider) slider.value = 1.0;
      if (label) label.textContent = '100%';
    });
  }

  /**
   * XTTS Voice Character Parameters - stored for blend requests
   */
  _xttsParams = {
    speed: 1.0,
    temperature: 0.7,
    top_p: 0.85,
    repetition_penalty: 2.0
  };

  /**
   * Personality presets for different voice characters
   */
  _xttsPresets = {
    neutral: { speed: 1.0, temperature: 0.65, top_p: 0.85, repetition_penalty: 2.0 },
    warm: { speed: 0.95, temperature: 0.75, top_p: 0.9, repetition_penalty: 2.5 },
    energetic: { speed: 1.15, temperature: 0.85, top_p: 0.95, repetition_penalty: 1.5 },
    calm: { speed: 0.85, temperature: 0.55, top_p: 0.8, repetition_penalty: 3.0 },
    playful: { speed: 1.05, temperature: 0.8, top_p: 0.9, repetition_penalty: 2.0 },
    serious: { speed: 0.9, temperature: 0.5, top_p: 0.75, repetition_penalty: 4.0 },
    skeptical: { speed: 0.92, temperature: 0.6, top_p: 0.8, repetition_penalty: 3.5 }
  };

  /**
   * Update a single XTTS parameter
   */
  updateXttsParam(param, value) {
    const numValue = parseFloat(value);
    this._xttsParams[param] = numValue;

    // Update display label
    const labels = {
      speed: `${numValue.toFixed(2)}×`,
      temperature: numValue.toFixed(2),
      top_p: numValue.toFixed(2),
      repetition_penalty: numValue.toFixed(1)
    };

    const labelEl = document.getElementById(`xtts${param.charAt(0).toUpperCase() + param.slice(1).replace(/_([a-z])/g, (m, c) => c.toUpperCase())}Val`);
    if (labelEl) {
      labelEl.textContent = labels[param] || numValue.toFixed(2);
    }

    // Clear preset selection since we're customizing
    const presetSelect = document.getElementById('xttsPersonalityPreset');
    if (presetSelect) presetSelect.value = '';
  }

  /**
   * Apply a personality preset
   */
  applyXttsPreset(presetName) {
    if (!presetName || !this._xttsPresets[presetName]) return;

    const preset = this._xttsPresets[presetName];

    // Update params
    Object.assign(this._xttsParams, preset);

    // Update sliders and labels
    const params = ['speed', 'temperature', 'top_p', 'repetition_penalty'];
    const sliderIds = ['xttsSpeed', 'xttsTemperature', 'xttsTopP', 'xttsRepPenalty'];
    const labelIds = ['xttsSpeedVal', 'xttsTemperatureVal', 'xttsTopPVal', 'xttsRepPenaltyVal'];
    const formats = [v => `${v.toFixed(2)}×`, v => v.toFixed(2), v => v.toFixed(2), v => v.toFixed(1)];

    params.forEach((param, i) => {
      const slider = document.getElementById(sliderIds[i]);
      const label = document.getElementById(labelIds[i]);
      if (slider) slider.value = preset[param];
      if (label) label.textContent = formats[i](preset[param]);
    });

    console.log(`Applied XTTS preset: ${presetName}`, preset);
  }

  /**
   * Get current XTTS parameters
   */
  getXttsParams() {
    return { ...this._xttsParams };
  }

  /**
   * Save the current XTTS blend as a new voice sample
   */
  async saveXttsBlend() {
    const voices = this._xttsSelectedVoices || [];
    if (voices.length < 2) {
      alert('Select at least 2 voices to save a blend!');
      return;
    }

    // Get weights
    const rawWeights = voices.map(v => v.weight || 1.0);
    const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
    const normalizedWeights = rawWeights.map(w => w / totalWeight);

    // Build suggested name from voice names and weights
    const voiceNames = voices.map((v, i) => {
      const pct = Math.round(normalizedWeights[i] * 100);
      return `${v.id}(${pct}%)`;
    });
    const suggestedName = voiceNames.join('+');

    // Ask user for name
    const name = prompt('Name this blended voice:', suggestedName);
    if (!name) return;

    const slerpSelect = document.getElementById('xttsSlerp');
    const useSlerp = slerpSelect?.value !== 'false';

    const saveBtn = document.querySelector('.xtts-save-btn');
    if (saveBtn) {
      saveBtn.textContent = '⏳ Saving...';
      saveBtn.disabled = true;
    }

    try {
      const response = await fetch('http://localhost:5500/xtts/save-blend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          voices: voices.map(v => v.id),
          weights: normalizedWeights,
          use_slerp: useSlerp
        })
      });

      const result = await response.json();

      if (result.id) {
        // Refresh voice list
        await this.loadXttsVoices();
        alert(`Voice blend "${name}" saved!\n\nYou can now use it as a single voice in future blends.`);
      } else {
        throw new Error(result.error || 'Save failed');
      }
    } catch (e) {
      console.error('Save blend error:', e);
      alert(`Error saving blend: ${e.message}`);
    } finally {
      if (saveBtn) {
        saveBtn.textContent = '💾 Save Blend';
        saveBtn.disabled = false;
      }
    }
  }

  /**
   * Show the capture dialog for creating XTTS voice samples from Piper
   */
  showXttsCapture() {
    const piperVoices = voiceSystem?.backends?.piper?.voiceData || null;
    const allVoices = [
      ...(piperVoices?.grouped?.female || []),
      ...(piperVoices?.grouped?.male || [])
    ];

    const popup = document.createElement('div');
    popup.className = 'xtts-capture-popup';
    popup.innerHTML = `
      <div class="xtts-capture-content">
        <h3>🎤 Capture Voice for XTTS</h3>
        <p>Select a Piper voice to capture as an XTTS voice sample.</p>

        <div class="capture-form">
          <label>Piper Voice:</label>
          <select id="capturePiperVoice">
            ${allVoices.map(v => `<option value="${v.id}">${v.id.split('-')[1]} (${v.accent})</option>`).join('')}
          </select>

          <label>Name for this voice:</label>
          <input type="text" id="captureVoiceName" placeholder="e.g., Warm Amy">

          <label>Sample text (longer = better voice capture):</label>
          <textarea id="captureSampleText" rows="6">Hello, my name is your guide today. Let me demonstrate the full range of my voice.

The thick thistle stuck in the thicket. She sells seashells by the seashore. Peter Piper picked a peck of pickled peppers.

Questions require rising intonation? Yes! Excitement brings energy! And whispers... bring mystery.

From the depths of my voice to the heights, I can express joy, sadness, curiosity, and calm assurance.</textarea>
        </div>

        <div class="capture-actions">
          <button class="capture-cancel" onclick="this.closest('.xtts-capture-popup').remove()">Cancel</button>
          <button class="capture-confirm" onclick="quiz.renderer.captureXttsVoice()">🎤 Capture</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
  }

  /**
   * Capture a Piper voice as an XTTS sample
   */
  async captureXttsVoice() {
    const piperVoice = document.getElementById('capturePiperVoice').value;
    const name = document.getElementById('captureVoiceName').value.trim();
    const sampleText = document.getElementById('captureSampleText').value.trim();

    if (!name) {
      alert('Please enter a name for this voice');
      return;
    }

    const confirmBtn = document.querySelector('.capture-confirm');
    if (confirmBtn) confirmBtn.textContent = '⏳ Capturing...';

    try {
      const response = await fetch('http://localhost:5500/xtts/capture-piper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: piperVoice,
          name: name,
          sampleText: sampleText
        })
      });

      const result = await response.json();

      if (result.id) {
        document.querySelector('.xtts-capture-popup')?.remove();
        this.loadXttsVoices();
        alert(`Voice "${name}" captured successfully!`);
      } else {
        throw new Error(result.error || 'Capture failed');
      }
    } catch (e) {
      alert(`Error capturing voice: ${e.message}`);
      if (confirmBtn) confirmBtn.textContent = '🎤 Capture';
    }
  }

  /**
   * Delete an XTTS voice sample
   */
  async deleteXttsVoice(voiceId) {
    if (!confirm(`Delete voice sample "${voiceId}"?`)) return;

    try {
      await fetch(`http://localhost:5500/xtts/voices/${voiceId}`, { method: 'DELETE' });
      // Clear active voice if it was deleted
      if (this._activeXttsVoice === voiceId) {
        this._activeXttsVoice = null;
        this.updateActiveVoiceDisplay();
      }
      this.loadXttsVoices();
    } catch (e) {
      alert(`Error deleting voice: ${e.message}`);
    }
  }

  /**
   * Currently active XTTS voice for solo testing
   */
  _activeXttsVoice = null;

  /**
   * Play a single XTTS voice (quick preview)
   */
  async playXttsVoiceSolo(voiceId) {
    const playBtn = document.querySelector(`.xtts-voice-item[data-id="${voiceId}"] .xtts-voice-play`);
    if (playBtn) {
      playBtn.textContent = '⏳';
      playBtn.disabled = true;
    }

    try {
      const params = this.getXttsParams();
      const response = await fetch('http://localhost:5500/blend-xtts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Hello, this is my voice.",
          voices: [voiceId],
          weights: [1.0],
          use_slerp: true,
          language: 'en',
          speed: params.speed,
          temperature: params.temperature,
          top_p: params.top_p,
          repetition_penalty: params.repetition_penalty
        })
      });

      if (!response.ok) {
        throw new Error('Preview failed');
      }

      const blob = await response.blob();
      this.stopBlendAudio();

      const url = URL.createObjectURL(blob);
      this._currentAudio = new Audio(url);
      this._currentAudio._blobUrl = url;
      this._currentAudio.volume = voiceSystem?.settings?.volume || 0.85;
      this._currentAudio.onended = () => URL.revokeObjectURL(url);
      await this._currentAudio.play();
    } catch (e) {
      console.error('Voice preview error:', e);
    } finally {
      if (playBtn) {
        playBtn.textContent = '▶';
        playBtn.disabled = false;
      }
    }
  }

  /**
   * Set a voice as the active voice for solo testing
   */
  setActiveXttsVoice(voiceId) {
    this._activeXttsVoice = voiceId;
    this.updateActiveVoiceDisplay();

    // Highlight the active voice in the list
    document.querySelectorAll('.xtts-voice-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === voiceId);
    });
  }

  /**
   * Update the active voice display
   */
  updateActiveVoiceDisplay() {
    const display = document.getElementById('xttsActiveVoice');
    if (!display) return;

    if (this._activeXttsVoice) {
      const voice = this._xttsVoices?.find(v => v.id === this._activeXttsVoice);
      display.textContent = voice?.name || this._activeXttsVoice;
      display.classList.add('has-voice');
    } else {
      display.textContent = 'None selected';
      display.classList.remove('has-voice');
    }
  }

  /**
   * Play the active voice with custom text and current character settings
   */
  async playActiveVoice() {
    if (!this._activeXttsVoice) {
      alert('No active voice selected. Click ★ on a voice to set it as active.');
      return;
    }

    const textInput = document.getElementById('xttsSoloText');
    const text = textInput?.value?.trim() || 'Hello, this is a test.';

    const playBtn = document.querySelector('.xtts-solo-play-btn');
    if (playBtn) {
      playBtn.textContent = '⏳ Generating...';
      playBtn.disabled = true;
    }

    try {
      const params = this.getXttsParams();
      console.log('Playing active voice:', this._activeXttsVoice, 'with params:', params);

      const response = await fetch('http://localhost:5500/blend-xtts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voices: [this._activeXttsVoice],
          weights: [1.0],
          use_slerp: true,
          language: 'en',
          speed: params.speed,
          temperature: params.temperature,
          top_p: params.top_p,
          repetition_penalty: params.repetition_penalty
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed');
      }

      const blob = await response.blob();
      this.stopBlendAudio();

      const url = URL.createObjectURL(blob);
      this._currentAudio = new Audio(url);
      this._currentAudio._blobUrl = url;
      this._currentAudio.volume = voiceSystem?.settings?.volume || 0.85;

      this._currentAudio.onended = () => {
        URL.revokeObjectURL(url);
        if (playBtn) {
          playBtn.textContent = '▶ Play';
          playBtn.disabled = false;
        }
      };

      await this._currentAudio.play();
      if (playBtn) playBtn.textContent = '🔊 Playing...';
    } catch (e) {
      console.error('Active voice play error:', e);
      alert(`Error: ${e.message}`);
      if (playBtn) {
        playBtn.textContent = '▶ Play';
        playBtn.disabled = false;
      }
    }
  }

  /**
   * Set the active XTTS voice as Ms. Luminara's voice for the quiz
   */
  useXttsForQuiz() {
    if (!this._activeXttsVoice) {
      alert('No active voice selected. Click ★ on a voice first to set it as active.');
      return;
    }

    // Get current XTTS params to save to voice system
    const params = this.getXttsParams();
    const voice = this._xttsVoices?.find(v => v.id === this._activeXttsVoice);
    const voiceName = voice?.name || this._activeXttsVoice;

    // Set XTTS as the backend and configure the voice
    if (voiceSystem) {
      voiceSystem.settings.backend = 'xtts';
      voiceSystem.settings.xttsVoiceId = this._activeXttsVoice;
      voiceSystem.settings.xttsSpeed = params.speed;
      voiceSystem.settings.xttsTemperature = params.temperature;
      voiceSystem.settings.xttsTopP = params.top_p;
      voiceSystem.settings.xttsRepetitionPenalty = params.repetition_penalty;
      voiceSystem.saveSettings();

      // Mark XTTS as available since we have a voice
      voiceSystem.backends.xtts.available = true;

      console.log('✅ XTTS voice set for quiz:', {
        voiceId: this._activeXttsVoice,
        voiceName,
        backend: voiceSystem.settings.backend,
        params
      });
    }

    // Update UI to show it's active
    const statusEl = document.getElementById('xttsQuizStatus');
    if (statusEl) {
      statusEl.textContent = `✓ Active: ${voiceName}`;
      statusEl.classList.add('active');
    }

    // Update the button
    const btn = document.getElementById('xttsUseQuizBtn');
    if (btn) {
      btn.textContent = '✓ Voice Set';
      btn.classList.add('active');
      setTimeout(() => {
        btn.textContent = '📚 Use for Quiz';
      }, 2000);
    }

    // Play a confirmation using the newly set voice
    voiceSystem?.speak(`${voiceName} voice activated for quiz mode.`, { priority: 'high' });
  }

  /**
   * Capture all saved voice cocktails as XTTS voice samples
   * This allows blending your custom Piper presets in embedding space
   */
  async captureAllCocktails() {
    // Get saved cocktails from localStorage
    let cocktails = [];
    try {
      cocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {
      alert('No saved cocktails found');
      return;
    }

    if (cocktails.length === 0) {
      alert('No saved voice cocktails to capture.\n\nFirst save some voice presets in the Voice Settings, then capture them here for XTTS blending!');
      return;
    }

    // Get existing XTTS voices to check for duplicates
    let existingVoices = [];
    try {
      const response = await fetch('http://localhost:5500/xtts/voices');
      existingVoices = await response.json();
    } catch (e) {}
    const existingIds = new Set(existingVoices.map(v => v.id));

    // Filter out already captured cocktails
    const newCocktails = cocktails.filter(c => {
      const id = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      return !existingIds.has(id);
    });

    if (newCocktails.length === 0) {
      alert('All your cocktails have already been captured as XTTS voice samples!');
      return;
    }

    const confirmMsg = `Found ${cocktails.length} saved cocktails.\n${newCocktails.length} new ones to capture.\n\nThis will generate audio for each cocktail and save them as XTTS voice samples.\n\nProceed?`;
    if (!confirm(confirmMsg)) return;

    // Show progress UI
    const btn = document.querySelector('.xtts-capture-cocktails-btn');
    const originalText = btn?.textContent;

    const sampleText = `Hello, my name is your guide today. Let me demonstrate the full range of my voice.

The thick thistle stuck in the thicket. She sells seashells by the seashore.
Peter Piper picked a peck of pickled peppers. Red lorry, yellow lorry.

Questions require rising intonation? Yes! Excitement brings energy! And whispers... bring mystery.

From the depths of my voice to the heights, I can express joy, sadness, curiosity, and calm assurance.`;

    let captured = 0;
    let errors = [];

    for (const cocktail of newCocktails) {
      if (btn) btn.textContent = `🍸 Capturing ${captured + 1}/${newCocktails.length}...`;

      try {
        const response = await fetch('http://localhost:5500/xtts/capture-piper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: cocktail.model,
            speaker_id: cocktail.speakerId || 0,
            name: cocktail.name,
            sampleText: sampleText
          })
        });

        const result = await response.json();
        if (result.id) {
          captured++;
          console.log(`Captured cocktail: ${cocktail.name}`);
        } else {
          errors.push(`${cocktail.name}: ${result.error || 'Unknown error'}`);
        }
      } catch (e) {
        errors.push(`${cocktail.name}: ${e.message}`);
      }
    }

    // Restore button
    if (btn) btn.textContent = originalText;

    // Refresh voice list
    this.loadXttsVoices();

    // Show results
    let msg = `Captured ${captured}/${newCocktails.length} cocktails as XTTS voice samples!`;
    if (errors.length > 0) {
      msg += `\n\nErrors:\n${errors.join('\n')}`;
    }
    alert(msg);
  }

  /**
   * Play the XTTS blend - TRUE embedding-space voice blending
   */
  async playXttsBlend() {
    const voices = this._xttsSelectedVoices || [];
    if (voices.length < 2) {
      alert('Select at least 2 voices to blend!');
      return;
    }

    const slerpSelect = document.getElementById('xttsSlerp');
    const useSlerp = slerpSelect?.value !== 'false';

    // Get weights from voices (normalize them)
    const rawWeights = voices.map(v => v.weight || 1.0);
    const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
    const normalizedWeights = rawWeights.map(w => w / totalWeight);

    // Get voice character parameters
    const params = this.getXttsParams();

    // Show info in console
    console.log('XTTS Blend weights:', voices.map((v, i) =>
      `${v.id}: ${(normalizedWeights[i] * 100).toFixed(1)}%`
    ).join(', '));
    console.log('XTTS Params:', params);

    const blendBtn = document.querySelector('.xtts-blend-btn');
    if (blendBtn) {
      blendBtn.textContent = '⏳ Blending (this takes a moment)...';
      blendBtn.disabled = true;
    }

    try {
      const response = await fetch('http://localhost:5500/blend-xtts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Hello darling. This is your custom blended voice, created by interpolating speaker embeddings in latent space.",
          voices: voices.map(v => v.path),
          weights: normalizedWeights,
          use_slerp: useSlerp,
          language: 'en',
          speed: params.speed,
          temperature: params.temperature,
          top_p: params.top_p,
          repetition_penalty: params.repetition_penalty
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Blend failed');
      }

      const blob = await response.blob();
      this.stopBlendAudio();

      const url = URL.createObjectURL(blob);
      this._currentAudio = new Audio(url);
      this._currentAudio._blobUrl = url;
      this._currentAudio.volume = voiceSystem?.settings?.volume || 0.85;

      this._currentAudio.onended = () => {
        if (blendBtn) {
          blendBtn.textContent = '🧬 Blend Voices';
          blendBtn.disabled = false;
        }
        URL.revokeObjectURL(url);
      };

      await this._currentAudio.play();
      if (blendBtn) {
        blendBtn.textContent = '🔊 Playing...';
      }
    } catch (e) {
      console.error('XTTS blend error:', e);
      alert(`XTTS Blend Error: ${e.message}`);
      if (blendBtn) {
        blendBtn.textContent = '🧬 Blend Voices';
        blendBtn.disabled = false;
      }
    }
  }

  /**
   * Play a blend audio blob
   */
  async playBlendAudio(audioBlob) {
    // Stop any currently playing audio first
    this.stopBlendAudio();

    console.log('playBlendAudio called with blob:', audioBlob.size, 'bytes, type:', audioBlob.type);

    // Ensure blob has correct MIME type for WAV
    const wavBlob = new Blob([audioBlob], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(wavBlob);
    console.log('Created audio URL:', audioUrl);

    const audio = new Audio(audioUrl);
    audio._blobUrl = audioUrl; // Store for cleanup
    audio.volume = voiceSystem?.settings?.volume || 0.85;
    this._currentAudio = audio;
    console.log('Audio element created, volume:', audio.volume);

    const previewBtn = document.getElementById('previewBlendBtn');
    if (previewBtn) {
      previewBtn.textContent = '🔊 Playing...';
      previewBtn.disabled = true;
    }

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (previewBtn) {
          previewBtn.textContent = '▶ Preview Blend';
          previewBtn.disabled = false;
        }
        resolve();
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        if (previewBtn) {
          previewBtn.textContent = '▶ Preview Blend';
          previewBtn.disabled = false;
        }
        reject(new Error('Audio playback failed'));
      };

      console.log('Calling audio.play()...');
      audio.play()
        .then(() => console.log('audio.play() started successfully'))
        .catch((err) => {
          console.error('audio.play() failed:', err);
          reject(err);
        });
    });
  }

  /**
   * Replay cached blend
   */
  async replayBlend() {
    if (!this._cachedBlendAudio) {
      // Try to fetch from server cache
      if (this._cachedBlendId) {
        try {
          const response = await fetch(`http://localhost:5500/blend/cache/${this._cachedBlendId}`);
          if (response.ok) {
            this._cachedBlendAudio = await response.blob();
          }
        } catch (e) {
          console.error('Failed to fetch cached blend:', e);
        }
      }

      if (!this._cachedBlendAudio) {
        alert('No cached blend available. Generate a new one first.');
        return;
      }
    }

    try {
      await this.playBlendAudio(this._cachedBlendAudio);
    } catch (e) {
      console.error('Replay error:', e);
    }
  }

  /**
   * Clear cached blend
   */
  async clearBlendCache() {
    // Clear local cache
    this._cachedBlendAudio = null;

    // Clear server cache
    if (this._cachedBlendId) {
      try {
        await fetch(`http://localhost:5500/blend/cache/${this._cachedBlendId}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.error('Failed to clear server cache:', e);
      }
      this._cachedBlendId = null;
    }

    // Hide buttons
    const replayBtn = document.getElementById('replayBlendBtn');
    const clearBtn = document.getElementById('clearBlendBtn');
    if (replayBtn) replayBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';

    // Update progress
    this.updateBlendProgress(0, 'Cache cleared', false);
  }

  /**
   * Save the current blend settings as a new cocktail
   */
  saveBlendedVoice() {
    const selectA = document.getElementById('blendVoiceA');
    const selectB = document.getElementById('blendVoiceB');
    const ratioSlider = document.getElementById('blendRatio');

    const indexA = selectA?.value;
    const indexB = selectB?.value;

    if (!indexA || !indexB) {
      alert('Please select two voices first');
      return;
    }

    let cocktails = [];
    try {
      cocktails = JSON.parse(localStorage.getItem('ms_luminara_cocktails') || '[]');
    } catch (e) {}

    const cocktailA = cocktails[parseInt(indexA)];
    const cocktailB = cocktails[parseInt(indexB)];
    const ratio = (ratioSlider?.value || 50) / 100;

    // Create a blend record (note: actual audio blending happens on playback)
    const blendName = prompt(
      'Name this blend:',
      `${cocktailA.name} + ${cocktailB.name} (${Math.round(ratio * 100)}%)`
    );

    if (!blendName) return;

    const blendCocktail = {
      name: blendName,
      isBlend: true,
      blendSourceA: parseInt(indexA),
      blendSourceB: parseInt(indexB),
      blendRatio: ratio,
      blendOptions: {
        magnitudeBlend: document.getElementById('blendMagnitude')?.value || 'linear',
        phaseSource: document.getElementById('blendPhase')?.value || 'a'
      },
      // Store snapshot of source voices (in case originals are deleted)
      model: cocktailA.model,
      speakerId: cocktailA.speakerId,
      sourceA: { ...cocktailA },
      sourceB: { ...cocktailB },
      createdAt: Date.now()
    };

    cocktails.unshift(blendCocktail);
    if (cocktails.length > 20) cocktails = cocktails.slice(0, 20);

    localStorage.setItem('ms_luminara_cocktails', JSON.stringify(cocktails));
    this.renderSavedCocktails();

    alert(`Blend "${blendName}" saved!`);
  }

  /**
   * Apply a voice preset from the vocalization library
   */
  applyVoicePreset(presetName) {
    console.log('Applying preset:', presetName);
    if (typeof voiceSystem === 'undefined' || !voiceSystem) {
      console.error('voiceSystem not available');
      return;
    }

    const success = voiceSystem.applyVoicePreset(presetName);
    console.log('Preset applied:', success);

    if (success) {
      // Update button states
      document.querySelectorAll('.preset-chip').forEach(btn => {
        btn.classList.remove('active');
      });
      event?.target?.classList?.add('active');

      // Refresh the settings panel to show new values
      this.showVoiceSettings();
      // Play a test with the new settings
      voiceSystem.testVoice();
    } else {
      console.error('Failed to apply preset:', presetName);
    }
  }

  /**
   * Update a voice setting
   */
  updateVoiceSetting(setting, value) {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    switch (setting) {
      case 'enabled': voiceSystem.setEnabled(value); break;
      case 'backend': voiceSystem.setBackend(value); break;
      case 'volume': voiceSystem.setVolume(value); break;
      case 'rate': voiceSystem.setRate(value); break;
      case 'pitch': voiceSystem.setPitch(value); break;
      case 'browserVoiceName': voiceSystem.setBrowserVoice(value); break;
      // Advanced Piper settings
      case 'piperLengthScale': voiceSystem.setPiperLengthScale(value); break;
      case 'piperNoiseScale': voiceSystem.setPiperNoiseScale(value); break;
      case 'piperNoiseW': voiceSystem.setPiperNoiseW(value); break;
      case 'piperSpeakerId': voiceSystem.setPiperSpeakerId(value); break;
      case 'sentencePause': voiceSystem.setSentencePause(value); break;
      case 'emphasisBoost': voiceSystem.setEmphasisBoost(value); break;
      case 'speakIntros': voiceSystem.settings.speakIntros = value; voiceSystem.saveSettings(); break;
      case 'speakExplanations': voiceSystem.settings.speakExplanations = value; voiceSystem.saveSettings(); break;
      case 'speakAchievements': voiceSystem.settings.speakAchievements = value; voiceSystem.saveSettings(); break;
      case 'speakLoot': voiceSystem.settings.speakLoot = value; voiceSystem.saveSettings(); break;
      case 'piperModel': voiceSystem.setPiperModel(value); break;
      // Interactive mode settings
      case 'readQuestionsAloud': voiceSystem.settings.readQuestionsAloud = value; voiceSystem.saveSettings(); break;
      case 'playfulPokes':
        voiceSystem.settings.playfulPokes = value;
        voiceSystem.saveSettings();
        // Stop idle timer if pokes are disabled
        if (!value) voiceSystem.stopIdleTimer();
        // Refresh the settings panel to enable/disable the interval slider
        this.showVoiceSettings();
        break;
      case 'pokeIntervalSeconds':
        voiceSystem.settings.pokeIntervalSeconds = value;
        voiceSystem.saveSettings();
        break;
    }

    // Mark that user has manually selected a backend
    if (setting === 'backend') {
      voiceSystem.settings.userSelectedBackend = true;
      voiceSystem.saveSettings();
    }

    this.renderStatsBar();
  }

  // ═══════════════════════════════════════════════════════════════
  // PAPERDOLL & INVENTORY UI
  // ═══════════════════════════════════════════════════════════════

  /**
   * Show full inventory and paperdoll screen
   */
  showInventory() {
    const existing = document.querySelector('.inventory-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'inventory-overlay';

    const equipped = lootSystem.getEquipped();
    const inventory = lootSystem.getInventory();
    const gems = lootSystem.getGems();
    const gold = lootSystem.getGold();
    const equipStats = lootSystem.calculateEquipmentStats();
    const setBonuses = lootSystem.getActiveSetBonuses();

    overlay.innerHTML = `
      <div class="inventory-panel">
        <button class="close-btn" onclick="this.closest('.inventory-overlay').remove()">✕</button>

        <div class="inv-header">
          <h2>Equipment & Inventory</h2>
          <div class="gold-display">💰 ${gold.toLocaleString()} Gold</div>
        </div>

        <div class="inv-content">
          <!-- Paperdoll -->
          <div class="paperdoll-section">
            <h3>Equipped</h3>
            <div class="paperdoll">
              ${this.renderPaperdoll(equipped)}
            </div>

            <!-- Equipment Stats Summary -->
            <div class="equip-stats">
              <h4>Equipment Bonuses</h4>
              <div class="stat-row"><span>INT</span><span class="stat-val">+${equipStats.intelligence || 0}</span></div>
              <div class="stat-row"><span>WIS</span><span class="stat-val">+${equipStats.wisdom || 0}</span></div>
              <div class="stat-row"><span>CON</span><span class="stat-val">+${equipStats.constitution || 0}</span></div>
              <div class="stat-row"><span>CHA</span><span class="stat-val">+${equipStats.charisma || 0}</span></div>
              ${equipStats.xpBonus ? `<div class="stat-row bonus"><span>XP Bonus</span><span class="stat-val">+${equipStats.xpBonus}%</span></div>` : ''}
              ${equipStats.streakBonus ? `<div class="stat-row bonus"><span>Streak Bonus</span><span class="stat-val">+${equipStats.streakBonus}%</span></div>` : ''}
              ${equipStats.luckyChance ? `<div class="stat-row bonus"><span>Lucky Chance</span><span class="stat-val">+${equipStats.luckyChance}%</span></div>` : ''}
            </div>

            <!-- Set Bonuses -->
            ${setBonuses.length > 0 ? `
              <div class="set-bonuses">
                <h4>Set Bonuses</h4>
                ${setBonuses.map(set => `
                  <div class="set-info">
                    <div class="set-name">${set.name} (${set.equipped}/${set.total})</div>
                    ${set.bonuses.map(b => `<div class="set-bonus active">${b}</div>`).join('')}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Inventory Grid -->
          <div class="inventory-section">
            <h3>Inventory (${inventory.length})</h3>
            <div class="inventory-grid">
              ${inventory.map(item => this.renderInventoryItem(item)).join('')}
              ${inventory.length === 0 ? '<div class="empty-inv">No items yet. Answer questions to find loot!</div>' : ''}
            </div>

            <!-- Gems Section -->
            <h3>Gems (${gems.length})</h3>
            <div class="gems-grid">
              ${gems.map(gem => this.renderGem(gem)).join('')}
              ${gems.length === 0 ? '<div class="empty-inv">No gems yet.</div>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Render the paperdoll equipment slots
   */
  renderPaperdoll(equipped) {
    const slots = [
      ['HEAD'],
      ['SHOULDERS', 'NECK', 'MAINHAND'],
      ['CHEST', 'HANDS', 'OFFHAND'],
      ['WAIST'],
      ['LEGS'],
      ['RING_L', 'FEET', 'RING_R']
    ];

    const slotInfo = {
      HEAD: { icon: '🎓', name: 'Head' },
      NECK: { icon: '📿', name: 'Amulet' },
      SHOULDERS: { icon: '🦺', name: 'Shoulders' },
      CHEST: { icon: '🥼', name: 'Chest' },
      HANDS: { icon: '🧤', name: 'Hands' },
      WAIST: { icon: '🎗️', name: 'Belt' },
      LEGS: { icon: '👖', name: 'Legs' },
      FEET: { icon: '👢', name: 'Feet' },
      RING_L: { icon: '💍', name: 'Left Ring' },
      RING_R: { icon: '💍', name: 'Right Ring' },
      MAINHAND: { icon: '📚', name: 'Main Hand' },
      OFFHAND: { icon: '📖', name: 'Off Hand' }
    };

    return slots.map(row => `
      <div class="paperdoll-row">
        ${row.map(slot => {
          const item = equipped[slot];
          const info = slotInfo[slot];
          const rarityColor = item ? this.getRarityColor(item.rarity) : 'var(--border)';

          return `
            <div class="equip-slot ${item ? 'filled' : 'empty'}"
                 style="border-color: ${rarityColor}"
                 onclick="${item ? `quiz.renderer.showItemDetail('${item.id}', true)` : ''}"
                 title="${item ? item.name : info.name}">
              <span class="slot-icon">${item ? (item.icon || info.icon) : info.icon}</span>
              ${item ? `<span class="item-level">${item.level}</span>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `).join('');
  }

  /**
   * Render an inventory item
   */
  renderInventoryItem(item) {
    const rarityColor = this.getRarityColor(item.rarity);

    return `
      <div class="inv-item" style="border-color: ${rarityColor}"
           onclick="quiz.renderer.showItemDetail('${item.id}', false)">
        <span class="item-icon">${item.icon || '📦'}</span>
        <span class="item-level">${item.level}</span>
        ${item.sockets > 0 ? `<span class="socket-indicator">${'◇'.repeat(item.sockets - (item.gems?.length || 0))}${'◆'.repeat(item.gems?.length || 0)}</span>` : ''}
      </div>
    `;
  }

  /**
   * Render a gem
   */
  renderGem(gem) {
    return `
      <div class="inv-gem" style="border-color: ${gem.color}"
           onclick="quiz.renderer.showGemDetail('${gem.id}')"
           title="${gem.tierName} ${gem.name}">
        <span class="gem-icon">${gem.icon}</span>
        <span class="gem-tier">${gem.tierName.charAt(0)}</span>
      </div>
    `;
  }

  /**
   * Show detailed item view
   */
  showItemDetail(itemId, isEquipped) {
    const item = isEquipped ?
      Object.values(lootSystem.getEquipped()).find(i => i && i.id === itemId) :
      lootSystem.getInventory().find(i => i.id === itemId);

    if (!item) return;

    const existing = document.querySelector('.item-detail-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'item-detail-overlay';

    const rarityInfo = this.getRarityInfo(item.rarity);

    overlay.innerHTML = `
      <div class="item-detail" style="border-color: ${rarityInfo.color}">
        <div class="item-header" style="background: linear-gradient(135deg, ${rarityInfo.color}22, transparent)">
          <span class="item-icon-large">${item.icon || '📦'}</span>
          <div class="item-title">
            <div class="item-name" style="color: ${rarityInfo.color}">${item.name}</div>
            <div class="item-type">${rarityInfo.name} ${item.typeKey?.replace(/_/g, ' ') || 'Item'}</div>
          </div>
        </div>

        <div class="item-level-req">Item Level ${item.level}</div>

        ${item.lore ? `<div class="item-lore">"${item.lore}"</div>` : ''}

        <div class="item-stats">
          ${Object.entries(item.stats).map(([stat, val]) => {
            if (val === 0) return '';
            const isPercent = ['xpBonus', 'streakBonus', 'luckyChance', 'revengeBonus'].includes(stat);
            return `<div class="item-stat">+${val}${isPercent ? '%' : ''} ${this.formatStatName(stat)}</div>`;
          }).join('')}
        </div>

        ${item.special ? `<div class="item-special">${item.special}</div>` : ''}

        ${item.sockets > 0 ? `
          <div class="item-sockets">
            <div class="socket-label">Sockets:</div>
            <div class="socket-row">
              ${Array(item.sockets).fill(0).map((_, i) => {
                const gem = item.gems?.[i];
                return `<span class="socket ${gem ? 'filled' : 'empty'}" style="${gem ? `color: ${gem.color}` : ''}">${gem ? gem.icon : '◇'}</span>`;
              }).join('')}
            </div>
          </div>
        ` : ''}

        ${item.setId ? `
          <div class="item-set-info">
            <div class="set-name-label">${item.setName}</div>
          </div>
        ` : ''}

        <div class="item-actions">
          ${isEquipped ?
            `<button class="item-btn unequip" onclick="quiz.unequipItem('${item.type}'); this.closest('.item-detail-overlay').remove(); quiz.renderer.showInventory();">Unequip</button>` :
            `<button class="item-btn equip" onclick="quiz.equipItem('${item.id}'); this.closest('.item-detail-overlay').remove(); quiz.renderer.showInventory();">Equip</button>
             <button class="item-btn sell" onclick="quiz.sellItem('${item.id}'); this.closest('.item-detail-overlay').remove(); quiz.renderer.showInventory();">Sell (${this.getItemSellPrice(item)}g)</button>`
          }
          <button class="item-btn close" onclick="this.closest('.item-detail-overlay').remove()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  getRarityColor(rarity) {
    const colors = {
      COMMON: '#9ca3af',
      UNCOMMON: '#22c55e',
      RARE: '#3b82f6',
      EPIC: '#a855f7',
      LEGENDARY: '#f59e0b',
      UNIQUE: '#06b6d4'
    };
    return colors[rarity] || colors.COMMON;
  }

  getRarityInfo(rarity) {
    const info = {
      COMMON: { name: 'Common', color: '#9ca3af' },
      UNCOMMON: { name: 'Uncommon', color: '#22c55e' },
      RARE: { name: 'Rare', color: '#3b82f6' },
      EPIC: { name: 'Epic', color: '#a855f7' },
      LEGENDARY: { name: 'Legendary', color: '#f59e0b' },
      UNIQUE: { name: 'Unique', color: '#06b6d4' }
    };
    return info[rarity] || info.COMMON;
  }

  formatStatName(stat) {
    const names = {
      intelligence: 'Intelligence',
      wisdom: 'Wisdom',
      constitution: 'Constitution',
      charisma: 'Charisma',
      xpBonus: 'XP Bonus',
      streakBonus: 'Streak Bonus',
      luckyChance: 'Lucky Strike Chance',
      insightBonus: 'Insight Points',
      revengeBonus: 'Revenge Bonus',
      allStats: 'All Stats'
    };
    return names[stat] || stat;
  }

  getItemSellPrice(item) {
    const rarityMultiplier = { COMMON: 5, UNCOMMON: 15, RARE: 50, EPIC: 150, LEGENDARY: 500, UNIQUE: 1000 };
    return Math.floor((item.level * 10) * (rarityMultiplier[item.rarity] || 5) / 10);
  }

  /**
   * Show loot drop notification
   */
  showLootDrop(drops) {
    if (!drops || drops.length === 0) return;

    // Speak notable loot drops
    if (typeof voiceSystem !== 'undefined' && voiceSystem) {
      const itemDrop = drops.find(d => d.type !== 'gold' && d.type !== 'gem');
      if (itemDrop && ['RARE', 'EPIC', 'LEGENDARY', 'UNIQUE'].includes(itemDrop.rarity)) {
        voiceSystem.speakLootDrop(itemDrop.name, itemDrop.rarity);
      }
    }

    const container = document.createElement('div');
    container.className = 'loot-drop-container';

    drops.forEach((drop, index) => {
      const notification = document.createElement('div');
      notification.className = 'loot-drop';
      notification.style.animationDelay = `${index * 0.15}s`;

      if (drop.type === 'gold') {
        notification.innerHTML = `
          <span class="loot-icon">💰</span>
          <span class="loot-text">+${drop.amount} Gold</span>
        `;
        notification.classList.add('gold-drop');
      } else if (drop.type === 'gem') {
        notification.innerHTML = `
          <span class="loot-icon">${drop.icon}</span>
          <span class="loot-text" style="color: ${drop.color}">${drop.tierName} ${drop.name}</span>
        `;
        notification.classList.add('gem-drop');
      } else {
        const rarityColor = this.getRarityColor(drop.rarity);
        notification.innerHTML = `
          <span class="loot-icon">${drop.icon || '📦'}</span>
          <span class="loot-text" style="color: ${rarityColor}">${drop.name}</span>
        `;
        notification.classList.add(`rarity-${drop.rarity.toLowerCase()}`);
      }

      container.appendChild(notification);
    });

    document.body.appendChild(container);

    // Remove after animation
    setTimeout(() => container.remove(), 4000);
  }

  /**
   * Show gem detail
   */
  showGemDetail(gemId) {
    const gem = lootSystem.getGems().find(g => g.id === gemId);
    if (!gem) return;

    const overlay = document.createElement('div');
    overlay.className = 'item-detail-overlay';

    overlay.innerHTML = `
      <div class="item-detail gem-detail" style="border-color: ${gem.color}">
        <div class="item-header" style="background: linear-gradient(135deg, ${gem.color}22, transparent)">
          <span class="item-icon-large">${gem.icon}</span>
          <div class="item-title">
            <div class="item-name" style="color: ${gem.color}">${gem.tierName} ${gem.name}</div>
            <div class="item-type">Gem</div>
          </div>
        </div>

        <div class="item-stats">
          <div class="item-stat">+${gem.statBonus}${gem.isPercent ? '%' : ''} ${this.formatStatName(gem.stat)}</div>
        </div>

        <div class="gem-socket-info">
          Socket into equipment to gain bonus stats
        </div>

        <div class="item-actions">
          <button class="item-btn close" onclick="this.closest('.item-detail-overlay').remove()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Build options buttons
   */
  buildOptions(question, exploredOptions) {
    return question.options.map((opt, i) => {
      const explored = exploredOptions.includes(i);
      const isCorrect = i === question.answer;
      let classes = 'option-btn';

      if (explored) {
        classes += isCorrect ? ' correct-answer' : ' wrong-answer';
      }

      return `
        <button class="${classes}" onclick="exploreOption(${i})">
          <span>${this.escapeHtml(opt)}</span>
          <span class="explore-icon">explore →</span>
        </button>
      `;
    }).join('');
  }

  /**
   * Ms. Luminara intro messages - varied by phase and randomized for personality
   * Includes her seductive dimension: invitation, confident assumption, anticipation
   */
  warmup1Intros = [
    "Come with me — we're building toward something delicious. This warmup is your first step into the territory. Explore any answer that draws you.",
    "Stay close. Every great understanding starts with smaller pieces, and I want to show you how they fit. Click any answer — let yourself be curious.",
    "Before we dive into the real challenge, let me give you something to hold onto. Pick an answer and see where it leads us.",
    "Here's where it gets interesting — even the warmups have teeth. Come closer. Explore any option to taste the truth of it.",
    "Think of this as a slow stretch before we sprint together. The main question is coming, but first — what do you make of this?"
  ];

  warmup2Intros = [
    "Good. One more piece of the puzzle before the main event. You're building momentum — stay with me.",
    "Almost there. This second warmup locks in what you'll need. Which answer calls to you? Trust that pull.",
    "The foundation is taking shape. One more warmup, then we see if it holds. Let yourself sink into this one.",
    "Excellent. Now let's add another layer — the main question will feel different once you've wrestled with this. Explore.",
    "You're doing the work. Here's the second warmup — after this, I have something extraordinary to show you."
  ];

  mainIntros = [
    "Now for the main question. Everything you've built leads here. Come — let's see how it all comes together.",
    "Here we go — this is what we've been building toward. The warmups weren't just practice; they were foreplay. Explore any answer.",
    "The main event. You've got the foundation — now let me show you the whole structure. Click any option to explore.",
    "This is where the pieces connect. You've done the warmups; now trust what you've learned. Which answer speaks to you?",
    "Watch closely — this is the real question. Everything before was scaffolding for this moment. Isn't it beautiful?"
  ];

  /**
   * Build Ms. Luminara intro
   * @param {Array} exploredOptions - Options already explored
   * @param {string} phase - Current phase (warmup1, warmup2, main)
   * @param {string} questionText - The question text to read after intro
   */
  buildIntro(exploredOptions, phase, questionText = '') {
    if (exploredOptions.length > 0) return '';

    let messages;
    if (phase === 'warmup1') {
      messages = this.warmup1Intros;
    } else if (phase === 'warmup2') {
      messages = this.warmup2Intros;
    } else {
      messages = this.mainIntros;
    }

    // Pick a random intro for variety
    const message = messages[Math.floor(Math.random() * messages.length)];

    // Speak the intro, then the question if voice is enabled
    if (typeof voiceSystem !== 'undefined' && voiceSystem) {
      const isWarmup = phase === 'warmup1' || phase === 'warmup2';
      voiceSystem.speakIntroThenQuestion(message, questionText, isWarmup);
    }

    // Add insight button for main phase
    const insightBtn = phase === 'main' && typeof d20System !== 'undefined' ?
      `<button class="insight-btn" onclick="quiz.rollForInsight()" ${d20System.canAfford(1) ? '' : 'disabled'}>
        🎲 Roll for Insight (1💡)
      </button>` : '';

    return `
      <div class="luminara-intro">
        <div class="speaker">Ms. Luminara</div>
        <p>"${message}"</p>
        ${insightBtn}
      </div>
    `;
  }

  /**
   * Build exploration panel for the last explored option
   */
  buildExplorationPanel(question, exploredOptions) {
    if (exploredOptions.length === 0) return '';

    const lastExplored = exploredOptions[exploredOptions.length - 1];
    const isCorrect = lastExplored === question.answer;

    if (!question.optionExplains || !question.optionExplains[lastExplored]) {
      // Fallback for warmup questions without detailed explains
      // Speak the explanation
      if (typeof voiceSystem !== 'undefined' && voiceSystem && question.explain) {
        voiceSystem.speakExplanation(question.explain, isCorrect);
      }

      return `
        <div class="exploration-panel visible">
          <h3>${isCorrect ? '✓ Correct!' : '✗ Not quite...'}</h3>
          <div class="content">
            <p>${this.escapeHtml(question.explain || '')}</p>
          </div>
          <div class="verdict ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect
              ? 'This is the right answer.'
              : 'The correct answer is: ' + this.escapeHtml(question.options[question.answer])}
          </div>
        </div>
      `;
    }

    const exp = question.optionExplains[lastExplored];

    // Speak the explanation
    if (typeof voiceSystem !== 'undefined' && voiceSystem) {
      voiceSystem.speakExplanation(exp.text, isCorrect);
    }

    return `
      <div class="exploration-panel visible">
        <h3>${isCorrect ? '✓ Correct!' : '✗ Not quite...'}</h3>
        <div class="content">
          <p>${this.escapeHtml(exp.text)}</p>
        </div>
        <div class="verdict ${exp.verdict}">
          ${isCorrect
            ? 'This is the right answer.'
            : 'The correct answer is: ' + this.escapeHtml(question.options[question.answer])}
        </div>
      </div>
    `;
  }

  /**
   * Build mechanism tour (shown after correct answer is explored)
   */
  buildMechanismTour(question, exploredOptions) {
    // Only show if the correct answer has been explored
    if (!exploredOptions.includes(question.answer)) return '';
    if (!question.mechanism) return '';

    const m = question.mechanism;

    return `
      <div class="mechanism-tour visible">
        <h3>🔬 Mechanism Tour: ${this.escapeHtml(m.title)}</h3>
        <div class="content">
          <p>${this.escapeHtml(m.content)}</p>
          ${m.metaphor ? `
            <div class="metaphor">
              <div class="label">Ms. Luminara's Metaphor</div>
              ${this.escapeHtml(m.metaphor)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Apply extension mixins if they were loaded before the class
// (supports both load orders)
if (window._VoiceLabMixin) {
  Object.assign(QuizRenderer.prototype, window._VoiceLabMixin);
}
if (window._InventoryMixin) {
  Object.assign(QuizRenderer.prototype, window._InventoryMixin);
}
if (window._D20UIMixin) {
  Object.assign(QuizRenderer.prototype, window._D20UIMixin);
}
