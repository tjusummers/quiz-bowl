// Loads every subject file in this folder (src/content/<subject>.json).
// See docs/CONTENT_FORMAT.md for the schema.

const modules = import.meta.glob('./*.json', { eager: true, import: 'default' });

// Display order on the home page; any subject not listed is appended alphabetically.
const ORDER = [
  'science',
  'history',
  'literature',
  'geography',
  'fine-arts',
  'math',
  'mythology',
  'current-events',
];

const subjects = Object.values(modules).sort((a, b) => {
  const ia = ORDER.indexOf(a.id);
  const ib = ORDER.indexOf(b.id);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  return a.name.localeCompare(b.name);
});

const byId = new Map(subjects.map((s) => [s.id, s]));

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export function getSubjects() {
  return subjects;
}

export function getSubject(id) {
  return byId.get(id);
}

export function getLesson(subjectId, lessonId) {
  return getSubject(subjectId)?.lessons.find((l) => l.id === lessonId);
}

/** Lessons of a subject grouped by topic, keeping the order topics first appear in the file. */
export function getLessonsByTopic(subjectId) {
  const groups = new Map();
  for (const lesson of getSubject(subjectId)?.lessons ?? []) {
    if (!groups.has(lesson.topic)) groups.set(lesson.topic, []);
    groups.get(lesson.topic).push(lesson);
  }
  return [...groups].map(([topic, lessons]) => ({ topic, lessons }));
}

/** Tossups and bonuses tied to one lesson. */
export function getQuestionsForLesson(subjectId, lessonId) {
  const s = getSubject(subjectId);
  return {
    tossups: (s?.tossups ?? []).filter((q) => q.lessonId === lessonId),
    bonuses: (s?.bonuses ?? []).filter((q) => q.lessonId === lessonId),
  };
}

/** Every tossup across all subjects, each with `subjectId` added. */
export function getAllTossups() {
  return subjects.flatMap((s) => (s.tossups ?? []).map((q) => ({ ...q, subjectId: s.id })));
}

/** Every bonus across all subjects, each with `subjectId` added. */
export function getAllBonuses() {
  return subjects.flatMap((s) => (s.bonuses ?? []).map((q) => ({ ...q, subjectId: s.id })));
}
