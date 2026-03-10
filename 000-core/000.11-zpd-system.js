/**
 * 000.11-zpd-system.js
 * TOCK 2: ZPD Detection & Collaborative Learning System
 *
 * Zone of Proximal Development (Vygotsky)
 * - What learner can do alone vs. with guidance
 * - 7 ZPD moment types from LUMI-OS architecture
 *
 * 5E Inquiry Model Integration:
 * - Engage: Activate prior knowledge, spark curiosity
 * - Explore: Hands-on investigation, discover patterns
 * - Explain: Articulate understanding, mentor guidance
 * - Elaborate: Apply to new contexts, extend learning
 * - Evaluate: Assess understanding, identify gaps
 */

const ZPDSystem = {
  // ZPD moment types with operator mappings
  momentTypes: {
    gauge_shift: {
      description: 'Adjusting scope of understanding',
      operators: ['F', 'T'],
      mentor_action: 'Come closer — let me zoom in/out on this concept',
      zpd_boost: 1.2
    },
    correction: {
      description: 'Fixing misconceptions',
      operators: ['T', 'R'],
      mentor_action: 'Wait — that\'s not quite right. Let me redirect you',
      zpd_boost: 1.5
    },
    elaboration: {
      description: 'Adding depth and detail',
      operators: ['A', 'I'],
      mentor_action: 'Stay with me — there\'s more to this story',
      zpd_boost: 1.3
    },
    counter_example: {
      description: 'Showing exceptions to rules',
      operators: ['D', 'R'],
      mentor_action: 'Here\'s where it gets delicious — the exception',
      zpd_boost: 1.4
    },
    terminology: {
      description: 'Precise language introduction',
      operators: ['F', 'G'],
      mentor_action: 'Let me give you the precise term for this',
      zpd_boost: 1.1
    },
    pattern_guidance: {
      description: 'Revealing underlying patterns',
      operators: ['G', 'A'],
      mentor_action: 'Watch — do you see the pattern emerging?',
      zpd_boost: 1.6
    },
    conceptual_bridge: {
      description: 'Connecting to prior knowledge',
      operators: ['A', 'T'],
      mentor_action: 'Remember when we learned X? This is the same principle',
      zpd_boost: 1.7
    }
  },

  // 5E Inquiry phases
  inquiryPhases: {
    engage: {
      question_types: ['spark', 'relevance', 'prior_knowledge'],
      mentor_style: 'curiosity_hook',
      zpd_zone: 'known'
    },
    explore: {
      question_types: ['observation', 'comparison', 'pattern'],
      mentor_style: 'guided_discovery',
      zpd_zone: 'proximal'
    },
    explain: {
      question_types: ['mechanism', 'definition', 'process'],
      mentor_style: 'direct_instruction',
      zpd_zone: 'proximal'
    },
    elaborate: {
      question_types: ['application', 'transfer', 'clinical'],
      mentor_style: 'challenge_extension',
      zpd_zone: 'beyond'
    },
    evaluate: {
      question_types: ['synthesis', 'judgment', 'self_assess'],
      mentor_style: 'metacognitive',
      zpd_zone: 'varies'
    }
  },

  // Student mastery tracking
  studentProfile: {
    masteredConcepts: new Set(),
    struggleConcepts: new Map(), // concept -> wrong count
    currentZPD: 'proximal',
    learningVelocity: 1.0,
    preferredMentorStyle: 'luminara'
  },

  // Initialize with questions and optional saved state
  init(questions, savedState = null) {
    this.questions = questions;
    if (savedState) {
      this.loadState(savedState);
    }
    console.log('[ZPD] System initialized');
  },

  // Analyze current ZPD for a topic/isotope cluster
  analyzeZPD(isotopes, answeredQuestions) {
    const analysis = {
      zone: 'unknown',
      mastered: [],
      proximal: [],
      beyond: [],
      recommendedNext: null
    };

    // Categorize questions by isotope overlap
    for (const q of this.questions) {
      const qIsotopes = q.isotopes || [];
      const overlap = isotopes.filter(iso => qIsotopes.includes(iso));

      if (overlap.length === 0) continue;

      const answered = answeredQuestions.get(q.id);

      if (answered?.correct) {
        analysis.mastered.push(q.id);
      } else if (answered && !answered.correct) {
        // Wrong answer - this is in proximal zone (needs help)
        analysis.proximal.push(q.id);
      } else {
        // Not attempted
        const prereqsMastered = this.checkPrerequisites(q, answeredQuestions);
        if (prereqsMastered) {
          analysis.proximal.push(q.id); // Ready to attempt with guidance
        } else {
          analysis.beyond.push(q.id); // Needs prereqs first
        }
      }
    }

    // Determine overall zone
    const total = analysis.mastered.length + analysis.proximal.length + analysis.beyond.length;
    if (total === 0) {
      analysis.zone = 'new_territory';
    } else {
      const masteredRatio = analysis.mastered.length / total;
      if (masteredRatio > 0.7) {
        analysis.zone = 'mastered';
      } else if (analysis.proximal.length > 0) {
        analysis.zone = 'proximal';
      } else {
        analysis.zone = 'beyond';
      }
    }

    // Recommend next question
    if (analysis.proximal.length > 0) {
      analysis.recommendedNext = analysis.proximal[0];
    } else if (analysis.beyond.length > 0) {
      // Find the "closest" beyond question (fewest unmastered prereqs)
      analysis.recommendedNext = this.findClosestBeyond(analysis.beyond, answeredQuestions);
    }

    return analysis;
  },

  // Check if prerequisites are mastered
  checkPrerequisites(q, answeredQuestions) {
    const prereqIds = q._inferredPrereqs || [];
    if (prereqIds.length === 0) return true;

    let masteredCount = 0;
    for (const prereqId of prereqIds) {
      const answered = answeredQuestions.get(prereqId);
      if (answered?.correct) masteredCount++;
    }

    return masteredCount >= prereqIds.length * 0.6; // 60% prereqs mastered
  },

  // Find the closest "beyond" question
  findClosestBeyond(beyondIds, answeredQuestions) {
    let closest = null;
    let minUnmastered = Infinity;

    for (const qid of beyondIds) {
      const q = this.questions.find(x => x.id === qid);
      if (!q) continue;

      const prereqIds = q._inferredPrereqs || [];
      let unmasteredCount = 0;
      for (const prereqId of prereqIds) {
        const answered = answeredQuestions.get(prereqId);
        if (!answered?.correct) unmasteredCount++;
      }

      if (unmasteredCount < minUnmastered) {
        minUnmastered = unmasteredCount;
        closest = qid;
      }
    }

    return closest;
  },

  // Detect ZPD moment type from interaction
  detectMomentType(q, response, previousAttempts) {
    if (!response.correct && previousAttempts === 0) {
      // First wrong answer - likely correction needed
      return 'correction';
    }

    if (!response.correct && previousAttempts > 0) {
      // Multiple wrong answers - needs pattern guidance
      return 'pattern_guidance';
    }

    if (response.correct && previousAttempts > 0) {
      // Got it after retries - elaboration helped
      return 'elaboration';
    }

    if (response.correct && response.timeToAnswer < 5000) {
      // Quick correct - already mastered, might be terminology
      return 'terminology';
    }

    if (q.prereqs && q.prereqs.length > 0) {
      // Has prerequisites - conceptual bridge moment
      return 'conceptual_bridge';
    }

    // Default to gauge shift
    return 'gauge_shift';
  },

  // Generate ZPD-aware feedback
  generateFeedback(q, response, momentType) {
    const moment = this.momentTypes[momentType];
    const mentorAction = moment?.mentor_action || 'Let me help you understand this';

    const feedback = {
      type: momentType,
      mentorAction,
      operators: moment?.operators || ['F'],
      zpdBoost: moment?.zpd_boost || 1.0,
      suggestions: []
    };

    // Add specific suggestions based on moment type
    switch (momentType) {
      case 'correction':
        feedback.suggestions.push('Review the correct option explanation carefully');
        feedback.suggestions.push('Compare your choice with the correct answer');
        break;

      case 'pattern_guidance':
        feedback.suggestions.push('Look for the underlying principle');
        if (q.mechanism?.metaphor) {
          feedback.suggestions.push('Consider the metaphor: ' + q.mechanism.metaphor.substring(0, 100));
        }
        break;

      case 'conceptual_bridge':
        if (q.prereqs && q.prereqs.length > 0 && q.prereqs[0]?.q) {
          feedback.suggestions.push('This builds on: ' + q.prereqs[0].q.substring(0, 50) + '...');
        }
        break;

      case 'elaboration':
        feedback.suggestions.push('You\'re ready to go deeper');
        if (q.mechanism?.content) {
          feedback.suggestions.push('Explore the mechanism for full understanding');
        }
        break;
    }

    return feedback;
  },

  // Map question to 5E inquiry phase
  mapToInquiryPhase(q) {
    const text = `${q.q} ${q.explain || ''}`.toLowerCase();

    // Detection heuristics
    if (text.includes('why') || text.includes('how does')) {
      return 'explain';
    }

    if (text.includes('apply') || text.includes('clinical') || text.includes('patient')) {
      return 'elaborate';
    }

    if (text.includes('compare') || text.includes('contrast') || text.includes('difference')) {
      return 'explore';
    }

    if (text.includes('what is') || text.includes('define') || text.includes('name')) {
      return 'engage';
    }

    if (text.includes('evaluate') || text.includes('assess') || text.includes('best')) {
      return 'evaluate';
    }

    // Default based on question type
    if (q.type === 'true-false') return 'engage';
    if (q.prereqs && q.prereqs.length > 0) return 'elaborate';

    return 'explain';
  },

  // Generate scaffolding for struggling students
  generateScaffolding(q, wrongCount) {
    const scaffolds = [];

    if (wrongCount >= 1) {
      // Level 1: Hint
      scaffolds.push({
        level: 1,
        type: 'hint',
        content: this.generateHint(q)
      });
    }

    if (wrongCount >= 2) {
      // Level 2: Prerequisite reminder
      if (q.prereqs && q.prereqs.length > 0 && q.prereqs[0]?.q) {
        scaffolds.push({
          level: 2,
          type: 'prerequisite',
          content: `Remember the warmup: ${q.prereqs[0].q.substring(0, 80)}...`
        });
      }
    }

    if (wrongCount >= 3) {
      // Level 3: Process elimination
      scaffolds.push({
        level: 3,
        type: 'elimination',
        content: `One of these options is clearly different from the others. Which one doesn't fit?`
      });
    }

    return scaffolds;
  },

  // Generate a hint without giving away the answer
  generateHint(q) {
    // Use the mechanism metaphor if available
    if (q.mechanism?.metaphor) {
      const metaphor = q.mechanism.metaphor;
      // Take first sentence as hint
      const firstSentence = metaphor.split(/[.!?]/)[0];
      return `Think of it like: ${firstSentence}`;
    }

    // Use isotopes to generate hint
    if (q.isotopes && q.isotopes.length > 0) {
      const keyIsotope = q.isotopes[0];
      const concept = keyIsotope.split('.').pop().replace(/-/g, ' ');
      return `Focus on the concept of "${concept}"`;
    }

    // Generic hint based on question structure
    return 'Read each option carefully and eliminate the ones that don\'t fit';
  },

  // Track learning progression
  recordInteraction(qid, response) {
    const q = this.questions.find(x => x.id === qid);
    if (!q) return;

    const isotopes = q.isotopes || [];

    if (response.correct) {
      // Add to mastered concepts
      for (const iso of isotopes) {
        this.studentProfile.masteredConcepts.add(iso);
        // Remove from struggle if present
        if (this.studentProfile.struggleConcepts.has(iso)) {
          this.studentProfile.struggleConcepts.delete(iso);
        }
      }
      // Increase learning velocity
      this.studentProfile.learningVelocity = Math.min(2.0, this.studentProfile.learningVelocity * 1.1);
    } else {
      // Track struggle
      for (const iso of isotopes) {
        const count = this.studentProfile.struggleConcepts.get(iso) || 0;
        this.studentProfile.struggleConcepts.set(iso, count + 1);
      }
      // Decrease learning velocity
      this.studentProfile.learningVelocity = Math.max(0.5, this.studentProfile.learningVelocity * 0.9);
    }

    // Update current ZPD
    this.updateCurrentZPD();
  },

  // Update current ZPD based on performance
  updateCurrentZPD() {
    const masteredCount = this.studentProfile.masteredConcepts.size;
    const struggleCount = this.studentProfile.struggleConcepts.size;

    if (struggleCount > masteredCount) {
      this.studentProfile.currentZPD = 'foundational';
    } else if (this.studentProfile.learningVelocity > 1.5) {
      this.studentProfile.currentZPD = 'ready_for_challenge';
    } else {
      this.studentProfile.currentZPD = 'proximal';
    }
  },

  // Get personalized learning path
  getLearningPath(targetIsotopes, maxQuestions = 10) {
    const path = [];
    const toVisit = [...targetIsotopes];
    const visited = new Set();

    while (path.length < maxQuestions && toVisit.length > 0) {
      const iso = toVisit.shift();
      if (visited.has(iso)) continue;
      visited.add(iso);

      // Find questions with this isotope
      const questions = this.questions.filter(q =>
        (q.isotopes || []).includes(iso) &&
        !this.studentProfile.masteredConcepts.has(iso)
      );

      // Sort by difficulty (simpler first) - questions without isotopes go last
      questions.sort((a, b) => {
        const aLen = a.isotopes?.length || Infinity;
        const bLen = b.isotopes?.length || Infinity;
        return aLen - bLen;
      });

      for (const q of questions.slice(0, 2)) {
        path.push({
          question: q,
          targetIsotope: iso,
          inquiryPhase: this.mapToInquiryPhase(q),
          estimatedDifficulty: this.estimateDifficulty(q)
        });

        // Add related isotopes to explore
        for (const relatedIso of (q.isotopes || [])) {
          if (!visited.has(relatedIso)) {
            toVisit.push(relatedIso);
          }
        }
      }
    }

    return path;
  },

  // Estimate question difficulty
  estimateDifficulty(q) {
    let score = 1;

    // More isotopes = more complex
    score += (q.isotopes?.length || 0) * 0.2;

    // Has prerequisites = harder
    if (q.prereqs && q.prereqs.length > 0) score += 0.5;

    // Has mechanism = deeper understanding needed
    if (q.mechanism?.content) score += 0.3;

    // Check if struggling with related concepts
    for (const iso of (q.isotopes || [])) {
      if (this.studentProfile.struggleConcepts.has(iso)) {
        score += 0.3;
      }
    }

    return Math.min(5, Math.round(score * 10) / 10);
  },

  // Save state for persistence
  saveState() {
    return {
      masteredConcepts: Array.from(this.studentProfile.masteredConcepts),
      struggleConcepts: Array.from(this.studentProfile.struggleConcepts.entries()),
      currentZPD: this.studentProfile.currentZPD,
      learningVelocity: this.studentProfile.learningVelocity,
      preferredMentorStyle: this.studentProfile.preferredMentorStyle
    };
  },

  // Load state from persistence
  loadState(state) {
    if (state.masteredConcepts) {
      this.studentProfile.masteredConcepts = new Set(state.masteredConcepts);
    }
    if (state.struggleConcepts) {
      this.studentProfile.struggleConcepts = new Map(state.struggleConcepts);
    }
    if (state.currentZPD) {
      this.studentProfile.currentZPD = state.currentZPD;
    }
    if (state.learningVelocity) {
      this.studentProfile.learningVelocity = state.learningVelocity;
    }
    if (state.preferredMentorStyle) {
      this.studentProfile.preferredMentorStyle = state.preferredMentorStyle;
    }
  },

  // Export for LUMI-OS
  exportZPDAnalysis(qid) {
    const q = this.questions.find(x => x.id === qid);
    if (!q) return null;

    return {
      question_id: qid,
      inquiry_phase: this.mapToInquiryPhase(q),
      estimated_difficulty: this.estimateDifficulty(q),
      zpd_moments: Object.keys(this.momentTypes),
      student_zpd: this.studentProfile.currentZPD,
      learning_velocity: this.studentProfile.learningVelocity,
      scaffolding_available: this.generateScaffolding(q, 0).length
    };
  }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZPDSystem;
}
