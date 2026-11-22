import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllTossups, getSubjects } from '../content/index.js';
import TossupPlayer, { SPEEDS } from '../components/TossupPlayer.jsx';
import { useProgress } from '../hooks/useProgress.js';

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const emptyTally = { points: 0, power: 0, correct: 0, neg: 0, wrong: 0, dead: 0 };

export default function QuizPage() {
  const subjects = getSubjects();
  const allTossups = useMemo(() => getAllTossups(), []);
  const { record } = useProgress();

  const [chosen, setChosen] = useState(() => new Set(subjects.map((s) => s.id)));
  const [count, setCount] = useState(10);
  const [speed, setSpeed] = useState('normal');
  const [queue, setQueue] = useState(null);
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState(emptyTally);
  const [missed, setMissed] = useState([]);

  const pool = allTossups.filter((t) => chosen.has(t.subjectId));

  function start() {
    setQueue(shuffle(pool).slice(0, count));
    setIndex(0);
    setTally(emptyTally);
    setMissed([]);
  }

  function handleDone(result) {
    const tossup = queue[index];
    record(tossup, result.correct);
    setTally((t) => ({ ...t, points: t.points + result.points, [result.kind]: t[result.kind] + 1 }));
    if (!result.correct) setMissed((m) => [...m, tossup]);
    setIndex((i) => i + 1);
  }

  function toggle(id) {
    setChosen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (!queue) {
    return (
      <div className="quiz-page setup">
        <h1>Buzzer quiz</h1>
        <p>
          Questions appear one word at a time, just like a real match. Press <kbd>Space</kbd> or the Buzz button as soon as
          you know the answer. Buzz in before the bold part ends for a <strong>power</strong> (15 points). A correct answer
          after that is 10, and a wrong answer while the question is still being read costs 5.
        </p>
        <p>
          Questions are read aloud, like a real moderator, so turn your sound up. Use the Sound button above each question
          to turn the voice off or back on.
        </p>
        <fieldset>
          <legend>Subjects</legend>
          {subjects.map((s) => (
            <label key={s.id}>
              <input type="checkbox" checked={chosen.has(s.id)} onChange={() => toggle(s.id)} /> {s.name ?? s.id}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Questions</legend>
          {[5, 10, 20].map((n) => (
            <label key={n}>
              <input type="radio" name="count" checked={count === n} onChange={() => setCount(n)} /> {n}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Reading speed</legend>
          {Object.keys(SPEEDS).map((k) => (
            <label key={k}>
              <input type="radio" name="speed" checked={speed === k} onChange={() => setSpeed(k)} /> {k}
            </label>
          ))}
        </fieldset>
        <div>
          <button type="button" onClick={start} disabled={pool.length === 0}>
            Start ({Math.min(count, pool.length)} questions)
          </button>
        </div>
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div className="quiz-page setup">
        <h1>Round over</h1>
        <Scoreboard tally={tally} />
        {missed.length > 0 ? (
          <>
            <p>These went into your review pile. They will come back tomorrow, and again later until you know them.</p>
            <ul className="missed-list">
              {missed.map((t) => (
                <li key={t.id}>
                  <strong>{t.answer}</strong> <span className="accept">({t.topic})</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Perfect round, nothing to review!</p>
        )}
        <div className="result-actions">
          <button type="button" onClick={start}>Play again</button>
          <button type="button" className="secondary" onClick={() => setQueue(null)}>Change settings</button>
          <Link to="/review">Go to review</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page setup">
      <Scoreboard tally={tally} />
      <TossupPlayer
        key={queue[index].id + index}
        tossup={queue[index]}
        wordMs={SPEEDS[speed]}
        onDone={handleDone}
        label={`Question ${index + 1} of ${queue.length}`}
      />
    </div>
  );
}

export function Scoreboard({ tally }) {
  return (
    <div className="scoreboard" aria-label="Score">
      <span>Score <strong>{tally.points}</strong></span>
      <span>Powers {tally.power}</span>
      <span>Tens {tally.correct}</span>
      <span>Negs {tally.neg}</span>
      <span>Missed {tally.wrong + tally.dead}</span>
    </div>
  );
}
