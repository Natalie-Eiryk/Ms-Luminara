/**
 * Ms. Luminara Quiz - Diablo-Style Loot & Equipment System
 *
 * Features:
 * - Rarity tiers (Common → Legendary → Unique)
 * - Equipment slots (paperdoll)
 * - Stat bonuses from gear
 * - Loot drops from quiz performance
 * - Set bonuses
 * - Socketed items with gems
 * - Equipment durability and repair
 */

// ============================================================================
// RARITY TIERS
// ============================================================================

const RARITY = {
  COMMON:    { name: 'Common',    color: '#9ca3af', dropWeight: 50, statMultiplier: 1.0 },
  UNCOMMON:  { name: 'Uncommon',  color: '#22c55e', dropWeight: 30, statMultiplier: 1.25 },
  RARE:      { name: 'Rare',      color: '#3b82f6', dropWeight: 15, statMultiplier: 1.5 },
  EPIC:      { name: 'Epic',      color: '#a855f7', dropWeight: 4,  statMultiplier: 2.0 },
  LEGENDARY: { name: 'Legendary', color: '#f59e0b', dropWeight: 0.9, statMultiplier: 3.0 },
  UNIQUE:    { name: 'Unique',    color: '#06b6d4', dropWeight: 0.1, statMultiplier: 4.0 }
};

// ============================================================================
// EQUIPMENT SLOTS
// ============================================================================

const EQUIPMENT_SLOTS = {
  HEAD:      { name: 'Head',      icon: '🎓', description: 'Headwear for mental fortitude' },
  NECK:      { name: 'Amulet',    icon: '📿', description: 'Neck adornment of wisdom' },
  SHOULDERS: { name: 'Shoulders', icon: '🦺', description: 'Burden bearers of knowledge' },
  CHEST:     { name: 'Chest',     icon: '🥼', description: 'Core protection garment' },
  HANDS:     { name: 'Gloves',    icon: '🧤', description: 'Precision instruments' },
  WAIST:     { name: 'Belt',      icon: '🎗️', description: 'Utility binding' },
  LEGS:      { name: 'Legs',      icon: '👖', description: 'Foundation of stance' },
  FEET:      { name: 'Boots',     icon: '👢', description: 'Grounding footwear' },
  RING_L:    { name: 'Left Ring', icon: '💍', description: 'Ring of focus' },
  RING_R:    { name: 'Right Ring',icon: '💍', description: 'Ring of insight' },
  MAINHAND:  { name: 'Main Hand', icon: '📚', description: 'Primary tool of learning' },
  OFFHAND:   { name: 'Off Hand',  icon: '📖', description: 'Secondary reference' }
};

// ============================================================================
// EQUIPMENT TYPES (what can go in each slot)
// ============================================================================

const EQUIPMENT_TYPES = {
  // Head
  SCHOLARS_CAP:    { slot: 'HEAD', baseStats: { intelligence: 3, wisdom: 1 }, names: ['Cap', 'Hood', 'Crown', 'Helm', 'Circlet'] },
  THINKING_CAP:    { slot: 'HEAD', baseStats: { intelligence: 5 }, names: ['Thinking Cap', 'Brainstorm Hood', 'Cognition Crown'] },

  // Neck
  PENDANT:         { slot: 'NECK', baseStats: { wisdom: 2, charisma: 2 }, names: ['Pendant', 'Amulet', 'Talisman', 'Charm', 'Medallion'] },
  FOCUS_CRYSTAL:   { slot: 'NECK', baseStats: { wisdom: 4, constitution: 1 }, names: ['Focus Crystal', 'Mind Gem', 'Concentration Stone'] },

  // Shoulders
  MANTLE:          { slot: 'SHOULDERS', baseStats: { constitution: 3, intelligence: 1 }, names: ['Mantle', 'Pauldrons', 'Epaulettes', 'Shoulderguard'] },

  // Chest
  ROBE:            { slot: 'CHEST', baseStats: { constitution: 5, wisdom: 2 }, names: ['Robe', 'Coat', 'Vestments', 'Tunic', 'Garb'] },
  LAB_COAT:        { slot: 'CHEST', baseStats: { intelligence: 4, constitution: 3 }, names: ['Lab Coat', 'Research Garb', 'Scholar\'s Vestment'] },

  // Hands
  GLOVES:          { slot: 'HANDS', baseStats: { wisdom: 2, charisma: 1 }, names: ['Gloves', 'Gauntlets', 'Handwraps', 'Grips'] },

  // Waist
  BELT:            { slot: 'WAIST', baseStats: { constitution: 2, wisdom: 1 }, names: ['Belt', 'Sash', 'Girdle', 'Cord'] },

  // Legs
  LEGGINGS:        { slot: 'LEGS', baseStats: { constitution: 3, charisma: 1 }, names: ['Leggings', 'Trousers', 'Pants', 'Greaves'] },

  // Feet
  BOOTS:           { slot: 'FEET', baseStats: { constitution: 2, charisma: 2 }, names: ['Boots', 'Shoes', 'Sandals', 'Treads'] },

  // Rings
  RING:            { slot: 'RING_L', baseStats: { intelligence: 1, wisdom: 1, charisma: 1 }, names: ['Ring', 'Band', 'Loop', 'Circle'] },
  SIGNET:          { slot: 'RING_R', baseStats: { charisma: 3 }, names: ['Signet', 'Seal Ring', 'Emblem Ring'] },

  // Main Hand (Books, Scrolls, etc.)
  TOME:            { slot: 'MAINHAND', baseStats: { intelligence: 6, wisdom: 2 }, names: ['Tome', 'Codex', 'Grimoire', 'Manual', 'Compendium'] },
  QUILL:           { slot: 'MAINHAND', baseStats: { intelligence: 4, charisma: 3 }, names: ['Quill', 'Pen', 'Stylus', 'Writing Instrument'] },

  // Off Hand
  REFERENCE:       { slot: 'OFFHAND', baseStats: { wisdom: 4, intelligence: 2 }, names: ['Reference', 'Guide', 'Handbook', 'Atlas', 'Encyclopedia'] },
  SCROLL:          { slot: 'OFFHAND', baseStats: { intelligence: 3, wisdom: 3 }, names: ['Scroll', 'Parchment', 'Notes', 'Manuscript'] }
};

// ============================================================================
// AFFIXES (Prefixes and Suffixes for magic items)
// ============================================================================

const PREFIXES = {
  // Intelligence
  KEEN:         { stat: 'intelligence', bonus: [1, 3], name: 'Keen' },
  BRILLIANT:    { stat: 'intelligence', bonus: [3, 6], name: 'Brilliant' },
  GENIUS:       { stat: 'intelligence', bonus: [6, 10], name: 'Genius' },

  // Wisdom
  WISE:         { stat: 'wisdom', bonus: [1, 3], name: 'Wise' },
  SAGACIOUS:    { stat: 'wisdom', bonus: [3, 6], name: 'Sagacious' },
  ENLIGHTENED:  { stat: 'wisdom', bonus: [6, 10], name: 'Enlightened' },

  // Constitution
  STURDY:       { stat: 'constitution', bonus: [1, 3], name: 'Sturdy' },
  ENDURING:     { stat: 'constitution', bonus: [3, 6], name: 'Enduring' },
  UNYIELDING:   { stat: 'constitution', bonus: [6, 10], name: 'Unyielding' },

  // Charisma
  CHARMING:     { stat: 'charisma', bonus: [1, 3], name: 'Charming' },
  INSPIRING:    { stat: 'charisma', bonus: [3, 6], name: 'Inspiring' },
  MAGNIFICENT:  { stat: 'charisma', bonus: [6, 10], name: 'Magnificent' },

  // XP bonus
  STUDIOUS:     { stat: 'xpBonus', bonus: [5, 10], name: 'Studious', isPercent: true },
  SCHOLARLY:    { stat: 'xpBonus', bonus: [10, 20], name: 'Scholarly', isPercent: true },

  // Insight bonus
  CURIOUS:      { stat: 'insightBonus', bonus: [1, 2], name: 'Curious' },
  INQUISITIVE:  { stat: 'insightBonus', bonus: [2, 4], name: 'Inquisitive' }
};

const SUFFIXES = {
  // Stat combos
  OF_THE_SCHOLAR: { stats: { intelligence: [2, 4], wisdom: [2, 4] }, name: 'of the Scholar' },
  OF_THE_SAGE:    { stats: { wisdom: [3, 6], constitution: [1, 3] }, name: 'of the Sage' },
  OF_THE_MIND:    { stats: { intelligence: [4, 8] }, name: 'of the Mind' },
  OF_FOCUS:       { stats: { wisdom: [2, 4], charisma: [2, 4] }, name: 'of Focus' },
  OF_STAMINA:     { stats: { constitution: [4, 8] }, name: 'of Stamina' },
  OF_CHARM:       { stats: { charisma: [4, 8] }, name: 'of Charm' },

  // Special effects
  OF_STREAKING:   { stats: { streakBonus: [5, 15] }, name: 'of Streaking', isPercent: true },
  OF_FORTUNE:     { stats: { luckyChance: [2, 5] }, name: 'of Fortune', isPercent: true },
  OF_REVENGE:     { stats: { revengeBonus: [10, 25] }, name: 'of Revenge', isPercent: true },
  OF_INSIGHT:     { stats: { insightBonus: [1, 3] }, name: 'of Insight' }
};

// ============================================================================
// UNIQUE ITEMS
// ============================================================================

const UNIQUE_ITEMS = {
  LUMINARAS_FAVOR: {
    type: 'PENDANT',
    name: "Ms. Luminara's Favor",
    lore: "A gift for her most dedicated student...",
    stats: { wisdom: 12, charisma: 8, xpBonus: 25 },
    special: 'Streaks cannot be broken while wearing this item (once per session)',
    icon: '💖'
  },
  TOME_OF_ENDLESS_KNOWLEDGE: {
    type: 'TOME',
    name: 'Tome of Endless Knowledge',
    lore: "Its pages never run out...",
    stats: { intelligence: 15, wisdom: 8 },
    special: 'Insight checks have advantage',
    icon: '📕'
  },
  CROWN_OF_THE_ARCHMAGE: {
    type: 'SCHOLARS_CAP',
    name: 'Crown of the Archmage',
    lore: "Worn by the greatest minds in history.",
    stats: { intelligence: 10, wisdom: 10, constitution: 5 },
    special: '+50% XP from critical successes',
    icon: '👑'
  },
  BOOTS_OF_SWIFT_STUDY: {
    type: 'BOOTS',
    name: 'Boots of Swift Study',
    lore: "For those who walk the path of knowledge swiftly.",
    stats: { constitution: 8, charisma: 4 },
    special: 'Warmups grant +50% more stat XP',
    icon: '⚡'
  },
  RING_OF_PERFECT_RECALL: {
    type: 'RING',
    name: 'Ring of Perfect Recall',
    lore: "Nothing is ever truly forgotten...",
    stats: { wisdom: 8, intelligence: 4 },
    special: 'Revenge questions grant triple XP',
    icon: '🔮'
  }
};

// ============================================================================
// SET ITEMS
// ============================================================================

const ITEM_SETS = {
  ANATOMY_STUDENT: {
    name: "Anatomy Student's Regalia",
    pieces: ['HEAD', 'CHEST', 'HANDS'],
    bonuses: {
      2: { intelligence: 5, description: '(2) +5 Intelligence' },
      3: { xpBonus: 15, wisdom: 5, description: '(3) +15% XP, +5 Wisdom' }
    }
  },
  SCHOLARS_ENSEMBLE: {
    name: "Scholar's Ensemble",
    pieces: ['HEAD', 'CHEST', 'LEGS', 'FEET'],
    bonuses: {
      2: { constitution: 5, description: '(2) +5 Constitution' },
      3: { wisdom: 8, description: '(3) +8 Wisdom' },
      4: { allStats: 5, luckyChance: 5, description: '(4) +5 All Stats, +5% Lucky Strike' }
    }
  },
  RING_OF_MASTERY: {
    name: 'Rings of Mastery',
    pieces: ['RING_L', 'RING_R'],
    bonuses: {
      2: { allStats: 3, streakBonus: 10, description: '(2) +3 All Stats, +10% Streak Bonus' }
    }
  }
};

// ============================================================================
// GEMS (Socketables)
// ============================================================================

const GEMS = {
  SAPPHIRE:  { name: 'Sapphire',  color: '#3b82f6', stat: 'intelligence', bonus: [2, 5, 10], icon: '💎' },
  EMERALD:   { name: 'Emerald',   color: '#22c55e', stat: 'wisdom',       bonus: [2, 5, 10], icon: '💚' },
  RUBY:      { name: 'Ruby',      color: '#ef4444', stat: 'constitution', bonus: [2, 5, 10], icon: '❤️' },
  TOPAZ:     { name: 'Topaz',     color: '#f59e0b', stat: 'charisma',     bonus: [2, 5, 10], icon: '💛' },
  DIAMOND:   { name: 'Diamond',   color: '#f8fafc', stat: 'allStats',     bonus: [1, 2, 4],  icon: '💠' },
  AMETHYST:  { name: 'Amethyst',  color: '#a855f7', stat: 'xpBonus',      bonus: [3, 7, 15], icon: '💜', isPercent: true }
};

const GEM_TIERS = ['Chipped', 'Flawed', 'Regular', 'Flawless', 'Perfect'];

// ============================================================================
// LOOT SYSTEM CLASS
// ============================================================================

class LootSystem {
  constructor() {
    this.STORAGE_KEY = 'ms_luminara_loot';
    this.data = this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load loot data:', e);
    }
    return this.getDefaultData();
  }

  getDefaultData() {
    return {
      inventory: [],         // Array of item objects
      equipped: {},          // Slot -> item mapping
      gems: [],              // Collected gems
      gold: 0,               // Currency for shop/repairs
      lootHistory: [],       // Recent drops
      setsDiscovered: [],    // Discovered set pieces
      uniquesFound: []       // Found unique items
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save loot data:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ITEM GENERATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate a random item based on player level and performance
   */
  generateItem(options = {}) {
    const {
      playerLevel = 1,
      bonusRarity = 0,  // 0-100 bonus to rarity roll
      forceRarity = null,
      forceSlot = null,
      forceUnique = null
    } = options;

    // Determine rarity
    const rarity = forceRarity || this.rollRarity(bonusRarity);

    // Check for unique drop
    if (forceUnique) {
      const unique = this.rollUnique(forceUnique);
      if (unique) return this.createUniqueItem(unique);
    } else if (rarity === 'UNIQUE') {
      const unique = this.rollUnique(null);
      if (unique) return this.createUniqueItem(unique);
      // If no unique available, downgrade to LEGENDARY
      rarity = 'LEGENDARY';
    }

    // Pick equipment type
    const typeKey = forceSlot ?
      this.getRandomTypeForSlot(forceSlot) :
      this.getRandomEquipmentType();

    const type = EQUIPMENT_TYPES[typeKey];
    if (!type) return null;

    // Generate base item
    const item = {
      id: this.generateItemId(),
      typeKey,
      type: type.slot,
      rarity,
      level: playerLevel,
      name: this.generateItemName(type, rarity),
      stats: this.calculateBaseStats(type, rarity, playerLevel),
      affixes: [],
      sockets: this.rollSockets(rarity),
      gems: [],
      durability: 100,
      maxDurability: 100,
      setId: null
    };

    // Add affixes based on rarity
    this.addAffixes(item, rarity);

    // Check for set item
    if (rarity === 'RARE' || rarity === 'EPIC') {
      this.checkForSetItem(item);
    }

    return item;
  }

  generateItemId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  }

  rollRarity(bonus = 0) {
    const roll = Math.random() * 100 + bonus;
    let cumulative = 0;

    for (const [key, rarity] of Object.entries(RARITY)) {
      cumulative += rarity.dropWeight;
      if (roll <= cumulative) return key;
    }

    return 'COMMON';
  }

  rollUnique(forceKey = null) {
    if (forceKey) return UNIQUE_ITEMS[forceKey];

    const uniqueKeys = Object.keys(UNIQUE_ITEMS);
    const notFound = uniqueKeys.filter(k => !this.data.uniquesFound.includes(k));

    if (notFound.length === 0) return null;

    // 50% chance to get a unique when UNIQUE rarity is rolled
    if (Math.random() < 0.5) {
      return UNIQUE_ITEMS[notFound[Math.floor(Math.random() * notFound.length)]];
    }

    return null;
  }

  createUniqueItem(unique) {
    const type = EQUIPMENT_TYPES[unique.type];

    const item = {
      id: this.generateItemId(),
      typeKey: unique.type,
      type: type.slot,
      rarity: 'UNIQUE',
      level: 1,
      name: unique.name,
      stats: { ...unique.stats },
      affixes: [],
      sockets: 0,
      gems: [],
      durability: 100,
      maxDurability: 100,
      setId: null,
      isUnique: true,
      uniqueKey: Object.keys(UNIQUE_ITEMS).find(k => UNIQUE_ITEMS[k] === unique),
      lore: unique.lore,
      special: unique.special,
      icon: unique.icon
    };

    return item;
  }

  getRandomEquipmentType() {
    const types = Object.keys(EQUIPMENT_TYPES);
    return types[Math.floor(Math.random() * types.length)];
  }

  getRandomTypeForSlot(slot) {
    const types = Object.entries(EQUIPMENT_TYPES)
      .filter(([_, t]) => t.slot === slot || t.slot === slot.replace('RING_L', 'RING_R').replace('RING_R', 'RING_L'))
      .map(([k, _]) => k);

    return types[Math.floor(Math.random() * types.length)];
  }

  generateItemName(type, rarity) {
    const baseName = type.names[Math.floor(Math.random() * type.names.length)];
    return baseName;
  }

  calculateBaseStats(type, rarity, level) {
    const multiplier = RARITY[rarity].statMultiplier;
    const levelBonus = 1 + (level - 1) * 0.1;
    const stats = {};

    for (const [stat, value] of Object.entries(type.baseStats)) {
      stats[stat] = Math.floor(value * multiplier * levelBonus);
    }

    return stats;
  }

  addAffixes(item, rarity) {
    let numPrefixes = 0;
    let numSuffixes = 0;

    switch (rarity) {
      case 'UNCOMMON':
        numPrefixes = 1;
        break;
      case 'RARE':
        numPrefixes = 1;
        numSuffixes = 1;
        break;
      case 'EPIC':
        numPrefixes = Math.random() < 0.5 ? 2 : 1;
        numSuffixes = Math.random() < 0.5 ? 2 : 1;
        break;
      case 'LEGENDARY':
        numPrefixes = 2;
        numSuffixes = 2;
        break;
    }

    // Add prefixes
    const prefixKeys = Object.keys(PREFIXES);
    for (let i = 0; i < numPrefixes; i++) {
      const key = prefixKeys[Math.floor(Math.random() * prefixKeys.length)];
      const prefix = PREFIXES[key];
      const bonus = this.randomInRange(prefix.bonus[0], prefix.bonus[1]);

      item.affixes.push({
        type: 'prefix',
        key,
        name: prefix.name,
        stat: prefix.stat,
        bonus,
        isPercent: prefix.isPercent
      });

      item.stats[prefix.stat] = (item.stats[prefix.stat] || 0) + bonus;
      item.name = prefix.name + ' ' + item.name;
    }

    // Add suffixes
    const suffixKeys = Object.keys(SUFFIXES);
    for (let i = 0; i < numSuffixes; i++) {
      const key = suffixKeys[Math.floor(Math.random() * suffixKeys.length)];
      const suffix = SUFFIXES[key];

      item.affixes.push({
        type: 'suffix',
        key,
        name: suffix.name
      });

      for (const [stat, range] of Object.entries(suffix.stats)) {
        const bonus = this.randomInRange(range[0], range[1]);
        item.stats[stat] = (item.stats[stat] || 0) + bonus;
      }

      item.name = item.name + ' ' + suffix.name;
    }
  }

  rollSockets(rarity) {
    switch (rarity) {
      case 'RARE': return Math.random() < 0.3 ? 1 : 0;
      case 'EPIC': return Math.random() < 0.5 ? (Math.random() < 0.3 ? 2 : 1) : 0;
      case 'LEGENDARY': return Math.random() < 0.7 ? (Math.random() < 0.4 ? 2 : 1) : 0;
      default: return 0;
    }
  }

  checkForSetItem(item) {
    // 20% chance for rare/epic to be a set item
    if (Math.random() > 0.2) return;

    for (const [setId, set] of Object.entries(ITEM_SETS)) {
      if (set.pieces.includes(item.type)) {
        item.setId = setId;
        item.setName = set.name;
        item.name = set.name.split("'")[0] + ' ' + item.name;
        break;
      }
    }
  }

  randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ═══════════════════════════════════════════════════════════════
  // LOOT DROPS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calculate loot drop from quiz performance
   */
  rollLoot(performance) {
    const {
      wasCorrect,
      wasFirstTry,
      streakLength,
      isCritical,
      isRevengeSuccess,
      playerLevel
    } = performance;

    const drops = [];

    // Base drop chance
    let dropChance = 15; // 15% base

    // Modifiers
    if (wasCorrect) dropChance += 10;
    if (wasFirstTry) dropChance += 15;
    if (streakLength >= 5) dropChance += streakLength * 2;
    if (isCritical) dropChance += 30;
    if (isRevengeSuccess) dropChance += 20;

    // Rarity bonus from performance
    let rarityBonus = 0;
    if (wasFirstTry) rarityBonus += 10;
    if (streakLength >= 10) rarityBonus += 15;
    if (isCritical) rarityBonus += 25;

    // Roll for item drop
    if (Math.random() * 100 < dropChance) {
      const item = this.generateItem({
        playerLevel,
        bonusRarity: rarityBonus
      });

      if (item) {
        drops.push(item);
        this.addToInventory(item);
      }
    }

    // Roll for gem drop (separate, lower chance)
    if (Math.random() * 100 < dropChance * 0.3) {
      const gem = this.generateGem(playerLevel);
      drops.push(gem);
      this.addGem(gem);
    }

    // Gold drop
    const gold = this.calculateGoldDrop(performance);
    if (gold > 0) {
      this.data.gold += gold;
      drops.push({ type: 'gold', amount: gold });
    }

    if (drops.length > 0) {
      this.data.lootHistory.unshift({
        drops,
        timestamp: Date.now()
      });

      if (this.data.lootHistory.length > 50) {
        this.data.lootHistory.pop();
      }

      this.save();
    }

    return drops;
  }

  generateGem(playerLevel) {
    const gemTypes = Object.keys(GEMS);
    const gemKey = gemTypes[Math.floor(Math.random() * gemTypes.length)];
    const gem = GEMS[gemKey];

    // Tier based on level
    let tierIndex = Math.min(
      Math.floor(playerLevel / 10),
      GEM_TIERS.length - 1
    );

    // Random chance to get lower tier
    tierIndex = Math.max(0, tierIndex - Math.floor(Math.random() * 2));

    return {
      type: 'gem',
      gemKey,
      ...gem,
      tier: tierIndex,
      tierName: GEM_TIERS[tierIndex],
      statBonus: gem.bonus[Math.min(tierIndex, gem.bonus.length - 1)],
      id: 'gem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    };
  }

  calculateGoldDrop(performance) {
    let gold = 0;

    if (performance.wasCorrect) gold += 10;
    if (performance.wasFirstTry) gold += 15;
    if (performance.streakLength >= 3) gold += performance.streakLength * 5;
    if (performance.isCritical) gold += 50;

    // Random variance
    gold = Math.floor(gold * (0.8 + Math.random() * 0.4));

    return gold;
  }

  // ═══════════════════════════════════════════════════════════════
  // INVENTORY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  addToInventory(item) {
    this.data.inventory.push(item);

    if (item.isUnique && item.uniqueKey) {
      if (!this.data.uniquesFound.includes(item.uniqueKey)) {
        this.data.uniquesFound.push(item.uniqueKey);
      }
    }

    this.save();
  }

  removeFromInventory(itemId) {
    this.data.inventory = this.data.inventory.filter(i => i.id !== itemId);
    this.save();
  }

  addGem(gem) {
    this.data.gems.push(gem);
    this.save();
  }

  removeGem(gemId) {
    this.data.gems = this.data.gems.filter(g => g.id !== gemId);
    this.save();
  }

  // ═══════════════════════════════════════════════════════════════
  // EQUIPMENT
  // ═══════════════════════════════════════════════════════════════

  equipItem(item) {
    const slot = item.type;

    // Unequip current item in slot
    const current = this.data.equipped[slot];
    if (current) {
      this.addToInventory(current);
    }

    // Remove from inventory and equip
    this.removeFromInventory(item.id);
    this.data.equipped[slot] = item;
    this.save();

    return current;
  }

  unequipItem(slot) {
    const item = this.data.equipped[slot];
    if (item) {
      this.addToInventory(item);
      delete this.data.equipped[slot];
      this.save();
    }
    return item;
  }

  getEquipped() {
    return this.data.equipped;
  }

  getInventory() {
    return this.data.inventory;
  }

  // ═══════════════════════════════════════════════════════════════
  // STAT CALCULATIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calculate total stats from all equipped items
   */
  calculateEquipmentStats() {
    const stats = {
      intelligence: 0,
      wisdom: 0,
      constitution: 0,
      charisma: 0,
      xpBonus: 0,
      streakBonus: 0,
      luckyChance: 0,
      insightBonus: 0,
      revengeBonus: 0,
      allStats: 0
    };

    // Sum up equipped item stats
    for (const item of Object.values(this.data.equipped)) {
      if (!item) continue;

      for (const [stat, value] of Object.entries(item.stats)) {
        stats[stat] = (stats[stat] || 0) + value;
      }

      // Add gem stats
      for (const gem of item.gems || []) {
        if (gem.stat === 'allStats') {
          stats.allStats += gem.statBonus;
        } else {
          stats[gem.stat] = (stats[gem.stat] || 0) + gem.statBonus;
        }
      }
    }

    // Apply allStats bonus
    if (stats.allStats > 0) {
      stats.intelligence += stats.allStats;
      stats.wisdom += stats.allStats;
      stats.constitution += stats.allStats;
      stats.charisma += stats.allStats;
    }

    // Calculate set bonuses
    const setBonuses = this.calculateSetBonuses();
    for (const [stat, value] of Object.entries(setBonuses)) {
      stats[stat] = (stats[stat] || 0) + value;
    }

    return stats;
  }

  calculateSetBonuses() {
    const setBonuses = {};
    const equippedSets = {};

    // Count equipped set pieces
    for (const item of Object.values(this.data.equipped)) {
      if (item && item.setId) {
        equippedSets[item.setId] = (equippedSets[item.setId] || 0) + 1;
      }
    }

    // Apply set bonuses
    for (const [setId, count] of Object.entries(equippedSets)) {
      const set = ITEM_SETS[setId];
      if (!set) continue;

      for (const [threshold, bonus] of Object.entries(set.bonuses)) {
        if (count >= parseInt(threshold)) {
          for (const [stat, value] of Object.entries(bonus)) {
            if (stat !== 'description') {
              setBonuses[stat] = (setBonuses[stat] || 0) + value;
            }
          }
        }
      }
    }

    return setBonuses;
  }

  getActiveSetBonuses() {
    const active = [];
    const equippedSets = {};

    for (const item of Object.values(this.data.equipped)) {
      if (item && item.setId) {
        equippedSets[item.setId] = (equippedSets[item.setId] || 0) + 1;
      }
    }

    for (const [setId, count] of Object.entries(equippedSets)) {
      const set = ITEM_SETS[setId];
      if (!set) continue;

      active.push({
        setId,
        name: set.name,
        equipped: count,
        total: set.pieces.length,
        bonuses: Object.entries(set.bonuses)
          .filter(([t, _]) => parseInt(t) <= count)
          .map(([_, b]) => b.description)
      });
    }

    return active;
  }

  // ═══════════════════════════════════════════════════════════════
  // GEMS & SOCKETS
  // ═══════════════════════════════════════════════════════════════

  socketGem(itemId, gemId) {
    const item = this.data.inventory.find(i => i.id === itemId) ||
                 Object.values(this.data.equipped).find(i => i && i.id === itemId);
    const gem = this.data.gems.find(g => g.id === gemId);

    if (!item || !gem) return false;
    if ((item.gems || []).length >= item.sockets) return false;

    item.gems = item.gems || [];
    item.gems.push(gem);
    this.removeGem(gemId);

    this.save();
    return true;
  }

  unsocketGem(itemId, gemIndex) {
    const item = this.data.inventory.find(i => i.id === itemId) ||
                 Object.values(this.data.equipped).find(i => i && i.id === itemId);

    if (!item || !item.gems || !item.gems[gemIndex]) return null;

    const gem = item.gems.splice(gemIndex, 1)[0];
    this.addGem(gem);

    this.save();
    return gem;
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════

  getGold() {
    return this.data.gold;
  }

  spendGold(amount) {
    if (this.data.gold >= amount) {
      this.data.gold -= amount;
      this.save();
      return true;
    }
    return false;
  }

  getGems() {
    return this.data.gems;
  }

  /**
   * Calculate sell price for an item
   */
  calculateSellPrice(item) {
    if (!item) return 0;

    const rarityMultipliers = {
      COMMON: 5,
      UNCOMMON: 15,
      RARE: 50,
      EPIC: 150,
      LEGENDARY: 500,
      UNIQUE: 1000
    };

    const rarityMult = rarityMultipliers[item.rarity] || 5;
    const levelValue = (item.level || 1) * 10;

    // Base price
    let price = Math.floor(levelValue * rarityMult / 10);

    // Add value for socketed gems
    if (item.gems && item.gems.length > 0) {
      price += item.gems.length * 25;
    }

    // Add value for affixes
    if (item.affixes && item.affixes.length > 0) {
      price += item.affixes.length * 10;
    }

    return Math.max(1, price);
  }

  // ═══════════════════════════════════════════════════════════════
  // BOSS LOOT TABLES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get boss-specific loot table
   */
  getBossLootTable(bossId) {
    const tables = {
      forgetful_one: {
        guaranteedRarity: 'RARE',
        bonusRarity: 20,
        guaranteedSlots: ['HEAD', 'NECK'],
        uniqueChance: 0.15,
        possibleUniques: ['CROWN_OF_THE_ARCHMAGE'],
        goldBonus: 200,
        gemChance: 0.6,
        specialDrop: {
          name: "Memory Fragment",
          description: "A crystallized moment of clarity. +5% to all stats for one quiz session.",
          type: 'consumable',
          effect: 'temp_all_stats',
          value: 5,
          duration: 'session'
        }
      },

      procrastinator: {
        guaranteedRarity: 'RARE',
        bonusRarity: 15,
        guaranteedSlots: ['FEET', 'WAIST'],
        uniqueChance: 0.12,
        possibleUniques: ['BOOTS_OF_SWIFT_STUDY'],
        goldBonus: 175,
        gemChance: 0.5,
        specialDrop: {
          name: "Hourglass of Focus",
          description: "Time bends to your will. Next quiz has no time pressure.",
          type: 'consumable',
          effect: 'no_time_limit',
          duration: 'next_quiz'
        }
      },

      anxiety_spiral: {
        guaranteedRarity: 'EPIC',
        bonusRarity: 25,
        guaranteedSlots: ['CHEST', 'SHOULDERS'],
        uniqueChance: 0.18,
        possibleUniques: ['LUMINARAS_FAVOR'],
        goldBonus: 250,
        gemChance: 0.7,
        specialDrop: {
          name: "Calm Stone",
          description: "A smooth river stone that radiates peace. CON +10 for 3 boss battles.",
          type: 'consumable',
          effect: 'temp_constitution',
          value: 10,
          charges: 3
        }
      },

      distraction_demon: {
        guaranteedRarity: 'RARE',
        bonusRarity: 20,
        guaranteedSlots: ['HANDS', 'RING_L'],
        uniqueChance: 0.15,
        possibleUniques: ['RING_OF_PERFECT_RECALL'],
        goldBonus: 200,
        gemChance: 0.6,
        specialDrop: {
          name: "Focus Prism",
          description: "Refracts scattered thoughts into a single beam. Immune to distraction abilities.",
          type: 'consumable',
          effect: 'anti_distraction',
          charges: 5
        }
      },

      imposter: {
        guaranteedRarity: 'EPIC',
        bonusRarity: 30,
        guaranteedSlots: ['MAINHAND', 'OFFHAND'],
        uniqueChance: 0.25,
        possibleUniques: ['TOME_OF_ENDLESS_KNOWLEDGE'],
        goldBonus: 350,
        gemChance: 0.8,
        specialDrop: {
          name: "Mask of Confidence",
          description: "Fake it till you make it. +25% damage to all bosses for one run.",
          type: 'consumable',
          effect: 'boss_damage_boost',
          value: 25,
          duration: 'run'
        }
      },

      luminara_shadow: {
        guaranteedRarity: 'LEGENDARY',
        bonusRarity: 50,
        guaranteedSlots: ['HEAD', 'CHEST', 'MAINHAND'],
        uniqueChance: 0.5,
        possibleUniques: ['LUMINARAS_FAVOR', 'TOME_OF_ENDLESS_KNOWLEDGE', 'CROWN_OF_THE_ARCHMAGE'],
        goldBonus: 1000,
        gemChance: 1.0,
        gemCount: 3,
        specialDrop: {
          name: "Luminara's Blessing",
          description: "The ultimate acknowledgment. Permanent +5 to all base stats.",
          type: 'permanent',
          effect: 'permanent_all_stats',
          value: 5
        }
      }
    };

    return tables[bossId] || null;
  }

  /**
   * Generate loot drops from defeating a boss
   */
  generateBossLoot(bossId, playerLevel = 1, battlePerformance = {}) {
    const lootTable = this.getBossLootTable(bossId);
    if (!lootTable) {
      console.warn(`No loot table for boss: ${bossId}`);
      return [];
    }

    const drops = [];
    const {
      damageDealt = 0,
      damageTaken = 0,
      turnsTaken = 0,
      perfectVictory = false
    } = battlePerformance;

    // Performance bonus to rarity
    let performanceBonus = 0;
    if (perfectVictory) performanceBonus += 20;
    if (damageTaken === 0) performanceBonus += 15;
    if (turnsTaken <= 5) performanceBonus += 10;

    // Guaranteed equipment drops (1-2 items from guaranteed slots)
    const slotsToUse = [...lootTable.guaranteedSlots];
    const numGuaranteed = Math.min(slotsToUse.length, perfectVictory ? 2 : 1);

    for (let i = 0; i < numGuaranteed; i++) {
      const slotIndex = Math.floor(Math.random() * slotsToUse.length);
      const slot = slotsToUse.splice(slotIndex, 1)[0];

      const item = this.generateItem({
        playerLevel,
        bonusRarity: lootTable.bonusRarity + performanceBonus,
        forceRarity: lootTable.guaranteedRarity,
        forceSlot: slot
      });

      if (item) {
        drops.push(item);
        this.addToInventory(item);
      }
    }

    // Roll for unique item
    if (Math.random() < lootTable.uniqueChance + (performanceBonus / 100)) {
      const possibleUniques = lootTable.possibleUniques.filter(
        u => !this.data.uniquesFound.includes(u)
      );

      if (possibleUniques.length > 0) {
        const uniqueKey = possibleUniques[Math.floor(Math.random() * possibleUniques.length)];
        const uniqueItem = this.createUniqueItem(UNIQUE_ITEMS[uniqueKey]);
        drops.push(uniqueItem);
        this.addToInventory(uniqueItem);
      }
    }

    // Gem drops
    const gemCount = lootTable.gemCount || 1;
    for (let i = 0; i < gemCount; i++) {
      if (Math.random() < lootTable.gemChance) {
        const gem = this.generateGem(playerLevel + 5); // Bosses drop better gems
        drops.push(gem);
        this.addGem(gem);
      }
    }

    // Gold bonus
    const goldAmount = lootTable.goldBonus + Math.floor(Math.random() * 100);
    this.data.gold += goldAmount;
    drops.push({ type: 'gold', amount: goldAmount });

    // Special drop (always drops from bosses)
    if (lootTable.specialDrop) {
      const specialItem = {
        ...lootTable.specialDrop,
        id: 'special_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        bossId,
        acquiredAt: Date.now()
      };
      drops.push(specialItem);

      // Store special items separately
      if (!this.data.specialItems) {
        this.data.specialItems = [];
      }
      this.data.specialItems.push(specialItem);
    }

    // Record in history
    this.data.lootHistory.unshift({
      type: 'boss_loot',
      bossId,
      drops,
      timestamp: Date.now()
    });

    if (this.data.lootHistory.length > 50) {
      this.data.lootHistory.pop();
    }

    this.save();
    return drops;
  }

  /**
   * Get special items (consumables from bosses)
   */
  getSpecialItems() {
    return this.data.specialItems || [];
  }

  /**
   * Use a special item
   */
  useSpecialItem(itemId) {
    if (!this.data.specialItems) return null;

    const index = this.data.specialItems.findIndex(i => i.id === itemId);
    if (index === -1) return null;

    const item = this.data.specialItems[index];

    // Handle charges
    if (item.charges && item.charges > 1) {
      item.charges--;
      this.save();
      return { ...item, consumed: false };
    }

    // Consume item
    this.data.specialItems.splice(index, 1);
    this.save();
    return { ...item, consumed: true };
  }
}

// Export singleton
let lootSystem = null;
