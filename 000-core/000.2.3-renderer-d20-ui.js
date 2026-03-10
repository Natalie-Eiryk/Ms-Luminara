/**
 * Ms. Luminara Quiz - D20 RPG UI Module
 *
 * D20 RPG UI COMPONENTS
 * Contains: Dice rolls, character sheets, skill checks,
 * streak saves, encounter banners, character mini display
 *
 * This module extends QuizRenderer with D20 RPG functionality.
 * Extracted from 000.2-renderer.js for Body-Function-Subfunction compliance.
 */

// D20 UI Mixin - adds D20 RPG UI methods to QuizRenderer
const D20UIMixin = {

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
  },

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
              <div class="stat-xp-fill" style="width: ${stats.intelligence.xpProgress || 0}%"></div>
            </div>
          </div>
          <div class="stat-block">
            <div class="stat-name">WIS</div>
            <div class="stat-value">${stats.wisdom.value}</div>
            <div class="stat-mod">${formatMod(stats.wisdom.modifier)}</div>
            <div class="stat-xp-bar">
              <div class="stat-xp-fill" style="width: ${stats.wisdom.xpProgress || 0}%"></div>
            </div>
          </div>
          <div class="stat-block">
            <div class="stat-name">CON</div>
            <div class="stat-value">${stats.constitution.value}</div>
            <div class="stat-mod">${formatMod(stats.constitution.modifier)}</div>
            <div class="stat-xp-bar">
              <div class="stat-xp-fill" style="width: ${stats.constitution.xpProgress || 0}%"></div>
            </div>
          </div>
          <div class="stat-block">
            <div class="stat-name">CHA</div>
            <div class="stat-value">${stats.charisma.value}</div>
            <div class="stat-mod">${formatMod(stats.charisma.modifier)}</div>
            <div class="stat-xp-bar">
              <div class="stat-xp-fill" style="width: ${stats.charisma.xpProgress || 0}%"></div>
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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

  /**
   * Update voice setting
   */
  updateVoiceSetting(key, value) {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;
    voiceSystem.settings[key] = value;
    voiceSystem.saveSettings();
  },

  /**
   * Quick audition a voice
   */
  async quickAudition(voiceId) {
    if (typeof voiceSystem === 'undefined' || !voiceSystem) return;

    // Update selection UI
    document.querySelectorAll('.voice-item').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.voice === voiceId);
    });

    // Update settings
    voiceSystem.settings.piperModel = voiceId;
    voiceSystem.saveSettings();

    // Play preview
    await voiceSystem.previewVoice({ backend: 'piper', id: voiceId }, 'short');
  }
};

// Apply mixin to QuizRenderer when it's available
if (typeof QuizRenderer !== 'undefined') {
  Object.assign(QuizRenderer.prototype, D20UIMixin);
} else {
  // Store for later application
  window._D20UIMixin = D20UIMixin;
}
