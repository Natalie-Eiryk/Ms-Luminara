# Appendix A: Question Schema

Reference for the JSON structure of quiz questions.

---

## Full Question Object

```json
{
  "id": "100.1.01",
  "q": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 0,
  "chapter": "Chapter 12 — The Brain",
  "explain": "Brief explanation shown after answering",
  "optionExplains": [
    {
      "verdict": "correct",
      "text": "Detailed explanation for the correct answer"
    },
    {
      "verdict": "incorrect",
      "text": "Explanation of why this option is wrong"
    },
    {
      "verdict": "incorrect",
      "text": "Explanation of why this option is wrong"
    },
    {
      "verdict": "incorrect",
      "text": "Explanation of why this option is wrong"
    }
  ],
  "mechanism": {
    "title": "Mechanism Tour Title",
    "content": "Detailed mechanism explanation in Ms. Luminara's teaching style",
    "metaphor": "A structurally accurate metaphor for the concept"
  }
}
```

---

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (e.g., "100.1.01") |
| `q` | string | Yes | The question text |
| `options` | array | Yes | Array of 2-4 answer choices |
| `answer` | number | Yes | Index of correct answer (0-based) |
| `chapter` | string | Yes | Chapter or category name |
| `explain` | string | Yes | Brief explanation |
| `optionExplains` | array | Yes | Detailed explanation for each option |
| `mechanism` | object | Yes | Deep dive into the mechanism |

---

## optionExplains Array

Each element corresponds to an option at the same index.

```json
{
  "verdict": "correct" | "incorrect",
  "text": "Detailed explanation"
}
```

---

## mechanism Object

```json
{
  "title": "Clear, descriptive title",
  "content": "Detailed explanation using physics-first approach",
  "metaphor": "Structurally accurate metaphor (optional but encouraged)"
}
```

---

## ID Numbering Convention

- First digit group: Category (100 = Brain, 200 = Nerves, etc.)
- Second digit: Subcategory bank (100.1 = Structure, 100.2 = Meninges, etc.)
- Third digit group: Question number within bank (01, 02, etc.)

Example: `300.2.05` = Foundations category, Chemistry bank, question 5

---

## Writing Guidelines

### For `explain`:
- Keep brief (1-2 sentences)
- State the key fact
- Avoid jargon where possible

### For `optionExplains`:
- Explain WHY each option is right or wrong
- Use physics-first explanations
- Connect to broader concepts
- Never shame the learner

### For `mechanism`:
- Provide the full mechanism tour
- Use Ms. Luminara's teaching style
- Include structural, physics-based explanations
- End with a metaphor that illuminates without distorting
