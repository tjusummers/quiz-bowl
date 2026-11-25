import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import { DIFFICULTIES, getLessonsByTopic, getSubject } from '../content/index.js';
import NotFound from './NotFound.jsx';
import { useState } from 'react';
import { useProgress } from '../hooks/useProgress.js';
import { lessonKey } from '../lib/progress.js';

export default function SubjectPage() {
  const { subjectId } = useParams();
  const subject = getSubject(subjectId);
  const [level, setLevel] = useState('all');
  const { progress } = useProgress();
  if (!subject) return <NotFound />;

  const groups = getLessonsByTopic(subjectId)
    .map((g) => ({ ...g, lessons: g.lessons.filter((l) => level === 'all' || l.difficulty === level) }))
    .filter((g) => g.lessons.length > 0);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Subjects', to: '/' }, { label: subject.name }]} />
      <header className="page-header">
        <h1>
          <span aria-hidden="true">{subject.icon}</span> {subject.name}
        </h1>
        <p>{subject.description}</p>
      </header>

      <div className="filter" role="group" aria-label="Filter by difficulty">
        {['all', ...DIFFICULTIES].map((d) => (
          <button key={d} type="button" aria-pressed={level === d} onClick={() => setLevel(d)}>
            {d === 'all' ? 'All levels' : d}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p className="empty">No lessons at this level yet.</p>}

      {groups.map(({ topic, lessons }) => (
        <section key={topic} className="topic-group">
          <h2>{topic}</h2>
          <ul className="lesson-list">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link to={`/subject/${subject.id}/lesson/${l.id}`} className="card lesson-card">
                  <span className="lesson-title">
                    {progress.lessons[lessonKey(subject.id, l.id)] && (
                      <span className="studied-mark" title="Studied">✓<span className="visually-hidden"> studied</span></span>
                    )}
                    {l.title}
                  </span>
                  <DifficultyBadge level={l.difficulty} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
