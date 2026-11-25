import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import Markdown from '../components/Markdown.jsx';
import ReadButton from '../components/ReadButton.jsx';
import { getLesson, getQuestionsForLesson, getSubject } from '../content/index.js';
import useSectionReader from '../hooks/useSectionReader.js';
import { answerSpeech, markdownToSpeech, sentence, splitSections } from '../lib/lessonText.js';
import NotFound from './NotFound.jsx';

// Time to think before the answer is read out.
const ANSWER_PAUSE_MS = 2000;

export default function LessonPage() {
  const { subjectId, lessonId } = useParams();
  const subject = getSubject(subjectId);
  const lesson = getLesson(subjectId, lessonId);
  const reader = useSectionReader();
  const { stop } = reader;
  const sections = useMemo(() => splitSections(lesson?.body), [lesson]);
  const answerRefs = useRef(new Map());

  // Moving to another lesson stops any reading.
  useEffect(() => stop, [subjectId, lessonId, stop]);

  if (!subject || !lesson) return <NotFound />;

  const { tossups, bonuses } = getQuestionsForLesson(subjectId, lessonId);
  const idx = subject.lessons.indexOf(lesson);
  const prev = subject.lessons[idx - 1];
  const next = subject.lessons[idx + 1];

  // Opens a question's answer (a <details>) just before its answer is read.
  const reveal = (key) => () => {
    const el = answerRefs.current.get(key);
    if (el) el.open = true;
  };
  const setAnswerRef = (key) => (el) => {
    if (el) answerRefs.current.set(key, el);
    else answerRefs.current.delete(key);
  };

  const tossupSteps = (q, n) => [
    { text: `Tossup${n ? ` ${n}` : ''}. ${sentence(q.question)}` },
    { text: answerSpeech(q.answer, q.acceptable), pause: ANSWER_PAUSE_MS, before: reveal(q.id) },
  ];
  const bonusSteps = (b) => [
    { text: `Bonus. ${sentence(b.leadin)}` },
    ...b.parts.flatMap((p, i) => [
      { text: `Part ${i + 1}. ${sentence(p.question)}`, pause: 400 },
      { text: answerSpeech(p.answer, p.acceptable), pause: ANSWER_PAUSE_MS, before: reveal(`${b.id}-${i}`) },
    ]),
  ];
  const allPracticeSteps = () => [
    ...tossups.flatMap((q, i) => tossupSteps(q, i + 1).map((st, j) => (j === 0 && i > 0 ? { ...st, pause: 800 } : st))),
    ...bonuses.flatMap((b) => bonusSteps(b).map((st, j) => (j === 0 ? { ...st, pause: 800 } : st))),
  ];

  return (
    <article className="lesson">
      <Breadcrumbs
        items={[
          { label: 'Subjects', to: '/' },
          { label: subject.name, to: `/subject/${subject.id}` },
          { label: lesson.title },
        ]}
      />
      <header className="page-header">
        <p className="eyebrow">{lesson.topic}</p>
        <h1>{lesson.title}</h1>
        <DifficultyBadge level={lesson.difficulty} />
      </header>

      {sections.map((sec, i) => (
        <section key={`${lesson.id}-${i}`} className="lesson-section">
          {sec.title ? (
            <div className="section-head">
              <h2>{sec.title}</h2>
              <ReadButton
                reader={reader}
                id={`section-${i}`}
                label={`“${sec.title}”`}
                getSteps={() => [{ text: `${sentence(sec.title)} ${markdownToSpeech(sec.source)}` }]}
              />
            </div>
          ) : (
            <div className="section-head untitled">
              <ReadButton
                reader={reader}
                id={`section-${i}`}
                label="this part"
                getSteps={() => [{ text: markdownToSpeech(sec.source) }]}
              />
            </div>
          )}
          <Markdown source={sec.source} />
        </section>
      ))}

      {lesson.keyFacts?.length > 0 && (
        <section className="key-facts">
          <div className="section-head">
            <h2>Key facts to remember</h2>
            <ReadButton
              reader={reader}
              id="key-facts"
              label="the key facts"
              getSteps={() => [{ text: `Key facts to remember. ${lesson.keyFacts.map(sentence).join(' ')}` }]}
            />
          </div>
          <ul>
            {lesson.keyFacts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      {(tossups.length > 0 || bonuses.length > 0) && (
        <section className="practice">
          <div className="section-head">
            <h2>Try it yourself</h2>
            <ReadButton reader={reader} id="practice" label="all practice questions" getSteps={allPracticeSteps} />
          </div>
          {tossups.map((q) => (
            <details key={q.id} className="card question" ref={setAnswerRef(q.id)}>
              <summary>
                <span className="q-head">
                  <span className="q-kind">Tossup</span>
                  <ReadButton reader={reader} id={q.id} label="this tossup" getSteps={() => tossupSteps(q)} />
                </span>
                <PowerText question={q.question} powerIndex={q.powerIndex} />
              </summary>
              <Answer answer={q.answer} acceptable={q.acceptable} />
            </details>
          ))}
          {bonuses.map((b) => (
            <div key={b.id} className="card question bonus">
              <p>
                <span className="q-head">
                  <span className="q-kind">Bonus</span>
                  <ReadButton reader={reader} id={b.id} label="this bonus" getSteps={() => bonusSteps(b)} />
                </span>
                {b.leadin}
              </p>
              {b.parts.map((p, i) => (
                <details key={i} ref={setAnswerRef(`${b.id}-${i}`)}>
                  <summary>
                    <strong>[{i + 1}]</strong> {p.question}
                  </summary>
                  <Answer answer={p.answer} acceptable={p.acceptable} />
                </details>
              ))}
            </div>
          ))}
        </section>
      )}

      <nav className="lesson-nav" aria-label="Lesson navigation">
        {prev ? <Link to={`/subject/${subject.id}/lesson/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next ? <Link to={`/subject/${subject.id}/lesson/${next.id}`}>{next.title} →</Link> : <span />}
      </nav>
    </article>
  );
}

function PowerText({ question, powerIndex }) {
  if (powerIndex == null) return <span>{question}</span>;
  return (
    <span>
      <strong className="power">{question.slice(0, powerIndex)}</strong>
      <span className="power-mark" title="Buzz before here for power">(*)</span>
      {question.slice(powerIndex)}
    </span>
  );
}

function Answer({ answer, acceptable }) {
  return (
    <p className="answer">
      ANSWER: <strong>{answer}</strong>
      {acceptable?.length > 0 && <span className="accept"> (accept {acceptable.join(', ')})</span>}
    </p>
  );
}
