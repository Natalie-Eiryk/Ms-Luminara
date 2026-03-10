/**
 * Ms. Luminara Quiz - Inventory & Paperdoll Module
 *
 * PAPERDOLL & INVENTORY UI
 * Contains: Equipment display, inventory grid, gem management,
 * item details, loot drops, rarity helpers
 *
 * This module extends QuizRenderer with inventory functionality.
 * Extracted from 000.2-renderer.js for Body-Function-Subfunction compliance.
 */

// Inventory Mixin - adds inventory/paperdoll methods to QuizRenderer
const InventoryMixin = {

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
  },

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
  },

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
        ${item.sockets > 0 ? `<span class="socket-indicator">${'◇'.repeat(Math.max(0, item.sockets - (item.gems?.length || 0)))}${'◆'.repeat(item.gems?.length || 0)}</span>` : ''}
      </div>
    `;
  },

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
  },

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
  },

  /**
   * Get rarity color
   */
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
  },

  /**
   * Get rarity info object
   */
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
  },

  /**
   * Format stat name for display
   */
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
  },

  /**
   * Calculate item sell price
   */
  getItemSellPrice(item) {
    const rarityMultiplier = { COMMON: 5, UNCOMMON: 15, RARE: 50, EPIC: 150, LEGENDARY: 500, UNIQUE: 1000 };
    return Math.floor((item.level * 10) * (rarityMultiplier[item.rarity] || 5) / 10);
  },

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
        const rarity = drop.rarity || 'COMMON';
        const rarityColor = this.getRarityColor(rarity);
        notification.innerHTML = `
          <span class="loot-icon">${drop.icon || '📦'}</span>
          <span class="loot-text" style="color: ${rarityColor}">${drop.name || 'Item'}</span>
        `;
        notification.classList.add(`rarity-${rarity.toLowerCase()}`);
      }

      container.appendChild(notification);
    });

    document.body.appendChild(container);

    // Remove after animation
    setTimeout(() => container.remove(), 4000);
  },

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
};

// Apply mixin to QuizRenderer when it's available
if (typeof QuizRenderer !== 'undefined') {
  Object.assign(QuizRenderer.prototype, InventoryMixin);
} else {
  // Store for later application
  window._InventoryMixin = InventoryMixin;
}
