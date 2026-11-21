# Content format

All study material lives in `src/content/`, **one JSON file per subject**. The file name must match the subject `id`
(for example `src/content/science.json` has `"id": "science"`). The app picks up any new file automatically.

Run `npm run validate` after editing. It checks every rule below and runs as part of `npm run build` and CI.

## Subject file

```json
{
  "id": "science",
  "name": "Science",
  "icon": "🔬",
  "description": "One sentence shown on the subject card.",
  "lessons": [],
  "tossups": [],
  "bonuses": []
}
```

Current subject ids: `science`, `history`, `literature`, `geography`, `fine-arts`, `math`, `mythology`, `current-events`.

## Lessons

```json
{
  "id": "sci-cells",
  "title": "The Cell: Life’s Building Block",
  "topic": "Biology",
  "difficulty": "easy",
  "body": "Markdown text. Headings, **bold**, lists and tables all work.",
  "keyFacts": ["Short facts students should memorize."]
}
```

- `topic` groups lessons on the subject page. Topics appear in the order they first show up in the file.
- `difficulty` is `"easy"`, `"medium"` or `"hard"`.

## Tossups

```json
{
  "id": "sci-t-001",
  "topic": "Biology",
  "lessonId": "sci-cells",
  "difficulty": "easy",
  "question": "Full question text, hardest clue first, ending with “For 10 points, name…”",
  "powerIndex": 98,
  "answer": "mitochondria",
  "acceptable": ["mitochondrion"],
  "tags": ["organelles"]
}
```

- `powerIndex` is the character position in `question` where the power mark `(*)` goes (buzzing before it earns
  15 points). Use `null` when there is no power. Do **not** put `(*)` in the text itself.
- `acceptable` lists other answers to accept. Use `[]` if there are none.
- `lessonId` links the question to a lesson in the same file (it can be `null`).
- `tags` is optional.

## Bonuses

```json
{
  "id": "sci-b-001",
  "topic": "Chemistry",
  "lessonId": "sci-periodic-table",
  "difficulty": "easy",
  "leadin": "Answer these questions about the periodic table, for 10 points each.",
  "parts": [
    { "question": "…", "answer": "noble gases", "acceptable": ["inert gases"] }
  ],
  "tags": []
}
```

Standard bonuses have three parts worth 10 points each.

## Rules the validator checks

- Every `id` (lesson, tossup or bonus) is unique across **all** files. Suggested pattern: `<subject prefix>-<slug>`
  for lessons, `<prefix>-t-001` for tossups, `<prefix>-b-001` for bonuses.
- Required fields are present and non-empty, and `difficulty` is one of the three values.
- `lessonId` points to a lesson in the same file.
- `powerIndex` is `null` or a position inside `question`.

## Reading content in code

Import helpers from `src/content/index.js`: `getSubjects()`, `getSubject(id)`, `getLesson(subjectId, lessonId)`,
`getLessonsByTopic(subjectId)`, `getQuestionsForLesson(subjectId, lessonId)`, `getAllTossups()` and
`getAllBonuses()`. The last two add a `subjectId` field to each question.
