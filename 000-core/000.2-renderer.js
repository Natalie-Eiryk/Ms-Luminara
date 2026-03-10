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
    const hpBar = this.renderHPBar();

    container.innerHTML = `
      <div class="stat-item">
        <span class="level-badge">LV ${stats.level}</span>
      </div>
      ${hpBar}
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
   * Render HP bar for scaffold remediation system
   */
  renderHPBar() {
    if (!scaffoldRemediation) return '';

    const hp = scaffoldRemediation.getHP();
    const hpPercent = hp.percent;
    const hpColor = hpPercent > 50 ? 'var(--correct)' :
                    hpPercent > 25 ? 'var(--glow-warm)' :
                    'var(--incorrect)';

    return `
      <div class="hp-container" title="Hit Points - Take damage on wrong answers, heal with scaffold questions">
        <div class="hp-bar">
          <div class="hp-fill" style="width: ${hpPercent}%; background: ${hpColor}"></div>
        </div>
        <div class="hp-text">${hp.current}/${hp.max} HP</div>
      </div>
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

  // ═══════════════════════════════════════════════════════════════
  // SCAFFOLD REMEDIATION UI
  // ═══════════════════════════════════════════════════════════════

  /**
   * Show damage roll animation when wrong answer triggers scaffolds
   */
  showDamageRoll(damageResult, callback) {
    const existing = document.querySelector('.damage-roll-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'damage-roll-overlay';

    const isFumble = damageResult.isFumble;
    const isCrit = damageResult.isCritical;
    const overlayClass = isFumble ? 'fumble' : isCrit ? 'crit-hit' : '';

    const damageMessage = scaffoldRemediation.getDamageMessage(damageResult);

    overlay.innerHTML = `
      <div class="damage-container ${overlayClass}">
        <div class="damage-header">Wrong Answer!</div>
        <div class="dice-spinning">
          <div class="damage-dice">🎲</div>
          <div class="damage-rolling">Rolling damage...</div>
        </div>
        <div class="damage-result" style="display: none;">
          <div class="roll-value ${overlayClass}">${damageResult.roll.roll}</div>
          ${isFumble ?
            '<div class="fumble-text">FUMBLE! No damage!</div>' :
            `<div class="damage-amount">-${damageResult.finalDamage} HP</div>`
          }
          ${isCrit ? '<div class="crit-text">CRITICAL HIT!</div>' : ''}
          ${damageResult.conMod > 0 ? `<div class="con-reduction">CON reduced damage by ${damageResult.conMod}</div>` : ''}
          <div class="damage-message">"${damageMessage}"</div>
        </div>
        <div class="scaffold-notice" style="display: none;">
          <span class="scaffold-icon">📚</span>
          <span class="scaffold-text">3 scaffold questions incoming...</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animation sequence
    setTimeout(() => {
      overlay.querySelector('.dice-spinning').style.display = 'none';
      overlay.querySelector('.damage-result').style.display = 'block';
    }, 1200);

    setTimeout(() => {
      overlay.querySelector('.scaffold-notice').style.display = 'flex';
    }, 2200);

    setTimeout(() => {
      overlay.classList.add('hiding');
      setTimeout(() => {
        overlay.remove();
        if (callback) callback();
      }, 400);
    }, 3500);

    return overlay;
  }

  /**
   * Render a scaffold question card
   */
  renderScaffoldQuestion(question, scaffoldIndex, exploredOptions) {
    const area = document.getElementById('questionArea');
    if (!area) return;

    area.innerHTML = this.buildScaffoldCard(question, scaffoldIndex, exploredOptions);
  }

  /**
   * Build scaffold question card HTML
   */
  buildScaffoldCard(question, scaffoldIndex, exploredOptions) {
    const optionsHTML = this.buildScaffoldOptions(question, exploredOptions);
    const explorationHTML = this.buildExplorationPanel(question, exploredOptions);
    const introMessage = scaffoldRemediation.getScaffoldIntroMessage(scaffoldIndex);

    // Check if correct answer has been found
    const correctFound = exploredOptions.includes(question.answer);

    return `
      <div class="question-card scaffold-card">
        <div class="scaffold-header">
          <span class="scaffold-badge">Scaffold ${scaffoldIndex + 1} of 3</span>
          <span class="scaffold-purpose">Building understanding...</span>
        </div>

        <div class="luminara-scaffold-intro">
          <div class="speaker">Ms. Luminara</div>
          <p>"${introMessage}"</p>
        </div>

        <div class="q-text">${this.escapeHtml(question.q)}</div>

        <div class="options">${optionsHTML}</div>

        ${explorationHTML}

        <div class="scaffold-progress">
          <div class="progress-dots">
            ${[0, 1, 2].map(i =>
              `<span class="dot ${i < scaffoldIndex ? 'completed' : i === scaffoldIndex ? 'active' : ''}">${i + 1}</span>`
            ).join('')}
          </div>
        </div>

        ${correctFound ? `
          <div class="scaffold-next-container">
            <button class="scaffold-next-btn" onclick="quiz.nextScaffold()">
              ${scaffoldIndex < 2 ? 'Next Scaffold →' : 'Complete Scaffolds →'}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Show heal animation when scaffold answer is correct
   */
  showScaffoldHeal(healResult) {
    if (!healResult || healResult.healed <= 0) return;

    const popup = document.createElement('div');
    popup.className = 'scaffold-heal-popup';
    popup.innerHTML = `
      <div class="heal-icon">💚</div>
      <div class="heal-amount">+${healResult.healed} HP</div>
      <div class="heal-message">${scaffoldRemediation.getHealMessage(healResult)}</div>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
      popup.classList.add('hiding');
      setTimeout(() => popup.remove(), 400);
    }, 1500);
  }

  /**
   * Show scaffold completion summary
   */
  showScaffoldComplete(summary) {
    const popup = document.createElement('div');
    popup.className = 'scaffold-complete-popup';

    const successRate = Math.round((summary.correctCount / 3) * 100);

    popup.innerHTML = `
      <div class="scaffold-complete-card">
        <div class="complete-header">
          <span class="complete-icon">✅</span>
          <span class="complete-title">Scaffolds Complete</span>
        </div>
        <div class="complete-stats">
          <div class="stat">
            <span class="value">${summary.correctCount}/3</span>
            <span class="label">Correct</span>
          </div>
          <div class="stat">
            <span class="value">+${summary.totalHealed}</span>
            <span class="label">HP Healed</span>
          </div>
        </div>
        <div class="complete-message">
          "${successRate >= 67 ? 'The foundation is stronger now.' : 'Every step forward matters.'}"
        </div>
        <button class="complete-continue" onclick="this.closest('.scaffold-complete-popup').remove()">
          Continue →
        </button>
      </div>
    `;

    document.body.appendChild(popup);
  }

  /**
   * Show knockout message when HP reaches 0
   */
  showKnockout() {
    const overlay = document.createElement('div');
    overlay.className = 'knockout-overlay';

    const message = scaffoldRemediation.getKnockoutMessage();

    overlay.innerHTML = `
      <div class="knockout-card">
        <div class="knockout-icon">💫</div>
        <div class="knockout-title">Knocked Down!</div>
        <div class="knockout-message">"${message}"</div>
        <div class="knockout-effect">
          <div class="effect-item">HP restored to full</div>
          <div class="effect-item penalty">XP gains halved this session</div>
        </div>
        <button class="knockout-continue" onclick="this.closest('.knockout-overlay').remove()">
          Rise Again →
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Render mini character stats in stats bar
   */
  renderCharacterMini() {
    if (!d20System) return '';

    const sheet = d20System.getCharacterSheet();
    const formatMod = (mod) => mod >= 0 ? `+${mod}` : `${mod}`;

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
    `;
  }

  // Voice system removed - see voice-work folder for archived code


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
   * Build scaffold option buttons (use exploreScaffoldOption handler)
   */
  buildScaffoldOptions(question, exploredOptions) {
    return question.options.map((opt, i) => {
      const explored = exploredOptions.includes(i);
      const isCorrect = i === question.answer;
      let classes = 'option-btn scaffold-option';

      if (explored) {
        classes += isCorrect ? ' correct-answer' : ' wrong-answer';
      }

      return `
        <button class="${classes}" onclick="exploreScaffoldOption(${i})">
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
if (window._InventoryMixin) {
  Object.assign(QuizRenderer.prototype, window._InventoryMixin);
}
if (window._D20UIMixin) {
  Object.assign(QuizRenderer.prototype, window._D20UIMixin);
}
