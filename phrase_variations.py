"""
Ms. Luminara Phrase Variation Replacement Script
Replaces repetitive phrases with 23 varied alternatives for each pattern
Uses regex to match phrase beginnings regardless of what follows
"""

import json
import re
import random
from pathlib import Path

# ============================================================================
# PHRASE ALTERNATIVES - 23 variations for each repetitive pattern
# ============================================================================

# Pattern 1: "Here's where it gets [adjective]" / "here's the [adjective] part"
HERES_WHERE_ALTERNATIVES = [
    "Now we arrive at the gorgeous part:",
    "This is where the magic unfolds:",
    "And now, the revelation:",
    "Prepare yourself for this:",
    "The plot thickens beautifully here:",
    "This next part is pure elegance:",
    "Now observe what happens:",
    "Brace yourself for brilliance:",
    "The drama intensifies:",
    "Now things get truly spectacular:",
    "This is the moment I live for:",
    "And this is the masterstroke:",
    "What follows is exquisite:",
    "The crescendo approaches:",
    "Now for the piece de resistance:",
    "This is where physiology becomes poetry:",
    "Observe what unfolds next:",
    "The beauty of this mechanism reveals itself:",
    "What comes next will dazzle you:",
    "This is pure biological artistry:",
    "The elegance reveals itself here:",
    "Now witness the true sophistication:",
    "This is the breathtaking bit:",
]

# Pattern 2: "Let yourself [verb]" - the invitation to embody
LET_YOURSELF_ALTERNATIVES = [
    "Allow this to wash over you:",
    "Absorb this:",
    "Take a moment to appreciate this:",
    "Embrace this:",
    "Open yourself to this:",
    "Surrender to the logic here:",
    "Immerse yourself in this:",
    "Let this settle:",
    "Permit yourself to feel this:",
    "Breathe in this knowledge:",
    "Accept this reality:",
    "Allow your mind to embrace this:",
    "Give this idea space to land:",
    "Receive this insight:",
    "Make room for this understanding:",
    "Welcome this realization:",
    "Invite this in:",
    "Open your mind to this:",
    "Grant yourself this moment of clarity:",
    "Allow the mechanism to reveal itself:",
    "Feel the weight of this:",
    "Sit with this knowledge:",
    "Consider the elegance here:",
]

# Pattern 3: "Watch closely" / "Watch what happens" / "Watch this"
WATCH_CLOSELY_ALTERNATIVES = [
    "Keep your eyes on this:",
    "Notice what unfolds:",
    "Observe carefully now:",
    "Pay attention here:",
    "Focus on this moment:",
    "See what happens next:",
    "Track this carefully:",
    "Follow this sequence:",
    "Direct your attention here:",
    "Witness this transformation:",
    "Look at what occurs:",
    "Study this:",
    "Note this crucial step:",
    "Concentrate on this:",
    "Attend to this process:",
    "Fix your gaze here:",
    "Mark this moment:",
    "Survey this cascade:",
    "Examine what follows:",
    "Zero in on this:",
    "Regard this carefully:",
    "Cast your attention here:",
    "Behold what unfolds:",
]

# Pattern 4: "Stay close" / "Stay with me"
STAY_CLOSE_ALTERNATIVES = [
    "Follow this thread:",
    "Track with me here:",
    "Keep pace with this:",
    "Hold this thought:",
    "Bear with me:",
    "Trace this pathway:",
    "Don't lose this thread:",
    "Keep the chain connected:",
    "Maintain this focus:",
    "Pursue this logic:",
    "Walk through this:",
    "Navigate this together:",
    "Thread this needle carefully:",
    "Continue the sequence:",
    "Follow the breadcrumbs:",
    "Keep this momentum:",
    "Carry this forward:",
    "Sustain this attention:",
    "Hold the line here:",
    "Persist through this:",
    "Track each step:",
    "Connect these dots:",
    "See this through:",
]

# Pattern 5: "Come with me" / "Come closer"
COME_WITH_ME_ALTERNATIVES = [
    "Journey with me into this:",
    "Let's explore this together:",
    "Follow me deeper:",
    "Step into this world:",
    "Venture here:",
    "Enter this realm:",
    "Dive into this:",
    "Explore alongside me:",
    "Descend with me into this:",
    "Traverse this territory:",
    "Navigate with me:",
    "Walk this path:",
    "Accompany me through this:",
    "Join me in examining this:",
    "Travel deeper into this:",
    "Press onward:",
    "Advance into this:",
    "Proceed with me:",
    "Move with me toward this:",
    "Embark on this:",
    "Set out toward this:",
    "Chart this course:",
    "Discover with me:",
]

# Pattern 6: "Isn't that [adjective]" / "Isn't this/it [adjective]"
ISNT_THAT_ALTERNATIVES = [
    "Stunning, yes?",
    "Marvelous, wouldn't you say?",
    "Quite breathtaking.",
    "Truly remarkable.",
    "Absolutely elegant.",
    "Simply magnificent.",
    "Wonderfully designed.",
    "Perfectly orchestrated.",
    "Brilliantly engineered.",
    "Gloriously complex.",
    "A masterpiece of biology.",
    "Nature at its finest.",
    "Pure physiological poetry.",
    "Evolution's crowning achievement.",
    "The body's quiet genius.",
    "Sublimely intricate.",
    "Artistry in flesh.",
    "A symphony of function.",
    "Designed with precision.",
    "Crafted to perfection.",
    "The pinnacle of adaptation.",
    "Beautifully inevitable.",
    "Exquisitely logical.",
]

# ============================================================================
# REGEX REPLACEMENT PATTERNS
# Each entry: (regex_pattern, list_of_alternatives, name_for_stats)
# ============================================================================

REGEX_PATTERNS = [
    # "Here's where it gets [anything]" - match the whole phrase
    (r"[Hh]ere'?s where it gets \w+", HERES_WHERE_ALTERNATIVES, "here's where it gets"),
    (r"[Hh]ere'?s the \w+ part", HERES_WHERE_ALTERNATIVES, "here's the X part"),
    (r"[Hh]ere'?s where the magic", HERES_WHERE_ALTERNATIVES, "here's where the magic"),

    # "Let yourself [verb] [anything after]" - match just "Let yourself"
    (r"[Ll]et yourself \w+[: ]", LET_YOURSELF_ALTERNATIVES, "let yourself"),

    # "Watch [closely/what/this/how/the]"
    (r"[Ww]atch closely", WATCH_CLOSELY_ALTERNATIVES, "watch closely"),
    (r"[Ww]atch what happens", WATCH_CLOSELY_ALTERNATIVES, "watch what happens"),
    (r"[Ww]atch this", WATCH_CLOSELY_ALTERNATIVES, "watch this"),
    (r"[Ww]atch how ", WATCH_CLOSELY_ALTERNATIVES, "watch how"),
    (r"[Ww]atch the ", WATCH_CLOSELY_ALTERNATIVES, "watch the"),
    (r"[Ww]atch it ", WATCH_CLOSELY_ALTERNATIVES, "watch it"),

    # "Stay with me" / "Stay close" - match with various endings
    (r"[Ss]tay with me", STAY_CLOSE_ALTERNATIVES, "stay with me"),
    (r"[Ss]tay close", STAY_CLOSE_ALTERNATIVES, "stay close"),

    # "Come with me" / "Come closer" - match the phrase
    (r"[Cc]ome with me", COME_WITH_ME_ALTERNATIVES, "come with me"),
    (r"[Cc]ome closer", COME_WITH_ME_ALTERNATIVES, "come closer"),
    (r"[Cc]ome into ", COME_WITH_ME_ALTERNATIVES, "come into"),

    # "Isn't that [adjective]" variants
    (r"[Ii]sn'?t that \w+[\?\.]?", ISNT_THAT_ALTERNATIVES, "isn't that X?"),
    (r"[Ii]sn'?t this \w+[\?\.]?", ISNT_THAT_ALTERNATIVES, "isn't this X?"),
    (r"[Ii]sn'?t it \w+[\?\.]?", ISNT_THAT_ALTERNATIVES, "isn't it X?"),
    (r"[Ii]ncredible, isn'?t it[\?\.]?", ISNT_THAT_ALTERNATIVES, "incredible isn't it"),
    (r"[Bb]eautiful, isn'?t it[\?\.]?", ISNT_THAT_ALTERNATIVES, "beautiful isn't it"),
    (r"[Ff]ascinating, isn'?t it[\?\.]?", ISNT_THAT_ALTERNATIVES, "fascinating isn't it"),
]


def load_json_file(filepath):
    """Load a JSON file with UTF-8 encoding."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json_file(filepath, data):
    """Save a JSON file with UTF-8 encoding and nice formatting."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def replace_phrases_in_text(text, counters):
    """Replace all matched phrases with alternatives using regex."""
    for pattern, alternatives, name in REGEX_PATTERNS:
        # Get counter for this alternative list
        alt_id = id(alternatives)
        if alt_id not in counters:
            counters[alt_id] = [random.randint(0, 22)]

        def make_replacer(alts, counter):
            def replacer(match):
                idx = counter[0] % len(alts)
                counter[0] += 1
                return alts[idx]
            return replacer

        text = re.sub(pattern, make_replacer(alternatives, counters[alt_id]), text)

    return text


def process_text_recursive(obj, counters):
    """Recursively process all string values in a nested structure."""
    if isinstance(obj, str):
        return replace_phrases_in_text(obj, counters)
    elif isinstance(obj, dict):
        for key, value in obj.items():
            obj[key] = process_text_recursive(value, counters)
        return obj
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            obj[i] = process_text_recursive(item, counters)
        return obj
    else:
        return obj


def process_question(question, counters):
    """Process a single question, replacing phrases in all text fields."""
    # Process all fields recursively
    for key in question:
        question[key] = process_text_recursive(question[key], counters)
    return question


def process_json_file(filepath, counters, stats):
    """Process a single JSON question bank file."""
    data = load_json_file(filepath)

    # Process all text in the entire file recursively
    data = process_text_recursive(data, counters)

    save_json_file(filepath, data)
    stats['files_processed'] += 1


def find_question_banks(root_dir):
    """Find all question bank JSON files (not index files)."""
    banks = []
    for folder in Path(root_dir).iterdir():
        if folder.is_dir() and folder.name[0].isdigit():
            for json_file in folder.glob("*.json"):
                if "index" not in json_file.name:
                    banks.append(json_file)
    return sorted(banks)


def main():
    """Main function to process all question banks."""
    root_dir = Path(__file__).parent

    # Shared counters across all files to ensure variety
    counters = {}

    stats = {'files_processed': 0}

    # Find and process all question banks
    banks = find_question_banks(root_dir)
    print(f"Found {len(banks)} question bank files")

    for bank in banks:
        print(f"Processing: {bank.name}")
        process_json_file(bank, counters, stats)

    print(f"\nDone! Processed {stats['files_processed']} files")

    # Count total replacements per category
    print("\nReplacement counts by category:")
    for alt_list, name in [
        (HERES_WHERE_ALTERNATIVES, "here's where"),
        (LET_YOURSELF_ALTERNATIVES, "let yourself"),
        (WATCH_CLOSELY_ALTERNATIVES, "watch closely"),
        (STAY_CLOSE_ALTERNATIVES, "stay close"),
        (COME_WITH_ME_ALTERNATIVES, "come with me"),
        (ISNT_THAT_ALTERNATIVES, "isn't that"),
    ]:
        alt_id = id(alt_list)
        if alt_id in counters:
            count = counters[alt_id][0]
            print(f"  {name}: ~{count} replacements")


if __name__ == "__main__":
    main()
