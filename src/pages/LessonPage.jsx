import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import Markdown from '../components/Markdown.jsx';
import { getLesson, getQuestionsForLesson, getSubject } from '../content/index.js';
import NotFound from './NotFound.jsx';

export default function LessonPage() {
  const { subjectId, lessonId } = useParams();
  const subject = getSubject(subjectId);
  const lesson = getLesson(subjectId, lessonId);
  if (!subject || !lesson) return <NotFound />;

  const { tossups, bonuses } = getQuestionsForLesson(subjectId, lessonId);
  const idx = subject.lessons.indexOf(lesson);
  const prev = subject.lessons[idx - 1];
  const next = subject.lessons[idx + 1];

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

      <Markdown source={lesson.body} />

      {lesson.keyFacts?.length > 0 && (
        <section className="key-facts">
          <h2>Key facts to remember</h2>
          <ul>
            {lesson.keyFacts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      {(tossups.length > 0 || bonuses.length > 0) && (
        <section className="practice">
          <h2>Try it yourself</h2>
          {tossups.map((q) => (
            <details key={q.id} className="card question">
              <summary>
                <span className="q-kind">Tossup</span>
                <PowerText question={q.question} powerIndex={q.powerIndex} />
              </summary>
              <Answer answer={q.answer} acceptable={q.acceptable} />
            </details>
          ))}
          {bonuses.map((b) => (
            <div key={b.id} className="card question bonus">
              <p>
                <span className="q-kind">Bonus</span>
                {b.leadin}
              </p>
              {b.parts.map((p, i) => (
                <details key={i}>
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
