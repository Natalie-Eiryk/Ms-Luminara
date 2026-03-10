/**
 * 000.10-isotope-engine.js
 * TICK 1: Isotope-Enhanced Question Format
 *
 * Isotopes are semantic tags that link concepts across domains.
 * Format: "domain.subdomain.concept" (e.g., "ans.sympathetic.fiber-length")
 *
 * Integration with LUMI-OS Pi-Line memory system:
 * - isotope_id maps to Pi-Line BBP addresses
 * - claim_units structured as (agent, verb, target, outcome)
 * - operators: F(rame), T(ransform), A(ggregate), I(ntensify), D(iminish), R(edirect), G(ather), E(mit)
 */

const IsotopeEngine = {
  // Isotope registry - maps concepts to related questions and knowledge
  registry: {},

  // Domain prefixes for categorization
  domains: {
    'anatomy': ['structure', 'location', 'layers', 'regions'],
    'physiology': ['function', 'mechanism', 'pathway', 'regulation'],
    'pathology': ['disease', 'dysfunction', 'symptoms', 'causes'],
    'clinical': ['diagnosis', 'treatment', 'pharmacology', 'intervention'],
    'histology': ['cells', 'tissue', 'microscopy', 'staining']
  },

  // Initialize from question bank
  init(questions) {
    this.questions = questions;
    this.buildRegistry();
    this.computePrerequisites();
    console.log(`[Isotope] Registry built: ${Object.keys(this.registry).length} isotopes`);
  },

  // Build isotope registry from questions
  buildRegistry() {
    this.registry = {};

    for (const q of this.questions) {
      // Auto-generate isotopes if not present
      const isotopes = q.isotopes || this.inferIsotopes(q);
      q.isotopes = isotopes;

      for (const iso of isotopes) {
        if (!this.registry[iso]) {
          this.registry[iso] = {
            questions: [],
            related: new Set(),
            domain: iso.split('.')[0],
            subdomain: iso.split('.')[1] || null,
            concept: iso.split('.').slice(2).join('.') || iso.split('.')[1]
          };
        }
        this.registry[iso].questions.push(q.id);
      }
    }

    // Build cross-references (only if question has multiple isotopes)
    for (const q of this.questions) {
      const isotopes = q.isotopes || [];
      if (isotopes.length > 1) {
        for (const iso1 of isotopes) {
          for (const iso2 of isotopes) {
            if (iso1 !== iso2 && this.registry[iso1] && this.registry[iso2]) {
              this.registry[iso1].related.add(iso2);
            }
          }
        }
      }
    }
  },

  // Infer isotopes from question content
  inferIsotopes(q) {
    const isotopes = [];
    const text = `${q.q} ${q.explain || ''} ${q.mechanism?.content || ''}`.toLowerCase();

    // Category-based isotope
    if (q._category) {
      isotopes.push(`category.${q._category.toLowerCase().replace(/\s+/g, '-')}`);
    }

    // ANS-specific isotopes
    if (text.includes('sympathetic') && text.includes('parasympathetic')) {
      isotopes.push('ans.comparison.divisions');
    } else if (text.includes('sympathetic')) {
      isotopes.push('ans.sympathetic.general');
      if (text.includes('fiber')) isotopes.push('ans.sympathetic.fibers');
      if (text.includes('gangli')) isotopes.push('ans.sympathetic.ganglia');
      if (text.includes('norepinephrine') || text.includes('norepi')) isotopes.push('ans.sympathetic.neurotransmitter');
    } else if (text.includes('parasympathetic')) {
      isotopes.push('ans.parasympathetic.general');
      if (text.includes('vagus') || text.includes('cn x')) isotopes.push('ans.parasympathetic.vagus');
      if (text.includes('acetylcholine') || text.includes('ach')) isotopes.push('ans.parasympathetic.neurotransmitter');
    }

    // Neurotransmitter isotopes
    if (text.includes('acetylcholine') || text.includes('ach')) {
      isotopes.push('neurotransmitter.acetylcholine');
    }
    if (text.includes('norepinephrine') || text.includes('noradrenaline')) {
      isotopes.push('neurotransmitter.norepinephrine');
    }
    if (text.includes('epinephrine') || text.includes('adrenaline')) {
      isotopes.push('neurotransmitter.epinephrine');
    }

    // Receptor isotopes
    if (text.includes('muscarinic')) isotopes.push('receptor.muscarinic');
    if (text.includes('nicotinic')) isotopes.push('receptor.nicotinic');
    if (text.includes('adrenergic')) isotopes.push('receptor.adrenergic');
    if (text.includes('alpha') && text.includes('receptor')) isotopes.push('receptor.alpha-adrenergic');
    if (text.includes('beta') && text.includes('receptor')) isotopes.push('receptor.beta-adrenergic');

    // Anatomy isotopes
    if (text.includes('gangli')) isotopes.push('anatomy.ganglia.general');
    if (text.includes('preganglionic')) isotopes.push('anatomy.neurons.preganglionic');
    if (text.includes('postganglionic')) isotopes.push('anatomy.neurons.postganglionic');
    if (text.includes('spinal cord')) isotopes.push('anatomy.cns.spinal-cord');
    if (text.includes('brainstem')) isotopes.push('anatomy.cns.brainstem');

    // Physiological isotopes
    if (text.includes('fight') && text.includes('flight')) isotopes.push('physiology.response.fight-flight');
    if (text.includes('rest') && text.includes('digest')) isotopes.push('physiology.response.rest-digest');
    if (text.includes('heart rate') || text.includes('cardiac')) isotopes.push('physiology.cardiovascular.heart-rate');
    if (text.includes('blood pressure')) isotopes.push('physiology.cardiovascular.blood-pressure');
    if (text.includes('pupil')) isotopes.push('physiology.eye.pupil');
    if (text.includes('digestion') || text.includes('gi tract')) isotopes.push('physiology.digestive.motility');

    // Clinical isotopes
    if (text.includes('blocker') || text.includes('antagonist')) isotopes.push('clinical.pharmacology.blockers');
    if (text.includes('agonist')) isotopes.push('clinical.pharmacology.agonists');
    if (text.includes('atropine')) isotopes.push('clinical.drugs.atropine');
    if (text.includes('propranolol') || text.includes('beta-blocker')) isotopes.push('clinical.drugs.beta-blockers');

    // Ensure at least one isotope
    if (isotopes.length === 0) {
      isotopes.push(`general.${q.id}`);
    }

    return [...new Set(isotopes)]; // Remove duplicates
  },

  // Get related questions through isotope links
  getRelatedQuestions(qid, maxResults = 5) {
    const q = this.questions.find(x => x.id === qid);
    if (!q || !q.isotopes) return [];

    const scores = {};

    for (const iso of q.isotopes) {
      const entry = this.registry[iso];
      if (!entry) continue;

      // Direct isotope matches
      for (const relatedQid of entry.questions) {
        if (relatedQid !== qid) {
          scores[relatedQid] = (scores[relatedQid] || 0) + 2;
        }
      }

      // Related isotope matches (weaker connection)
      for (const relatedIso of entry.related) {
        const relatedEntry = this.registry[relatedIso];
        if (relatedEntry) {
          for (const relatedQid of relatedEntry.questions) {
            if (relatedQid !== qid) {
              scores[relatedQid] = (scores[relatedQid] || 0) + 1;
            }
          }
        }
      }
    }

    // Sort by score and return top results
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxResults)
      .map(([id, score]) => ({
        question: this.questions.find(x => x.id === id),
        score,
        sharedIsotopes: this.getSharedIsotopes(qid, id)
      }));
  },

  // Get isotopes shared between two questions
  getSharedIsotopes(qid1, qid2) {
    const q1 = this.questions.find(x => x.id === qid1);
    const q2 = this.questions.find(x => x.id === qid2);
    if (!q1?.isotopes || !q2?.isotopes) return [];

    return q1.isotopes.filter(iso => q2.isotopes.includes(iso));
  },

  // Compute prerequisite relationships
  computePrerequisites() {
    for (const q of this.questions) {
      if (q.prereqs) continue; // Already has defined prerequisites

      // Infer prerequisites from isotope relationships
      const prereqCandidates = [];

      for (const iso of (q.isotopes || [])) {
        const entry = this.registry[iso];
        if (!entry) continue;

        // Questions with simpler isotopes might be prerequisites
        for (const relatedQid of entry.questions) {
          if (relatedQid === q.id) continue;
          const relatedQ = this.questions.find(x => x.id === relatedQid);
          if (relatedQ && (relatedQ.isotopes?.length || 0) < (q.isotopes?.length || 0)) {
            prereqCandidates.push(relatedQid);
          }
        }
      }

      if (prereqCandidates.length > 0) {
        q._inferredPrereqs = [...new Set(prereqCandidates)].slice(0, 3);
      }
    }
  },

  // Get concept map for visualization
  getConceptMap(qid, depth = 2) {
    const q = this.questions.find(x => x.id === qid);
    if (!q) return null;

    const nodes = new Map();
    const edges = [];

    // Add question as central node
    nodes.set(qid, {
      id: qid,
      type: 'question',
      label: q.q.substring(0, 50) + '...',
      isotopes: q.isotopes
    });

    // Add isotope nodes
    for (const iso of (q.isotopes || [])) {
      const isoKey = `iso:${iso}`;
      nodes.set(isoKey, {
        id: isoKey,
        type: 'isotope',
        label: iso.split('.').pop(),
        fullPath: iso
      });
      edges.push({ from: qid, to: isoKey, type: 'has_isotope' });

      // Add related questions through this isotope
      if (depth > 0) {
        const entry = this.registry[iso];
        if (entry) {
          for (const relatedQid of entry.questions.slice(0, 3)) {
            if (!nodes.has(relatedQid)) {
              const relatedQ = this.questions.find(x => x.id === relatedQid);
              if (relatedQ) {
                nodes.set(relatedQid, {
                  id: relatedQid,
                  type: 'related_question',
                  label: relatedQ.q.substring(0, 40) + '...'
                });
              }
            }
            edges.push({ from: isoKey, to: relatedQid, type: 'links_to' });
          }
        }
      }
    }

    return { nodes: Array.from(nodes.values()), edges };
  },

  // Format isotopes for display
  formatIsotope(iso) {
    const parts = iso.split('.');
    const icons = {
      'anatomy': '🫀',
      'physiology': '⚡',
      'pathology': '🔴',
      'clinical': '💊',
      'histology': '🔬',
      'ans': '🧠',
      'neurotransmitter': '⚗️',
      'receptor': '🎯',
      'general': '📚',
      'category': '📁'
    };

    const icon = icons[parts[0]] || '🔗';
    const label = parts.slice(1).join(' › ');

    return { icon, label, full: iso };
  },

  // Get isotope statistics
  getStats() {
    const qCount = this.questions.length || 1; // Prevent division by zero
    const totalIsotopes = this.questions.reduce((sum, q) => sum + (q.isotopes?.length || 0), 0);

    return {
      totalIsotopes: Object.keys(this.registry).length,
      totalQuestions: this.questions.length,
      domainCounts: Object.entries(this.registry).reduce((acc, [iso, entry]) => {
        acc[entry.domain] = (acc[entry.domain] || 0) + 1;
        return acc;
      }, {}),
      avgIsotopesPerQuestion: totalIsotopes / qCount
    };
  },

  // Export for LUMI-OS integration
  exportForLumiOS(qid) {
    const q = this.questions.find(x => x.id === qid);
    if (!q) return null;

    return {
      question_id: qid,
      isotopes: q.isotopes,
      claim_units: this.extractClaimUnits(q),
      operators: this.inferOperators(q),
      zpd_zone: this.inferZPDZone(q),
      natural_context: q.mechanism?.metaphor || null,
      wisdom_links: this.getWisdomLinks(qid)
    };
  },

  // Extract claim units from question (agent, verb, target, outcome)
  extractClaimUnits(q) {
    const units = [];
    const text = q.explain || '';

    // Simple extraction patterns
    const patterns = [
      /(\w+(?:\s+\w+)?)\s+(activates?|inhibits?|releases?|binds?|controls?|regulates?)\s+(\w+(?:\s+\w+)?)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        units.push({
          agent: match[1],
          verb: match[2],
          target: match[3],
          outcome: null // Would need more context
        });
      }
    }

    return units.slice(0, 3);
  },

  // Infer 8 operators for question
  inferOperators(q) {
    const text = `${q.q} ${q.explain || ''}`.toLowerCase();
    const operators = [];

    if (text.includes('what is') || text.includes('define')) operators.push('F'); // Frame
    if (text.includes('convert') || text.includes('changes') || text.includes('becomes')) operators.push('T'); // Transform
    if (text.includes('combine') || text.includes('together') || text.includes('both')) operators.push('A'); // Aggregate
    if (text.includes('increase') || text.includes('more') || text.includes('enhance')) operators.push('I'); // Intensify
    if (text.includes('decrease') || text.includes('less') || text.includes('reduce')) operators.push('D'); // Diminish
    if (text.includes('instead') || text.includes('rather') || text.includes('switch')) operators.push('R'); // Redirect
    if (text.includes('where') || text.includes('locate') || text.includes('find')) operators.push('G'); // Gather
    if (text.includes('release') || text.includes('secrete') || text.includes('output')) operators.push('E'); // Emit

    return operators.length > 0 ? operators : ['F']; // Default to Frame
  },

  // Infer ZPD zone based on question complexity
  inferZPDZone(q) {
    const hasPrereqs = q.prereqs && q.prereqs.length > 0;
    const hasMechanism = q.mechanism?.content;
    const hasMetaphor = q.mechanism?.metaphor;
    const isotopeDensity = (q.isotopes?.length || 0) / 3;

    const complexity = (hasPrereqs ? 1 : 0) + (hasMechanism ? 1 : 0) + (hasMetaphor ? 0.5 : 0) + isotopeDensity;

    if (complexity < 1) return 'known'; // Within current knowledge
    if (complexity < 2) return 'proximal'; // Just beyond, reachable with guidance
    return 'beyond'; // Requires scaffolding
  },

  // Get wisdom links (connections that create insight)
  getWisdomLinks(qid) {
    const related = this.getRelatedQuestions(qid, 3);
    return related.map(r => ({
      question_id: r.question.id,
      connection: r.sharedIsotopes.join(', '),
      insight: `Understanding ${r.sharedIsotopes[0]?.split('.').pop()} connects these concepts`
    }));
  }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IsotopeEngine;
}
