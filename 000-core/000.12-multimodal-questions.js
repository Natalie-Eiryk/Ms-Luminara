/**
 * 000.12-multimodal-questions.js
 * TICK 3: Multi-Modal Question Formats
 *
 * Question format variety for deeper engagement:
 * - Multiple Choice (standard)
 * - Type-In / Fill-in-the-blank
 * - Sequence Ordering
 * - Match/Drag
 * - True/False with Correction
 * - Clinical Vignette chains
 *
 * Format rotation based on:
 * - Question characteristics
 * - Student performance history
 * - Learning phase (5E model)
 */

const MultiModalQuestions = {
  // Available question formats
  formats: {
    'multiple-choice': {
      name: 'Multiple Choice',
      icon: '📝',
      description: 'Select the correct answer',
      difficulty_modifier: 1.0,
      best_for: ['engage', 'explain'],
      input_type: 'click'
    },
    'type-in': {
      name: 'Type Answer',
      icon: '⌨️',
      description: 'Type the correct term',
      difficulty_modifier: 1.3,
      best_for: ['evaluate', 'elaborate'],
      input_type: 'text'
    },
    'fill-blank': {
      name: 'Fill in the Blank',
      icon: '📝✏️',
      description: 'Complete the statement',
      difficulty_modifier: 1.2,
      best_for: ['explain', 'evaluate'],
      input_type: 'text'
    },
    'sequence': {
      name: 'Order Steps',
      icon: '🔢',
      description: 'Arrange in correct order',
      difficulty_modifier: 1.4,
      best_for: ['explore', 'explain'],
      input_type: 'drag'
    },
    'match': {
      name: 'Match Pairs',
      icon: '🔗',
      description: 'Connect related items',
      difficulty_modifier: 1.3,
      best_for: ['explore', 'engage'],
      input_type: 'drag'
    },
    'true-false-correct': {
      name: 'True/False + Correction',
      icon: '✅❌',
      description: 'Judge and correct if false',
      difficulty_modifier: 1.5,
      best_for: ['evaluate', 'elaborate'],
      input_type: 'click+text'
    },
    'clinical-vignette': {
      name: 'Clinical Case',
      icon: '🏥',
      description: 'Patient scenario analysis',
      difficulty_modifier: 1.6,
      best_for: ['elaborate', 'evaluate'],
      input_type: 'multi-step'
    }
  },

  // Question conversion templates
  templates: {},

  // Initialize
  init(questions) {
    this.questions = questions;
    this.buildTemplates();
    console.log('[MultiModal] System initialized');
  },

  // Build conversion templates
  buildTemplates() {
    this.templates = {
      'type-in': (q) => this.convertToTypeIn(q),
      'fill-blank': (q) => this.convertToFillBlank(q),
      'sequence': (q) => this.convertToSequence(q),
      'match': (q) => this.convertToMatch(q),
      'true-false-correct': (q) => this.convertToTFCorrect(q)
    };
  },

  // Select optimal format for a question
  selectFormat(q, studentProfile = null, usedFormats = []) {
    const candidates = this.getFormatCandidates(q);

    // Filter out recently used formats
    let available = candidates.filter(f => !usedFormats.includes(f));
    if (available.length === 0) available = candidates;

    // Weight by student needs
    if (studentProfile) {
      const velocity = studentProfile.learningVelocity || 1.0;

      if (velocity < 0.8) {
        // Struggling - prefer easier formats
        available.sort((a, b) =>
          this.formats[a].difficulty_modifier - this.formats[b].difficulty_modifier
        );
      } else if (velocity > 1.3) {
        // Excelling - prefer challenging formats
        available.sort((a, b) =>
          this.formats[b].difficulty_modifier - this.formats[a].difficulty_modifier
        );
      }
    }

    return available[0] || 'multiple-choice';
  },

  // Get candidate formats for a question
  getFormatCandidates(q) {
    const candidates = ['multiple-choice']; // Always available
    const text = `${q.q} ${q.explain || ''}`.toLowerCase();

    // Check if convertible to type-in
    if (this.canConvertToTypeIn(q)) {
      candidates.push('type-in');
    }

    // Check if has sequence potential
    if (text.includes('first') || text.includes('then') || text.includes('step') ||
        text.includes('sequence') || text.includes('pathway') || text.includes('→')) {
      candidates.push('sequence');
    }

    // Check if has match potential (multiple related concepts)
    if (q.options.length >= 4 && q.optionExplains) {
      candidates.push('match');
    }

    // Fill-blank works for most questions
    if (q.q.length > 20) {
      candidates.push('fill-blank');
    }

    // True/False correction for T/F questions
    if (q.options.length === 2 &&
        (q.options.includes('True') || q.options.includes('False'))) {
      candidates.push('true-false-correct');
    }

    // Clinical vignette for clinical content
    if (text.includes('patient') || text.includes('clinical') ||
        text.includes('symptom') || text.includes('treatment')) {
      candidates.push('clinical-vignette');
    }

    return candidates;
  },

  // Check if question can be converted to type-in
  canConvertToTypeIn(q) {
    // Answer should be a single term or short phrase
    const correctAnswer = q.options[q.answer];
    return correctAnswer.split(' ').length <= 4 &&
           correctAnswer.length <= 30;
  },

  // Convert to type-in format
  convertToTypeIn(q) {
    const correctAnswer = q.options[q.answer];

    // Create fill-in prompt
    let prompt = q.q;

    // Replace answer term in question if present
    const answerPattern = new RegExp(correctAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (answerPattern.test(prompt)) {
      prompt = prompt.replace(answerPattern, '_____');
    } else {
      // Append blank
      prompt = prompt.replace(/[.?]$/, '') + ': _____';
    }

    return {
      ...q,
      format: 'type-in',
      originalFormat: 'multiple-choice',
      prompt,
      correctAnswer,
      acceptableAnswers: this.generateAcceptableAnswers(correctAnswer),
      hints: this.generateTypeInHints(q)
    };
  },

  // Generate acceptable answer variations
  generateAcceptableAnswers(answer) {
    const variations = [answer.toLowerCase()];

    // Add common variations
    variations.push(answer.toLowerCase().replace(/-/g, ' '));
    variations.push(answer.toLowerCase().replace(/\s+/g, ''));

    // Handle plural/singular
    if (answer.endsWith('s')) {
      variations.push(answer.slice(0, -1).toLowerCase());
    } else {
      variations.push((answer + 's').toLowerCase());
    }

    return [...new Set(variations)];
  },

  // Generate hints for type-in
  generateTypeInHints(q) {
    const answer = q.options[q.answer];
    const hints = [];

    // First letter hint
    hints.push(`Starts with "${answer[0].toUpperCase()}"`);

    // Letter count hint
    hints.push(`${answer.length} letters`);

    // Category hint from isotopes
    if (q.isotopes && q.isotopes.length > 0) {
      const domain = q.isotopes[0].split('.')[0];
      hints.push(`Related to ${domain}`);
    }

    return hints;
  },

  // Convert to fill-in-the-blank format
  convertToFillBlank(q) {
    const correctAnswer = q.options[q.answer];
    let statement = q.explain || q.mechanism?.content || '';

    // Find where to put the blank
    const answerPattern = new RegExp(
      '\\b' + correctAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b',
      'gi'
    );

    if (answerPattern.test(statement)) {
      statement = statement.replace(answerPattern, '_____');
    } else {
      // Use question itself
      statement = q.q.replace(/___+/g, '_____');
      if (!statement.includes('_____')) {
        statement = q.q.replace(/[.?]$/, '') + ': _____';
      }
    }

    // Truncate if too long
    if (statement.length > 200) {
      const blankPos = statement.indexOf('_____');
      const start = Math.max(0, blankPos - 80);
      const end = Math.min(statement.length, blankPos + 80);
      statement = (start > 0 ? '...' : '') +
                  statement.substring(start, end) +
                  (end < statement.length ? '...' : '');
    }

    return {
      ...q,
      format: 'fill-blank',
      originalFormat: 'multiple-choice',
      statement,
      correctAnswer,
      acceptableAnswers: this.generateAcceptableAnswers(correctAnswer),
      options: undefined // Remove options for this format
    };
  },

  // Convert to sequence ordering format
  convertToSequence(q) {
    // Extract sequence from mechanism content or explanation
    const text = q.mechanism?.content || q.explain || '';

    // Look for numbered steps or sequence indicators
    const stepPatterns = [
      /(\d+)\)\s*([^.;]+)/g,
      /Step\s*(\d+)[:\s]+([^.;]+)/gi,
      /First[,:]?\s*([^.]+)[.;]\s*Then[,:]?\s*([^.]+)[.;]\s*Finally[,:]?\s*([^.]+)/gi
    ];

    let steps = [];

    for (const pattern of stepPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        steps.push(match[2] || match[1]);
      }
      if (steps.length >= 3) break;
    }

    // If no explicit steps found, use options as steps
    if (steps.length < 3) {
      steps = q.options.map((opt, i) => ({
        text: opt,
        correctPosition: i === q.answer ? 0 : i + 1
      }));
    }

    // Shuffle steps
    const shuffledSteps = [...steps].sort(() => Math.random() - 0.5);

    return {
      ...q,
      format: 'sequence',
      originalFormat: 'multiple-choice',
      steps: shuffledSteps,
      correctOrder: steps,
      instructions: 'Arrange these in the correct order'
    };
  },

  // Convert to match format
  convertToMatch(q) {
    // Create pairs from options and their explanations
    const pairs = q.options.map((opt, i) => ({
      term: opt,
      definition: q.optionExplains?.[i]?.text?.substring(0, 80) ||
                  (i === q.answer ? 'Correct answer' : 'Distractor'),
      isCorrect: i === q.answer
    }));

    // Shuffle definitions
    const shuffledDefs = [...pairs.map(p => p.definition)].sort(() => Math.random() - 0.5);

    return {
      ...q,
      format: 'match',
      originalFormat: 'multiple-choice',
      terms: pairs.map(p => p.term),
      definitions: shuffledDefs,
      correctPairs: pairs.map(p => ({ term: p.term, definition: p.definition })),
      instructions: 'Match each term with its definition'
    };
  },

  // Convert to True/False with correction format
  convertToTFCorrect(q) {
    const isTrue = q.answer === 0; // Assuming True is first option

    return {
      ...q,
      format: 'true-false-correct',
      originalFormat: 'multiple-choice',
      statement: q.q,
      isTrue,
      correctionRequired: !isTrue,
      correctedStatement: isTrue ? null : this.generateCorrectedStatement(q),
      instructions: isTrue ?
        'This statement is TRUE. Explain why.' :
        'This statement is FALSE. Correct it.'
    };
  },

  // Generate corrected statement for false T/F questions
  generateCorrectedStatement(q) {
    // Try to extract from explanation
    const explain = q.optionExplains?.[q.answer]?.text || q.explain || '';

    // Find the key correction
    const correctionPatterns = [
      /actually[,:]?\s*([^.]+)/i,
      /correct\s+answer\s+is[,:]?\s*([^.]+)/i,
      /should\s+be[,:]?\s*([^.]+)/i
    ];

    for (const pattern of correctionPatterns) {
      const match = explain.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return explain.substring(0, 100);
  },

  // Render question in specified format
  render(q, format) {
    const formatInfo = this.formats[format];
    if (!formatInfo) {
      console.warn(`Unknown format: ${format}`);
      return this.renderMultipleChoice(q);
    }

    switch (format) {
      case 'multiple-choice':
        return this.renderMultipleChoice(q);
      case 'type-in':
        return this.renderTypeIn(this.convertToTypeIn(q));
      case 'fill-blank':
        return this.renderFillBlank(this.convertToFillBlank(q));
      case 'sequence':
        return this.renderSequence(this.convertToSequence(q));
      case 'match':
        return this.renderMatch(this.convertToMatch(q));
      case 'true-false-correct':
        return this.renderTFCorrect(this.convertToTFCorrect(q));
      default:
        return this.renderMultipleChoice(q);
    }
  },

  // Render multiple choice (standard)
  renderMultipleChoice(q) {
    return {
      html: `
        <div class="mm-question mm-multiple-choice">
          <div class="mm-prompt">${q.q}</div>
          <div class="mm-options">
            ${q.options.map((opt, i) => `
              <button class="mm-option" data-index="${i}">
                <span class="mm-option-marker">${String.fromCharCode(65 + i)}</span>
                <span class="mm-option-text">${opt}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `,
      validate: (response) => response === q.answer
    };
  },

  // Render type-in format
  renderTypeIn(converted) {
    return {
      html: `
        <div class="mm-question mm-type-in">
          <div class="mm-prompt">${converted.prompt}</div>
          <div class="mm-input-area">
            <input type="text" class="mm-text-input" placeholder="Type your answer..." autocomplete="off">
            <button class="mm-submit-btn">Submit</button>
          </div>
          <div class="mm-hints hidden">
            ${converted.hints.map(h => `<span class="mm-hint">${h}</span>`).join('')}
          </div>
        </div>
      `,
      validate: (response) => {
        const normalized = response.toLowerCase().trim();
        return converted.acceptableAnswers.includes(normalized);
      },
      correctAnswer: converted.correctAnswer
    };
  },

  // Render fill-in-the-blank format
  renderFillBlank(converted) {
    return {
      html: `
        <div class="mm-question mm-fill-blank">
          <div class="mm-statement">${converted.statement}</div>
          <div class="mm-input-area">
            <input type="text" class="mm-text-input" placeholder="Fill in the blank..." autocomplete="off">
            <button class="mm-submit-btn">Submit</button>
          </div>
        </div>
      `,
      validate: (response) => {
        const normalized = response.toLowerCase().trim();
        return converted.acceptableAnswers.includes(normalized);
      },
      correctAnswer: converted.correctAnswer
    };
  },

  // Render sequence ordering format
  renderSequence(converted) {
    return {
      html: `
        <div class="mm-question mm-sequence">
          <div class="mm-prompt">${converted.instructions}</div>
          <div class="mm-sequence-items" data-sortable="true">
            ${converted.steps.map((step, i) => `
              <div class="mm-sequence-item" draggable="true" data-index="${i}">
                <span class="mm-drag-handle">⋮⋮</span>
                <span class="mm-item-text">${typeof step === 'object' ? step.text : step}</span>
              </div>
            `).join('')}
          </div>
          <button class="mm-submit-btn">Check Order</button>
        </div>
      `,
      validate: (response) => {
        // response should be array of indices in submitted order
        const correctOrder = converted.correctOrder.map(s => typeof s === 'object' ? s.text : s);
        const submittedOrder = response.map(i => converted.steps[i]);
        return JSON.stringify(correctOrder) === JSON.stringify(submittedOrder);
      }
    };
  },

  // Render match format
  renderMatch(converted) {
    return {
      html: `
        <div class="mm-question mm-match">
          <div class="mm-prompt">${converted.instructions}</div>
          <div class="mm-match-columns">
            <div class="mm-terms-column">
              <div class="mm-column-header">Terms</div>
              ${converted.terms.map((term, i) => `
                <div class="mm-match-term" data-term="${i}">${term}</div>
              `).join('')}
            </div>
            <div class="mm-definitions-column">
              <div class="mm-column-header">Definitions</div>
              ${converted.definitions.map((def, i) => `
                <div class="mm-match-definition" data-def="${i}">${def}</div>
              `).join('')}
            </div>
          </div>
          <button class="mm-submit-btn">Check Matches</button>
        </div>
      `,
      validate: (response) => {
        // response should be object mapping term indices to definition indices
        return converted.correctPairs.every((pair, i) => {
          const defIndex = converted.definitions.indexOf(pair.definition);
          return response[i] === defIndex;
        });
      }
    };
  },

  // Render True/False with correction format
  renderTFCorrect(converted) {
    return {
      html: `
        <div class="mm-question mm-tf-correct">
          <div class="mm-statement">${converted.statement}</div>
          <div class="mm-tf-buttons">
            <button class="mm-tf-btn mm-true" data-value="true">True</button>
            <button class="mm-tf-btn mm-false" data-value="false">False</button>
          </div>
          <div class="mm-correction-area hidden">
            <p class="mm-correction-prompt">If false, provide the correction:</p>
            <textarea class="mm-correction-input" placeholder="Enter the corrected statement..."></textarea>
            <button class="mm-submit-btn">Submit Correction</button>
          </div>
        </div>
      `,
      validate: (response) => {
        const tfCorrect = response.isTrue === converted.isTrue;
        if (!converted.correctionRequired) {
          return tfCorrect;
        }
        // For false statements, also check correction
        const correctionCorrect = response.correction &&
          response.correction.toLowerCase().includes(
            converted.correctedStatement.toLowerCase().substring(0, 20)
          );
        return tfCorrect && correctionCorrect;
      },
      correctAnswer: converted.isTrue ? 'True' : `False - ${converted.correctedStatement}`
    };
  },

  // Get CSS for multimodal questions
  getStyles() {
    return `
      .mm-question {
        padding: 1.5rem;
      }

      .mm-prompt, .mm-statement {
        font-size: 1.1rem;
        margin-bottom: 1.25rem;
        line-height: 1.6;
      }

      .mm-options {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .mm-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        background: var(--layer-1);
        border: 1px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
        text-align: left;
        width: 100%;
      }

      .mm-option:hover {
        background: var(--layer-2);
        border-color: var(--text-muted);
      }

      .mm-option-marker {
        width: 22px;
        height: 22px;
        min-width: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--layer-2);
        font-size: 0.7rem;
        font-weight: 600;
      }

      .mm-input-area {
        display: flex;
        gap: 0.75rem;
      }

      .mm-text-input {
        flex: 1;
        padding: 0.85rem 1rem;
        background: var(--layer-1);
        border: 1px solid var(--card-border);
        border-radius: 8px;
        color: var(--text);
        font-size: 1rem;
      }

      .mm-text-input:focus {
        outline: none;
        border-color: var(--luminara);
      }

      .mm-submit-btn {
        padding: 0.85rem 1.5rem;
        background: var(--luminara);
        border: none;
        border-radius: 8px;
        color: #000;
        font-weight: 600;
        cursor: pointer;
      }

      .mm-submit-btn:hover {
        filter: brightness(1.1);
      }

      .mm-hints {
        margin-top: 1rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .mm-hints.hidden {
        display: none;
      }

      .mm-hint {
        padding: 0.3rem 0.6rem;
        background: var(--layer-2);
        border-radius: 4px;
        font-size: 0.75rem;
        color: var(--text-dim);
      }

      .mm-sequence-items {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .mm-sequence-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: var(--layer-1);
        border: 1px solid var(--card-border);
        border-radius: 8px;
        cursor: grab;
      }

      .mm-sequence-item:active {
        cursor: grabbing;
      }

      .mm-drag-handle {
        color: var(--text-muted);
        user-select: none;
      }

      .mm-match-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 1rem;
      }

      .mm-column-header {
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        color: var(--text-dim);
        margin-bottom: 0.75rem;
      }

      .mm-match-term, .mm-match-definition {
        padding: 0.65rem 1rem;
        background: var(--layer-1);
        border: 1px solid var(--card-border);
        border-radius: 6px;
        margin-bottom: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;
      }

      .mm-match-term.selected, .mm-match-definition.selected {
        border-color: var(--luminara);
        background: var(--luminara-bg);
      }

      .mm-tf-buttons {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .mm-tf-btn {
        flex: 1;
        padding: 1rem;
        border: 2px solid var(--card-border);
        border-radius: 8px;
        background: var(--layer-1);
        color: var(--text);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
      }

      .mm-tf-btn.mm-true:hover {
        border-color: var(--correct);
        color: var(--correct);
      }

      .mm-tf-btn.mm-false:hover {
        border-color: var(--incorrect);
        color: var(--incorrect);
      }

      .mm-correction-area {
        margin-top: 1rem;
      }

      .mm-correction-area.hidden {
        display: none;
      }

      .mm-correction-input {
        width: 100%;
        min-height: 80px;
        padding: 0.85rem 1rem;
        background: var(--layer-1);
        border: 1px solid var(--card-border);
        border-radius: 8px;
        color: var(--text);
        font-size: 1rem;
        resize: vertical;
        margin-bottom: 0.75rem;
      }
    `;
  }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MultiModalQuestions;
}
