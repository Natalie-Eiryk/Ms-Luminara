# Ms. Luminara's Quiz Lab

A gamified anatomy & physiology quiz system with RPG elements, voice synthesis, and adaptive learning.

---

## Quick Start

### Option 1: Double-click Launch
```
Launch Ms. Luminara.bat    → Full experience with TTS voice
Quick Quiz.bat             → Lightweight quiz mode
```

### Option 2: Manual Start
1. Start the TTS server: `cd tts-server && python server.py`
2. Open `index.html` in a browser

---

## Features

### Core Quiz System
- **Exploration-based learning** — Click any answer to explore why it's right or wrong
- **Warmup scaffolding** — 2 prerequisite questions before each main question
- **Mechanism tours** — Deep dives into the "why" behind correct answers
- **Ms. Luminara's voice** — Distinctive teaching persona with metaphors

### Gamification (RPG Elements)
- **XP & Levels** — Earn experience for correct answers
- **Streaks** — Build momentum with consecutive correct answers
- **Achievements** — Unlock badges for milestones
- **D20 System** — Roll for insight hints, save streaks with Charisma
- **Loot & Equipment** — Find gear that boosts your stats
- **Character progression** — INT, WIS, CON, CHA stats that grow

### Voice System
- **Piper TTS** — Fast local neural voice synthesis
- **Voice blending** — Mix multiple voices for custom personalities
- **XTTS Voice Lab** — GPU-powered true voice morphing (optional)

---

## Directory Structure

```
ms_luminara_quiz/
├── index.html                    # Main quiz application
├── quick-quiz.html               # Lightweight quiz mode
├── README.md                     # This file
│
├── 000-core/                     # Core system (Body)
│   ├── 000.0-styles.css          # All CSS styling (6000 lines)
│   ├── 000.0-dev-tools.js        # Developer tools & color picker
│   ├── 000.0-dev-panel.css       # Dev panel styles
│   │
│   ├── 000.1-app.js              # Main application controller
│   ├── 000.2-renderer.js         # Question rendering engine (Body)
│   ├── 000.2.1-renderer-voice-lab.js   # Voice Lab UI (Function)
│   ├── 000.2.2-renderer-inventory.js   # Inventory/Paperdoll UI (Function)
│   ├── 000.2.3-renderer-d20-ui.js      # D20 RPG UI (Function)
│   │
│   ├── 000.3-gamification.js     # XP, levels, streaks
│   ├── 000.4-persistence.js      # LocalStorage save/load
│   ├── 000.5-achievements.json   # Achievement definitions
│   ├── 000.6-scaffolding.js      # Adaptive difficulty
│   ├── 000.7-d20-system.js       # D20 RPG mechanics
│   ├── 000.8-loot-system.js      # Equipment & gems
│   ├── 000.9-voice-system.js     # TTS integration
│   │
│   ├── 000.10-isotope-engine.js  # Memory isotope tagging
│   ├── 000.11-zpd-system.js      # Zone of Proximal Development
│   ├── 000.12-multimodal-questions.js  # Multi-format questions
│   └── 000.13-lumi-bridge.js     # LUMI-OS integration
│
├── 100-brain/                    # Chapter 12 — The Brain
│   ├── 100.0-index.json          # Category metadata
│   ├── 100.1-structure.json      # Brain structure (14 questions)
│   ├── 100.2-meninges-csf.json   # Meninges & CSF (12 questions)
│   ├── 100.3-cortex.json         # Cerebral cortex (18 questions)
│   └── 100.4-brainstem.json      # Brainstem & functions (16 questions)
│
├── 200-nerves/                   # Chapter 13 — Peripheral Nerves
│   ├── 200.0-index.json          # Category metadata
│   ├── 200.1-spinal.json         # Spinal cord & roots
│   ├── 200.2-receptors.json      # Sensory receptors
│   ├── 200.3-plexuses.json       # Nerve plexuses
│   ├── 200.4-reflexes.json       # Reflexes & pathways
│   ├── 200.5-cranial-nerves.json # Cranial nerves
│   └── 200.6-autonomic-nervous-system.json  # ANS overview
│
├── 300-foundations/              # Chapters 1-4 — Foundations
│   ├── 300.0-index.json          # Category metadata
│   ├── 300.1-organization.json   # Body organization (18 questions)
│   ├── 300.2-chemistry.json      # Basic chemistry (16 questions)
│   ├── 300.3-cells.json          # Cell structure (14 questions)
│   └── 300.4-membranes.json      # Membrane transport (11 questions)
│
├── 400-tissues/                  # Tissues & Histology
│   ├── 400.0-index.json          # Category metadata
│   ├── 400.1-epithelial.json     # Epithelial tissues (14 questions)
│   ├── 400.2-connective.json     # Connective tissues (12 questions)
│   └── 400.3-glands.json         # Glands & secretion (10 questions)
│
├── 500-ans/                      # Chapter 14 — Autonomic NS
│   ├── 500.1-divisions.json      # ANS divisions (10 questions)
│   └── 500.2-neurotransmitters.json  # Neurotransmitters (8 questions)
│
├── 600-special-senses/           # Chapter 15 — Special Senses
│   ├── 600.1-eye-structure.json  # Eye anatomy (12 questions)
│   ├── 600.2-vision-pathways.json # Visual pathways (7 questions)
│   └── 600.3-ear-hearing.json    # Ear & hearing (9 questions)
│
├── 700-endocrine/                # Chapter 16 — Endocrine
│   └── 700.1-pituitary.json      # Pituitary & hormones (8 questions)
│
├── tts-server/                   # Voice synthesis server
│   ├── server.py                 # Flask TTS server
│   ├── requirements.txt          # Python dependencies
│   └── voices/                   # Piper voice models
│
├── appendices/                   # Reference documentation
│   ├── appendix-a-question-schema.md
│   ├── appendix-b-adding-questions.md
│   └── appendix-c-mechanism-style.md
│
└── docs/                         # Extended documentation
    └── ARCHITECTURE.md           # System architecture
```

---

## Dewey Decimal System

| Code | Category | Content |
|------|----------|---------|
| 000 | Core | System files, scripts, styles |
| 100 | Brain | Ch12 — Neuroanatomy |
| 200 | Nerves | Ch13 — PNS, sensory pathways |
| 300 | Foundations | Ch1-4 — Organization, chemistry, cells |
| 400 | Tissues | Histology, epithelia, connective |
| 500 | ANS | Ch14 — Autonomic nervous system |
| 600 | Special Senses | Ch15 — Vision, hearing, taste |
| 700 | Endocrine | Ch16 — Hormones, glands |
| 800 | (Reserved) | Future expansion |
| 900 | (Reserved) | Future expansion |

---

## Question Bank Format

Each question bank is a JSON file:

```json
{
  "id": "100.1",
  "title": "Brain Structure",
  "chapter": "Ch12 - Brain",
  "description": "Questions about brain regions",
  "questions": [
    {
      "id": "100.1.01",
      "q": "Which brain structure coordinates movement?",
      "options": ["Cerebrum", "Cerebellum", "Medulla", "Pons"],
      "answer": 1,
      "prereqs": ["Motor control basics", "Brain anatomy overview"],
      "optionExplains": [
        { "verdict": "incorrect", "text": "The cerebrum handles conscious thought..." },
        { "verdict": "correct", "text": "The cerebellum is the coordination center..." },
        { "verdict": "incorrect", "text": "The medulla controls vital functions..." },
        { "verdict": "incorrect", "text": "The pons relays signals..." }
      ],
      "mechanism": {
        "title": "Cerebellar Coordination",
        "content": "The cerebellum receives input from proprioceptors...",
        "metaphor": "Think of it as the brain's quality control inspector..."
      }
    }
  ]
}
```

### Question Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (e.g., "100.1.01") |
| `q` | Yes | Question text |
| `options` | Yes | Array of 4 answer choices |
| `answer` | Yes | Index of correct answer (0-3) |
| `prereqs` | No | Concepts needed to answer |
| `optionExplains` | Yes | Explanation for each option |
| `mechanism` | No | Deep dive for correct answer |
| `chapter` | No | Chapter reference |

---

## Core Systems

### 000.1-app.js — Application Controller
- Quiz state management
- Question loading and sequencing
- Mode switching (study, blitz, review)
- Event coordination

### 000.2-renderer.js — Rendering Engine
The main UI renderer, extended by mixins:
- **000.2.1-renderer-voice-lab.js** — Voice blending, XTTS, cocktails
- **000.2.2-renderer-inventory.js** — Equipment, paperdoll, gems
- **000.2.3-renderer-d20-ui.js** — Dice rolls, character sheets

### 000.3-gamification.js — XP & Progression
- XP calculation with bonuses
- Level progression (logarithmic curve)
- Streak tracking and multipliers
- Lucky strike random bonuses

### 000.4-persistence.js — Save System
- LocalStorage-based persistence
- Progress tracking per question
- Wrong answer queue for review
- Session statistics

### 000.6-scaffolding.js — Adaptive Learning
- Performance tracking
- Difficulty adjustment
- Extra hints when struggling
- Challenge mode when excelling

### 000.7-d20-system.js — RPG Mechanics
- D20 dice rolling with advantage/disadvantage
- Stat modifiers (INT, WIS, CON, CHA)
- Insight points as currency
- Skill checks for hints

### 000.8-loot-system.js — Equipment
- Item generation with rarities
- Equipment slots (head, chest, etc.)
- Gems and socketing
- Set bonuses

### 000.9-voice-system.js — TTS Integration
- Piper TTS backend
- Voice selection and preview
- Speech queue management
- Emotion-aware speaking

---

## TTS Server

### Requirements
- Python 3.8+
- Piper TTS models
- Flask

### Installation
```bash
cd tts-server
pip install -r requirements.txt
```

### Running
```bash
python server.py
# Server runs on http://localhost:5500
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/speak` | POST | Generate speech from text |
| `/voices` | GET | List available voices |
| `/blend-multi` | POST | Blend multiple voices |
| `/xtts/status` | GET | Check XTTS availability |
| `/xtts/speak` | POST | Generate with XTTS |
| `/xtts/blend` | POST | Blend XTTS voices |

---

## Development

### Body-Function-Subfunction Architecture

The codebase follows a modular pattern:
- **Body files** (~30KB max) — Main class definitions
- **Function files** — Feature modules as mixins
- **Subfunction files** — Specialized helpers

Example:
```
000.2-renderer.js           (Body - core class)
├── 000.2.1-renderer-voice-lab.js    (Function - voice features)
├── 000.2.2-renderer-inventory.js    (Function - inventory UI)
└── 000.2.3-renderer-d20-ui.js       (Function - D20 RPG UI)
```

### Adding New Features

1. Create a new function file: `000.2.X-renderer-feature.js`
2. Define a mixin object with methods
3. Apply to QuizRenderer prototype
4. Add script tag to index.html

```javascript
// 000.2.X-renderer-feature.js
const FeatureMixin = {
  myNewMethod() {
    // implementation
  }
};

if (typeof QuizRenderer !== 'undefined') {
  Object.assign(QuizRenderer.prototype, FeatureMixin);
}
```

### File Size Guidelines
- Question banks: 15-25 questions max
- JS files: ~30KB for body files
- Split large features into function modules

---

## Ms. Luminara's Teaching Voice

The quiz uses a distinctive persona with these characteristics:

### Tone
- Warm and inviting
- Intellectually seductive
- Uses metaphors liberally
- Never condescending

### Sample Phrases
- "Come closer — let me show you something beautiful..."
- "Stay with me here, this is where it gets delicious..."
- "Here's the secret that ties it all together..."
- "Now do you see why I love this?"

### Mechanism Tours
When explaining correct answers, include:
1. The scientific mechanism
2. A vivid metaphor
3. Clinical relevance when applicable

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-4` | Select answer option |
| `Enter` | Confirm / Next |
| `Escape` | Close modal |
| `V` | Toggle voice |
| `I` | Open inventory |

---

## Browser Support
- Chrome 90+ (recommended)
- Firefox 88+
- Edge 90+
- Safari 14+

---

## Troubleshooting

### Voice not working
1. Check TTS server is running (`http://localhost:5500`)
2. Verify voice models are in `tts-server/voices/`
3. Check browser console for errors

### Questions not loading
1. Verify JSON files are valid (use JSONLint)
2. Check browser console for 404 errors
3. Ensure file paths match registry

### Performance issues
1. Clear localStorage if data is corrupted
2. Reduce voice quality settings
3. Disable animations in dev panel

---

## Credits

- **Teaching content** — Anatomy & Physiology curriculum
- **Voice synthesis** — Piper TTS, XTTS
- **Character design** — Ms. Luminara persona
- **Gamification** — D20 RPG mechanics inspired by D&D

---

## License

Educational use. Question content based on standard A&P curriculum.
