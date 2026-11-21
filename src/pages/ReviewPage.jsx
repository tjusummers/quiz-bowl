import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllTossups, getSubjects } from '../content/index.js';
import TossupPlayer, { SPEEDS } from '../components/TossupPlayer.jsx';
import { useProgress } from '../hooks/useProgress.js';
import { dueQuestionIds, reviewQuestionIds, subjectStats, topicStats, MASTERED_BOX } from '../lib/srs.js';

const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);

export default function ReviewPage() {
  const allTossups = useMemo(() => getAllTossups(), []);
  const byId = useMemo(() => new Map(allTossups.map((t) => [t.id, t])), [allTossups]);
  const subjectNames = useMemo(() => new Map(getSubjects().map((s) => [s.id, s.name ?? s.id])), []);
  const { progress, record, reset } = useProgress();
  const [queue, setQueue] = useState(null);
  const [index, setIndex] = useState(0);
  const [right, setRight] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  // Snapshot "now" when the page renders so counts don't flicker.
  const [now] = useState(() => Date.now());
  const due = dueQuestionIds(progress, now).filter((id) => byId.has(id));
  const pile = reviewQuestionIds(progress).filter((id) => byId.has(id));
  const subjects = subjectStats(progress, allTossups, now);
  const topics = topicStats(progress, allTossups, now);

  function begin(ids) {
    setQueue(ids.map((id) => byId.get(id)));
    setIndex(0);
    setRight(0);
  }

  if (queue && index < queue.length) {
    return (
      <div className="review-page setup">
        <p className="scoreboard">
          Review {index + 1} of {queue.length} · {right} right so far
        </p>
        <TossupPlayer
          key={queue[index].id + index}
          tossup={queue[index]}
          wordMs={SPEEDS.normal}
          label={subjectNames.get(queue[index].subjectId)}
          onDone={(result) => {
            record(queue[index], result.correct);
            if (result.correct) setRight((r) => r + 1);
            setIndex((i) => i + 1);
          }}
        />
        <div>
          <button type="button" className="secondary" onClick={() => setQueue(null)}>Stop review</button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page setup">
      <h1>Review</h1>
      {queue && (
        <p className="scoreboard">
          Review done: {right} of {queue.length} right. Right answers move further out; misses come back tomorrow.
        </p>
      )}
      <p>
        Questions you miss come back for review: tomorrow, then after 2, 4 and 8 days each time you get them right. Get one
        right {MASTERED_BOX - 1} times in a row and it counts as mastered. A miss starts it over.
      </p>
      <div className="result-actions">
        <button type="button" onClick={() => begin(due)} disabled={due.length === 0}>
          {due.length === 0 ? 'Nothing due today' : `Review ${due.length} due ${due.length === 1 ? 'question' : 'questions'}`}
        </button>
        <button type="button" className="secondary" onClick={() => begin(pile)} disabled={pile.length === 0}>
          Practice all {pile.length} in the pile
        </button>
      </div>
      {pile.length === 0 && (
        <p>
          Nothing to review yet. <Link to="/quiz">Play a quiz</Link> and any questions you miss will show up here.
        </p>
      )}

      <h2>Progress by subject and topic</h2>
      <div className="table-wrap">
        <table className="progress-table">
          <thead>
            <tr>
              <th>Subject / topic</th>
              <th>Seen</th>
              <th>Accuracy</th>
              <th>To review</th>
              <th>Mastered</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <SubjectRows key={s.subjectId} s={s} name={subjectNames.get(s.subjectId)} topics={topics.filter((t) => t.subjectId === s.subjectId)} />
            ))}
          </tbody>
        </table>
      </div>

      <div>
        {confirmReset ? (
          <span className="result-actions">
            <span>Erase all progress on this device?</span>
            <button type="button" onClick={() => { reset(); setConfirmReset(false); }}>Yes, erase</button>
            <button type="button" className="secondary" onClick={() => setConfirmReset(false)}>Cancel</button>
          </span>
        ) : (
          <button type="button" className="secondary" onClick={() => setConfirmReset(true)}>Reset progress</button>
        )}
      </div>
      <p className="accept">Progress is saved in this browser only.</p>
    </div>
  );
}

function Row({ label, s, className }) {
  return (
    <tr className={className}>
      <td>{label}</td>
      <td>{s.seen} / {s.total}</td>
      <td>
        <span className="meter" aria-hidden="true"><span style={{ width: pct(s.accuracy ?? 0) }} /></span>
        {pct(s.accuracy)}
      </td>
      <td>{s.toReview}{s.due > 0 && ` (${s.due} due)`}</td>
      <td>{s.mastered}</td>
    </tr>
  );
}

function SubjectRows({ s, name, topics }) {
  return (
    <>
      <Row label={<strong>{name}</strong>} s={s} />
      {topics.map((t) => (
        <Row key={t.key} label={t.topic} s={t} className="topic-row" />
      ))}
    </>
  );
}
