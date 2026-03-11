# Ms. Luminara's Quiz Lab - Study Roadmap

**Test Date:** ~March 17, 2026 (1 week from now)
**Last Updated:** March 10, 2026

---

## Current Status

### Question Bank Inventory
| Topic | Bank | Questions | Foundation Scaffolds |
|-------|------|-----------|---------------------|
| **100-brain** | 100.1-structure | 16 | Needs work |
| | 100.2-meninges-csf | 12 | Needs work |
| | 100.3-cortex | 13 | Needs work |
| | 100.4-brainstem | 11 | Needs work |
| **200-nerves** | 200.1-spinal | 10 | Needs work |
| | 200.2-receptors | 11 | Needs work |
| | 200.3-plexuses | 11 | Needs work |
| | 200.4-reflexes | 10 | Needs work |
| | 200.5-cranial-nerves | 22 | **DONE** |
| **400-tissues** | 400.2-connective | 12 | Needs work |
| | 400.3-glands | 10 | Needs work |
| **500-ans** | 500.1-divisions | 10 | Needs work |
| | 500.2-neurotransmitters | 9 | Needs work |
| **600-senses** | 600.1-eye-structure | 12 | Needs work |
| | 600.2-vision-pathways | 7 | Needs work |
| **000-foundations** | 000.1-organization | 18 | Needs work |

**Total Questions:** 194
**Scaffold Files:** 233 total (22 with foundation scaffolds, 196 need them)

---

## Priority Order for Remaining Work

Based on test prep strategy (hardest topics first, build foundation):

### HIGH PRIORITY (Core Nervous System)
1. **200.1-spinal** (10 questions) - Spinal nerve anatomy
2. **200.3-plexuses** (11 questions) - Brachial, lumbar, sacral plexuses
3. **200.4-reflexes** (10 questions) - Reflex arcs
4. **200.2-receptors** (11 questions) - Sensory receptors

### MEDIUM PRIORITY (Brain & Autonomic)
5. **100.1-structure** (16 questions) - Brain regions
6. **100.4-brainstem** (11 questions) - Medulla, pons, midbrain
7. **100.2-meninges-csf** (12 questions) - Protective layers, CSF
8. **500.1-divisions** (10 questions) - Sympathetic vs parasympathetic
9. **500.2-neurotransmitters** (9 questions) - ACh, NE, etc.

### LOWER PRIORITY (Senses & Tissues)
10. **600.1-eye-structure** (12 questions) - Eye anatomy
11. **600.2-vision-pathways** (7 questions) - Visual processing
12. **100.3-cortex** (13 questions) - Cortical areas
13. **400.2-connective** (12 questions) - Connective tissue
14. **400.3-glands** (10 questions) - Gland types

### FOUNDATIONS (Can do anytime)
15. **000.1-organization** (18 questions) - Body organization basics

---

## Work Pattern for Foundation Scaffolds

Each question gets 9 scaffolds:
- **7 foundation** (Ms. Frizzle style - simple True/False or basic multiple choice)
- **2 intermediate** (bridge to main question)

Foundation scaffolds should:
1. Start with absolute basics ("What is X?")
2. Define vocabulary ("What does 'olfactory' mean?")
3. Build simple concepts progressively
4. Connect to real-world understanding
5. Lead naturally toward the main question

---

## Session Workflow

When continuing scaffold work:
1. Pick a question bank from priority list
2. Read the main questions to understand what we're scaffolding toward
3. Write foundation scaffolds for each question (7 foundation + 2 intermediate = 9 per question)
4. Commit after each bank is complete
5. Push to GitHub

**Estimated pace:** ~10-15 questions per session (depends on complexity)

---

## Gauntlet Mode (Bonus Feature - Lower Priority)

The roguelike boss battle system is planned but not essential for test prep:
- Plan file exists at: `~/.claude/plans/dreamy-jumping-starfish.md`
- Can be implemented after scaffolds are complete
- Adds gamification layer but doesn't add study content

---

## Quick Commands

```bash
# Check scaffold status
python -c "..." # (see session for full script)

# Commit scaffold work
git add [topic-folder]/
git commit -m "Add foundation scaffolds for [bank-name]"
git push
```

---

## Notes

- Cranial nerves (200.5) completed: 22 questions, all with foundation scaffolds
- Each foundation scaffold has `"difficulty": "foundation"` tag
- Lazy loading system already in place (000.1-app.js)
- Service worker at v7
