/**
 * Ms. Luminara Quiz Application
 * Main application logic for the modular quiz system
 * Supports prerequisite "warmup" questions for scaffolded learning
 * Now with gamification: XP, streaks, achievements, and persistence
 */

class LuminaraQuiz {
  constructor() {
    this.registry = null;
    this.questionBanks = {};
    this.currentQuiz = [];
    this.currentIdx = 0;
    this.exploredOptions = {};
    this.renderer = null;
    this.achievements = [];

    // Prerequisite/warmup state
    this.currentPhase = 'main'; // 'warmup1', 'warmup2', or 'main'
    this.mainQuestion = null;   // The main question we're building toward
    this.warmupAnswered = { warmup1: false, warmup2: false };

    // Track if we've processed the correct answer for gamification
    this.correctAnswerProcessed = {};
    this.firstExplorationPerPhase = {};
    this.previousLevel = 1;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      await this.loadRegistry();
      await this.loadAchievements();
      this.initializeGamification();
      this.renderer = new QuizRenderer(this);
      this.setupCategoryButtons();
      this.renderer.renderLandingStats();
      console.log('Ms. Luminara Quiz initialized successfully');
    } catch (error) {
      console.error('Failed to initialize quiz:', error);
      this.showError('Failed to load quiz data. Please refresh the page.');
    }
  }

  /**
   * Load achievement definitions
   */
  async loadAchievements() {
    // Try fetch first
    try {
      const response = await fetch('000-core/000.5-achievements.json');
      if (response.ok) {
        this.achievements = await response.json();
        return;
      }
    } catch (e) {
      console.log('Fetch failed for achievements, using script fallback');
    }

    // Check if already loaded via script tag
    if (window.achievementsData) {
      this.achievements = window.achievementsData;
      return;
    }

    // Load via script tag for file:// protocol
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '000-core/000.5-achievements.js';
      script.onload = () => {
        this.achievements = window.achievementsData || [];
        resolve();
      };
      script.onerror = () => {
        console.warn('Could not load achievements');
        this.achievements = [];
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize gamification system
   */
  initializeGamification() {
    // persistence is already instantiated as a singleton
    gamification = new GamificationEngine(persistence, this.achievements);
    scaffolding = new ScaffoldingEngine(persistence);
    d20System = new D20System(persistence);
    lootSystem = new LootSystem();
    scaffoldRemediation = new ScaffoldRemediationEngine(persistence, d20System);
    this.previousLevel = persistence.getPlayer().level;
    this.currentEncounter = null;
  }

  /**
   * Load the question registry
   */
  async loadRegistry() {
    // Try fetch first (works with http server)
    // Fall back to embedded registry for file:// protocol
    try {
      const response = await fetch('000-core/question-registry.json');
      if (response.ok) {
        this.registry = await response.json();
        return;
      }
    } catch (e) {
      console.log('Fetch failed, using embedded registry (file:// mode)');
    }

    // Embedded registry for file:// protocol
    this.registry = {
      "version": "1.0.0",
      "categories": [
        {
          "id": "100",
          "name": "Brain",
          "description": "Chapter 12 — The Brain",
          "folder": "100-brain",
          "banks": [
            { "id": "100.1", "file": "100.1-structure.json", "title": "Brain Structure & Regions", "questionCount": 10 },
            { "id": "100.2", "file": "100.2-meninges-csf.json", "title": "Meninges & CSF", "questionCount": 6 },
            { "id": "100.3", "file": "100.3-cortex.json", "title": "Cerebral Cortex & Functions", "questionCount": 7 },
            { "id": "100.4", "file": "100.4-brainstem.json", "title": "Brainstem & Pathology", "questionCount": 5 }
          ]
        },
        {
          "id": "200",
          "name": "Nerves",
          "description": "Chapter 13 — Nerves & Sensory",
          "folder": "200-nerves",
          "banks": [
            { "id": "200.1", "file": "200.1-spinal.json", "title": "Spinal Cord & Roots", "questionCount": 5 },
            { "id": "200.2", "file": "200.2-receptors.json", "title": "Sensory Receptors", "questionCount": 6 },
            { "id": "200.3", "file": "200.3-plexuses.json", "title": "Nerve Plexuses", "questionCount": 5 },
            { "id": "200.4", "file": "200.4-reflexes.json", "title": "Reflexes & Pathways", "questionCount": 4 },
            { "id": "200.5", "file": "200.5-cranial-nerves.json", "title": "Cranial Nerves", "questionCount": 16 },
            { "id": "200.6", "file": "200.6-autonomic-nervous-system.json", "title": "Autonomic Nervous System", "questionCount": 16 }
          ]
        },
        {
          "id": "300",
          "name": "Foundations",
          "description": "Chapters 1-4 — Foundations & Chemistry",
          "folder": "300-foundations",
          "banks": [
            { "id": "300.1", "file": "300.1-organization.json", "title": "Body Organization & Homeostasis", "questionCount": 12 },
            { "id": "300.2", "file": "300.2-chemistry.json", "title": "Basic Chemistry", "questionCount": 10 },
            { "id": "300.3", "file": "300.3-cells.json", "title": "Cell Structure & Function", "questionCount": 8 },
            { "id": "300.4", "file": "300.4-membranes.json", "title": "Membranes & Cavities", "questionCount": 5 }
          ]
        },
        {
          "id": "400",
          "name": "Tissues",
          "description": "Tissues & Epithelia",
          "folder": "400-tissues",
          "banks": [
            { "id": "400.1", "file": "400.1-epithelial.json", "title": "Epithelial Tissues", "questionCount": 8 },
            { "id": "400.2", "file": "400.2-connective.json", "title": "Connective Tissues", "questionCount": 6 },
            { "id": "400.3", "file": "400.3-glands.json", "title": "Glands & Repair", "questionCount": 4 }
          ]
        }
      ]
    };
  }

  /**
   * Load a specific question bank
   */
  async loadQuestionBank(categoryId, bankId) {
    const cacheKey = `${categoryId}-${bankId}`;

    if (this.questionBanks[cacheKey]) {
      return this.questionBanks[cacheKey];
    }

    const category = this.registry.categories.find(c => c.id === categoryId);
    if (!category) throw new Error(`Category ${categoryId} not found`);

    const bank = category.banks.find(b => b.id === bankId);
    if (!bank) throw new Error(`Bank ${bankId} not found`);

    const path = `${category.folder}/${bank.file}`;

    // Try fetch first (works with http server)
    try {
      const response = await fetch(path);
      if (response.ok) {
        const data = await response.json();
        this.questionBanks[cacheKey] = data;
        return data;
      }
    } catch (e) {
      // Fall back to script loading for file:// protocol
    }

    // Load via dynamic script tag for file:// protocol
    const data = await this.loadJsonViaScript(path, bankId.replace('.', '_'));
    this.questionBanks[cacheKey] = data;
    return data;
  }

  /**
   * Load JSON via script tag (for file:// protocol)
   */
  loadJsonViaScript(path, varName) {
    return new Promise((resolve, reject) => {
      // Check if already loaded as a global
      const globalKey = `questionBank_${varName}`;
      if (window[globalKey]) {
        resolve(window[globalKey]);
        return;
      }

      // Create script to load the .js version of the file
      const jsPath = path.replace('.json', '.js');
      const script = document.createElement('script');
      script.src = jsPath;
      script.onload = () => {
        if (window[globalKey]) {
          resolve(window[globalKey]);
        } else {
          reject(new Error(`Failed to load ${jsPath}`));
        }
      };
      script.onerror = () => reject(new Error(`Failed to load ${jsPath}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Load all question banks for a category
   */
  async loadCategory(categoryId) {
    const category = this.registry.categories.find(c => c.id === categoryId);
    if (!category) throw new Error(`Category ${categoryId} not found`);

    const questions = [];

    for (const bank of category.banks) {
      const data = await this.loadQuestionBank(categoryId, bank.id);
      questions.push(...data.questions);
    }

    return questions;
  }

  /**
   * Set up category selection buttons with Dewey Decimal hierarchy
   */
  setupCategoryButtons() {
    const container = document.getElementById('quizSelect');
    if (!container) return;

    container.innerHTML = '';

    for (const category of this.registry.categories) {
      const totalQuestions = category.banks.reduce((sum, b) => sum + b.questionCount, 0);

      // Create Dewey group
      const group = document.createElement('div');
      group.className = 'dewey-group';

      // Header (clickable to expand/collapse or start all)
      const header = document.createElement('div');
      header.className = 'dewey-header';
      header.innerHTML = `
        <span class="dewey-code">${category.id}</span>
        <span class="dewey-title">${category.name}</span>
        <span class="dewey-count">${totalQuestions}q</span>
        <span class="dewey-expand">▼</span>
      `;
      header.addEventListener('click', () => {
        group.classList.toggle('expanded');
      });
      group.appendChild(header);

      // Banks container
      const banksContainer = document.createElement('div');
      banksContainer.className = 'dewey-banks';

      // "Study All" button for the category
      const studyAllBtn = document.createElement('div');
      studyAllBtn.className = 'dewey-bank';
      studyAllBtn.style.background = 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)';
      studyAllBtn.style.borderColor = 'var(--border-warm)';
      studyAllBtn.innerHTML = `
        <span class="dewey-bank-code">ALL</span>
        <span class="dewey-bank-title" style="color: var(--glow-warm);">Study All ${category.name}</span>
        <span class="dewey-bank-count">${totalQuestions} questions</span>
      `;
      studyAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startStudy(category.id);
      });
      banksContainer.appendChild(studyAllBtn);

      // Individual banks
      for (const bank of category.banks) {
        const bankBtn = document.createElement('div');
        bankBtn.className = 'dewey-bank';

        // Get mastery for this bank
        const mastery = persistence.getCategoryProgress(`${bank.id.replace('.', '-')}`);
        const masteryPct = mastery.mastery || 0;

        bankBtn.innerHTML = `
          <span class="dewey-bank-code">${bank.id}</span>
          <span class="dewey-bank-title">${bank.title}</span>
          <span class="dewey-bank-count">${bank.questionCount}q</span>
          <div class="dewey-bank-mastery">
            <div class="dewey-bank-mastery-fill" style="width: ${masteryPct}%"></div>
          </div>
        `;
        bankBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.startStudyBank(category.id, bank.id);
        });
        banksContainer.appendChild(bankBtn);
      }

      group.appendChild(banksContainer);
      container.appendChild(group);
    }
  }

  /**
   * Start study session for a specific bank
   */
  async startStudyBank(categoryId, bankId) {
    try {
      this.showLoading(true);

      const category = this.registry.categories.find(c => c.id === categoryId);
      const bank = category.banks.find(b => b.id === bankId);

      const data = await this.loadQuestionBank(categoryId, bank.id);
      const questions = data.questions;

      // Initialize state
      this.currentQuiz = questions.map(q => ({...q}));
      this.currentIdx = 0;
      this.exploredOptions = {};
      this.correctAnswerProcessed = {};
      this.firstExplorationPerPhase = {};

      // Reset warmup state
      this.currentPhase = 'warmup1';
      this.mainQuestion = this.currentQuiz[0];
      this.warmupAnswered = { warmup1: false, warmup2: false };

      // Start gamification session
      persistence.startSession();
      scaffolding.resetSessionCounters();
      this.previousLevel = persistence.getPlayer().level;

      // Switch views
      document.getElementById('landing').classList.add('hidden');
      document.getElementById('studyView').classList.add('active');

      // Render stats bar and first question
      this.renderer.renderStatsBar();
      this.startEncounter();
      this.renderQuestion();

    } catch (error) {
      console.error('Failed to start bank study session:', error);
      this.showError('Failed to load questions. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Start a study session for a category
   */
  async startStudy(categoryId) {
    try {
      this.showLoading(true);

      const questions = await this.loadCategory(categoryId);

      // Initialize state
      this.currentQuiz = questions.map(q => ({...q}));
      this.currentIdx = 0;
      this.exploredOptions = {};
      this.correctAnswerProcessed = {};
      this.firstExplorationPerPhase = {};

      // Reset warmup state
      this.currentPhase = 'warmup1';
      this.mainQuestion = this.currentQuiz[0];
      this.warmupAnswered = { warmup1: false, warmup2: false };

      // Start gamification session
      persistence.startSession();
      scaffolding.resetSessionCounters();
      this.previousLevel = persistence.getPlayer().level;

      // Switch views
      document.getElementById('landing').classList.add('hidden');
      document.getElementById('studyView').classList.add('active');

      // Render stats bar and first question
      this.renderer.renderStatsBar();
      this.startEncounter();
      this.renderQuestion();

    } catch (error) {
      console.error('Failed to start study session:', error);
      this.showError('Failed to load questions. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Get the current question based on phase
   */
  getCurrentQuestion() {
    const main = this.currentQuiz[this.currentIdx];

    if (this.currentPhase === 'warmup1' && main.prereqs && main.prereqs[0]) {
      return main.prereqs[0];
    } else if (this.currentPhase === 'warmup2' && main.prereqs && main.prereqs[1]) {
      return main.prereqs[1];
    }

    return main;
  }

  /**
   * Check if current main question has warmups
   */
  hasWarmups() {
    const main = this.currentQuiz[this.currentIdx];
    // Must have at least 2 prereqs with actual question content
    return main.prereqs &&
           main.prereqs.length >= 2 &&
           main.prereqs[0]?.q &&
           main.prereqs[1]?.q;
  }

  /**
   * Render the current question
   */
  renderQuestion() {
    if (!this.renderer) return;

    const currentQ = this.getCurrentQuestion();
    const main = this.currentQuiz[this.currentIdx];
    const hasWarmups = this.hasWarmups();

    // Calculate display index based on phase
    let displayIdx, totalDisplay;
    if (hasWarmups) {
      // Each main question becomes 3 questions (2 warmups + 1 main)
      const baseIdx = this.currentIdx * 3;
      if (this.currentPhase === 'warmup1') displayIdx = baseIdx;
      else if (this.currentPhase === 'warmup2') displayIdx = baseIdx + 1;
      else displayIdx = baseIdx + 2;
      totalDisplay = this.currentQuiz.length * 3;
    } else {
      displayIdx = this.currentIdx;
      totalDisplay = this.currentQuiz.length;
    }

    // Get explored options for current phase
    const phaseKey = `${this.currentIdx}-${this.currentPhase}`;
    const explored = this.exploredOptions[phaseKey] || [];

    this.renderer.render(
      currentQ,
      displayIdx,
      totalDisplay,
      explored,
      this.currentPhase,
      hasWarmups ? main.q : null  // Pass main question text for context
    );
  }

  /**
   * Explore an answer option
   */
  exploreOption(idx) {
    const phaseKey = `${this.currentIdx}-${this.currentPhase}`;
    const currentQ = this.getCurrentQuestion();
    const main = this.currentQuiz[this.currentIdx];
    const questionId = main.id || `q${this.currentIdx}`;

    // Track if this is the first exploration for this phase
    if (!this.firstExplorationPerPhase[phaseKey]) {
      this.firstExplorationPerPhase[phaseKey] = true;
    }

    if (!this.exploredOptions[phaseKey]) {
      this.exploredOptions[phaseKey] = [];
    }

    const isFirstExploration = this.exploredOptions[phaseKey].length === 0;
    const alreadyExplored = this.exploredOptions[phaseKey].includes(idx);

    if (!alreadyExplored) {
      this.exploredOptions[phaseKey].push(idx);
    }

    // Mark warmup as answered if correct answer was explored
    if (idx === currentQ.answer) {
      if (this.currentPhase === 'warmup1') this.warmupAnswered.warmup1 = true;
      if (this.currentPhase === 'warmup2') this.warmupAnswered.warmup2 = true;
    }

    // Gamification: Process correct/wrong answers (only for main phase, only once per question)
    if (this.currentPhase === 'main' && !this.correctAnswerProcessed[questionId]) {
      const isCorrect = idx === currentQ.answer;
      const exploredWrongFirst = this.exploredOptions[phaseKey].length > 1 ||
        (this.exploredOptions[phaseKey].length === 1 && !isCorrect);

      if (isCorrect) {
        // Process correct answer
        this.correctAnswerProcessed[questionId] = true;

        const completedWarmups = this.warmupAnswered.warmup1 && this.warmupAnswered.warmup2;
        const explorationCount = this.exploredOptions[phaseKey].length;

        const result = gamification.processCorrectAnswer(questionId, {
          completedWarmups,
          exploredWrongFirst
        });

        // Update scaffolding with answer
        const scaffoldAdvice = scaffolding.recordAnswer(questionId, !exploredWrongFirst, explorationCount);
        this.currentScaffoldAdvice = scaffoldAdvice;

        // Update D20 character stats
        const streakLength = persistence.getStreak();
        d20System.updateStats({
          wasCorrect: true,
          wasFirstTry: !exploredWrongFirst,
          explorationCount,
          streakLength
        });

        // Complete encounter
        if (this.currentEncounter) {
          const encounterResult = d20System.completeEncounter(this.currentEncounter, true);
          // Apply encounter XP multiplier (already factored into gamification)
        }

        // Roll for loot drops
        const lootDrops = lootSystem.rollLoot({
          wasCorrect: true,
          wasFirstTry: !exploredWrongFirst,
          streakLength,
          isCritical: false, // Could check d20 roll
          isRevengeSuccess: result.isRevenge,
          playerLevel: persistence.getPlayer().level
        });

        if (lootDrops.length > 0) {
          setTimeout(() => {
            this.renderer.showLootDrop(lootDrops);
          }, result.xp.isLuckyStrike ? 3500 : 2500);
        }

        // Update stats bar
        this.renderer.renderStatsBar();

        // Show XP popup
        const streakMessage = gamification.getStreakMessage(result.streak);
        this.renderer.showXPPopup(result.xp, streakMessage, result.isRevenge);

        // Show achievements
        for (const achievement of result.newAchievements) {
          this.renderer.showAchievement(achievement);
        }

        // Check for level up
        const newLevel = persistence.getPlayer().level;
        if (newLevel > this.previousLevel) {
          setTimeout(() => {
            this.renderer.showLevelUp(newLevel);
          }, 2500);
          this.previousLevel = newLevel;
        }

      } else if (isFirstExploration) {
        // First exploration was wrong - record for scaffolding
        const explorationCount = this.exploredOptions[phaseKey].length;
        const scaffoldAdvice = scaffolding.recordAnswer(questionId, false, explorationCount);
        this.currentScaffoldAdvice = scaffoldAdvice;
      }
    }

    // If wrong answer on first try for main phase, break streak AND trigger scaffolds
    if (this.currentPhase === 'main' && !this.correctAnswerProcessed[questionId]) {
      const isCorrect = idx === currentQ.answer;
      if (!isCorrect && isFirstExploration && !alreadyExplored) {
        const result = gamification.processWrongAnswer(questionId);
        if (result.streakBroken) {
          this.renderer.showStreakBroken(result.previousStreak);
          this.renderer.renderStatsBar();
        }

        // Trigger scaffold remediation
        this.triggerScaffoldRemediation(currentQ);
        return; // Don't render normal question - scaffold flow takes over
      }
    }

    this.renderQuestion();
  }

  /**
   * Trigger scaffold remediation after wrong answer
   */
  async triggerScaffoldRemediation(wrongQuestion) {
    if (!scaffoldRemediation) return;

    // Calculate damage
    const damageResult = scaffoldRemediation.calculateDamage();

    // Show damage roll animation
    this.renderer.showDamageRoll(damageResult, async () => {
      // Apply damage
      const hpResult = scaffoldRemediation.applyDamage(damageResult.finalDamage);

      // Check for knockout
      if (hpResult.isKnockout) {
        this.renderer.showKnockout();
      }

      // Update HP bar
      this.renderer.renderStatsBar();

      // Start scaffold session
      const session = await scaffoldRemediation.startSession(wrongQuestion, damageResult);

      if (session) {
        // Enter scaffold phase
        this.currentPhase = 'scaffold';
        this.scaffoldExploredOptions = [];
        this.renderScaffoldQuestion();
      } else {
        // Fallback if no scaffold questions available
        this.renderQuestion();
      }
    });
  }

  /**
   * Render current scaffold question
   */
  renderScaffoldQuestion() {
    const session = scaffoldRemediation.getSessionState();
    if (!session) return;

    const scaffoldKey = `scaffold-${session.currentIndex}`;
    if (!this.scaffoldExploredOptions) {
      this.scaffoldExploredOptions = [];
    }

    this.renderer.renderScaffoldQuestion(
      session.currentQuestion,
      session.currentIndex,
      this.scaffoldExploredOptions
    );
  }

  /**
   * Explore a scaffold question option
   */
  exploreScaffoldOption(idx) {
    const session = scaffoldRemediation.getSessionState();
    if (!session) return;

    const currentQ = session.currentQuestion;
    const alreadyExplored = this.scaffoldExploredOptions.includes(idx);

    if (!alreadyExplored) {
      this.scaffoldExploredOptions.push(idx);
    }

    // Check if correct answer found (first try)
    const isCorrect = idx === currentQ.answer;
    const isFirstTry = this.scaffoldExploredOptions.length === 1 && isCorrect;

    if (isCorrect && !alreadyExplored) {
      // Record result and heal
      const result = scaffoldRemediation.recordScaffoldResult(isFirstTry);

      if (result.healResult && result.healResult.healed > 0) {
        this.renderer.showScaffoldHeal(result.healResult);
        this.renderer.renderStatsBar();
      }
    }

    // Re-render scaffold to show feedback
    this.renderScaffoldQuestion();
  }

  /**
   * Move to next scaffold question
   */
  nextScaffold() {
    const result = scaffoldRemediation.nextScaffold();

    if (result.completed) {
      // All scaffolds done - show completion and return to main flow
      this.renderer.showScaffoldComplete(result);
      this.currentPhase = 'main';
      this.scaffoldExploredOptions = [];

      // Move to next question
      setTimeout(() => {
        this.nextQuestion();
      }, 2000);
    } else {
      // More scaffolds to go
      this.scaffoldExploredOptions = [];
      this.renderScaffoldQuestion();
    }
  }

  /**
   * Navigate to the next question/phase
   */
  nextQuestion() {
    const hasWarmups = this.hasWarmups();

    if (hasWarmups) {
      // Progress through phases: warmup1 -> warmup2 -> main -> next question
      if (this.currentPhase === 'warmup1') {
        this.currentPhase = 'warmup2';
        this.renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else if (this.currentPhase === 'warmup2') {
        this.currentPhase = 'main';
        this.renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Move to next main question
    if (this.currentIdx < this.currentQuiz.length - 1) {
      this.currentIdx++;
      this.currentPhase = this.hasWarmups() ? 'warmup1' : 'main';
      this.warmupAnswered = { warmup1: false, warmup2: false };
      this.startEncounter(); // Start new encounter for next question
      this.renderQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.finishSession();
    }
  }

  /**
   * Finish the study session and show summary
   */
  finishSession() {
    const summary = persistence.endSession();
    this.renderer.showSessionSummary(summary, this.achievements);
  }

  /**
   * Start a new encounter for current question
   */
  startEncounter() {
    const main = this.currentQuiz[this.currentIdx];
    const topicPrefix = main.id ? main.id.split('.').slice(0, 2).join('.') : 'unknown';

    this.currentEncounter = d20System.createEncounter(main, topicPrefix);

    // Show encounter banner
    this.renderer.showEncounterBanner(this.currentEncounter);
  }

  /**
   * Roll for insight (skill check for hint)
   */
  rollForInsight() {
    const currentQ = this.getCurrentQuestion();

    this.renderer.showSkillCheckPrompt('Roll for Insight', 1, () => {
      const result = d20System.insightCheck('medium');

      // Show the dice roll
      this.renderer.showDiceRoll(result.roll, 'Wisdom Check');

      // After dice animation, show result
      setTimeout(() => {
        const hint = this.getHintByQuality(currentQ, result.hintQuality);
        this.renderer.showInsightCheckResult(result, hint);
        this.renderer.renderStatsBar();
      }, 1500);
    });
  }

  /**
   * Get hint based on quality from insight check
   */
  getHintByQuality(question, quality) {
    switch (quality) {
      case 'perfect':
        // Reveal the mechanism if available
        if (question.mechanism) {
          return `The key lies in ${question.mechanism.title}. ${question.mechanism.content.slice(0, 150)}...`;
        }
        return `Look carefully at ${question.options[question.answer]}. This is the path.`;

      case 'excellent':
        // Strong directional hint
        const wrongOptions = question.options.filter((_, i) => i !== question.answer);
        return `I can tell you that "${wrongOptions[0]}" is definitely not the answer. Focus elsewhere.`;

      case 'good':
        // Basic helpful hint
        if (question.optionExplains) {
          const correctExplain = question.optionExplains[question.answer];
          if (correctExplain) {
            return `Think about this: ${correctExplain.text.slice(0, 100)}...`;
          }
        }
        return 'Consider the underlying mechanism. What must physically happen?';

      case 'vague':
        return 'The answer is there... somewhere. Trust your instincts.';

      case 'misleading':
      default:
        return 'The spirits are unclear. Perhaps another approach?';
    }
  }

  /**
   * Attempt to save streak with charisma save
   */
  attemptStreakSave(currentStreak, onResult) {
    this.renderer.showStreakSavePrompt(currentStreak, (attemptSave) => {
      if (!attemptSave) {
        onResult(false);
        return;
      }

      const result = d20System.streakSavingThrow(currentStreak);

      if (!result.canAttempt) {
        onResult(false);
        return;
      }

      // Show the dice roll
      this.renderer.showDiceRoll(result.roll, 'Charisma Save');

      setTimeout(() => {
        this.renderer.renderStatsBar();
        onResult(result.success);
      }, 2000);
    });
  }

  /**
   * Navigate to the previous question/phase
   */
  prevQuestion() {
    const hasWarmups = this.hasWarmups();

    if (hasWarmups) {
      // Go back through phases: main -> warmup2 -> warmup1 -> previous question
      if (this.currentPhase === 'main') {
        this.currentPhase = 'warmup2';
        this.renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      } else if (this.currentPhase === 'warmup2') {
        this.currentPhase = 'warmup1';
        this.renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Move to previous main question
    if (this.currentIdx > 0) {
      this.currentIdx--;
      // Go to the main phase of previous question
      this.currentPhase = 'main';
      this.renderQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Skip warmups and go directly to main question
   */
  skipToMain() {
    this.currentPhase = 'main';
    this.renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Return to the home screen
   */
  goHome() {
    document.getElementById('studyView').classList.remove('active');
    document.getElementById('landing').classList.remove('hidden');
    this.exploredOptions = {};
    this.currentPhase = 'main';
    this.renderer.renderLandingStats();
  }

  /**
   * Show/hide loading state
   */
  showLoading(show) {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.toggle('hidden', !show);
    }
  }

  /**
   * Show an error message
   */
  showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
      setTimeout(() => errorDiv.classList.add('hidden'), 5000);
    } else {
      alert(message);
    }
  }
}

// Global instance
let quiz;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  quiz = new LuminaraQuiz();
  quiz.init();
});

// Global navigation functions for button onclick handlers
function exploreOption(idx) { quiz.exploreOption(idx); }
function exploreScaffoldOption(idx) { quiz.exploreScaffoldOption(idx); }
function nextScaffold() { quiz.nextScaffold(); }
function nextQuestion() { quiz.nextQuestion(); }
function prevQuestion() { quiz.prevQuestion(); }
function skipToMain() { quiz.skipToMain(); }
function goHome() { quiz.goHome(); }

// Session summary handlers
function closeSummaryAndGoHome() {
  document.querySelector('.session-summary')?.remove();
  quiz.goHome();
}

function closeSummaryAndContinue() {
  document.querySelector('.session-summary')?.remove();
  // Reset state for a new session but keep the same category
  if (quiz.currentQuiz.length > 0) {
    quiz.currentIdx = 0;
    quiz.currentPhase = quiz.hasWarmups() ? 'warmup1' : 'main';
    quiz.exploredOptions = {};
    quiz.correctAnswerProcessed = {};
    quiz.firstExplorationPerPhase = {};
    quiz.warmupAnswered = { warmup1: false, warmup2: false };
    persistence.startSession();
    scaffolding.resetSessionCounters();
    quiz.previousLevel = persistence.getPlayer().level;
    quiz.startEncounter();
    quiz.renderQuestion();
    quiz.renderer.renderStatsBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    quiz.goHome();
  }
}

// Extend LuminaraQuiz with equipment methods
LuminaraQuiz.prototype.equipItem = function(itemId) {
  const item = lootSystem.getInventory().find(i => i.id === itemId);
  if (item) {
    lootSystem.equipItem(item);
  }
};

LuminaraQuiz.prototype.unequipItem = function(slot) {
  lootSystem.unequipItem(slot);
};

LuminaraQuiz.prototype.sellItem = function(itemId) {
  const item = lootSystem.getInventory().find(i => i.id === itemId);
  if (item) {
    // Use loot system's method if available, otherwise calculate locally
    const price = typeof lootSystem.getItemSellPrice === 'function'
      ? lootSystem.getItemSellPrice(item)
      : lootSystem.calculateSellPrice(item);
    lootSystem.data.gold += price;
    lootSystem.removeFromInventory(itemId);
    lootSystem.save();
  }
};
