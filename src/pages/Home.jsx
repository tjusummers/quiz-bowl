import { Link } from 'react-router-dom';
import { getSubjects } from '../content/index.js';

export default function Home() {
  const subjects = getSubjects();
  return (
    <>
      <section className="hero">
        <h1>Learn quiz bowl, one topic at a time</h1>
        <p>
          Pick a subject, read a short lesson, memorize the key facts, then test yourself with real-style
          tossups and bonuses.
        </p>
      </section>
      <ul className="card-grid">
        {subjects.map((s) => {
          const topics = new Set(s.lessons.map((l) => l.topic)).size;
          return (
            <li key={s.id}>
              <Link to={`/subject/${s.id}`} className="card subject-card">
                <span className="subject-icon" aria-hidden="true">{s.icon}</span>
                <h2>{s.name}</h2>
                <p>{s.description}</p>
                <p className="meta">
                  {s.lessons.length} {s.lessons.length === 1 ? 'lesson' : 'lessons'} · {topics}{' '}
                  {topics === 1 ? 'topic' : 'topics'} · {(s.tossups?.length ?? 0) + (s.bonuses?.length ?? 0)} questions
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
