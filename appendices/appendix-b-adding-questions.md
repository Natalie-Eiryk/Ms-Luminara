# Appendix B: Adding New Questions

How to add questions to the Ms. Luminara Quiz System.

---

## Quick Reference

1. Identify the appropriate category and bank
2. Edit the JSON file
3. Follow the question schema (see Appendix A)
4. Update the question count in the registry
5. Test by refreshing the quiz

---

## Step-by-Step Guide

### 1. Find the Right Question Bank

Questions are organized by topic:

| Category | Folder | Topics |
|----------|--------|--------|
| 100 | 100-brain | Brain anatomy, meninges, cortex, brainstem |
| 200 | 200-nerves | Spinal cord, receptors, plexuses, reflexes |
| 300 | 300-foundations | Organization, chemistry, cells, membranes |
| 400 | 400-tissues | Epithelial, connective, glands |

### 2. Edit the Question Bank JSON

Open the appropriate JSON file (e.g., `100-brain/100.1-structure.json`).

Add your question to the `questions` array:

```json
{
  "id": "100.1.11",
  "q": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 0,
  "chapter": "Chapter 12 — The Brain",
  "explain": "Brief explanation",
  "optionExplains": [
    { "verdict": "correct", "text": "Why this is right" },
    { "verdict": "incorrect", "text": "Why this is wrong" },
    { "verdict": "incorrect", "text": "Why this is wrong" },
    { "verdict": "incorrect", "text": "Why this is wrong" }
  ],
  "mechanism": {
    "title": "Mechanism Tour Title",
    "content": "Full mechanism explanation",
    "metaphor": "Ms. Luminara's metaphor"
  }
}
```

### 3. Update the Question Count

Edit `000-core/question-registry.json` and update the `questionCount` for the affected bank.

### 4. Validate JSON

Ensure your JSON is valid:
- All strings are quoted
- Arrays have commas between elements (but not after the last)
- Objects have proper braces

### 5. Test

Open `index.html` in a browser and navigate to the category to verify your question loads.

---

## Creating a New Question Bank

If adding a new subtopic within an existing category:

1. Create the JSON file (e.g., `100.5-new-topic.json`)
2. Include the bank metadata:

```json
{
  "id": "100.5",
  "title": "New Topic Name",
  "category": "ch12",
  "description": "Description of this question bank",
  "questions": []
}
```

3. Register in `000-core/question-registry.json`:

```json
{
  "id": "100.5",
  "file": "100.5-new-topic.json",
  "title": "New Topic Name",
  "questionCount": 0
}
```

---

## Creating a New Category

To add an entirely new category (e.g., 500-integumentary):

1. Create the folder (e.g., `500-integumentary/`)
2. Create the index file (`500.0-index.json`)
3. Create question bank files
4. Add to the registry's `categories` array

See the README for the full Dewey decimal system.
