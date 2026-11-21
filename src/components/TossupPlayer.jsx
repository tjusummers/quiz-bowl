import { useEffect, useMemo, useRef, useState } from 'react';
import { tokenize, scoreBuzz } from '../lib/scoring.js';
import { checkAnswer } from '../lib/answer.js';
import './quiz.css';

export const SPEEDS = { slow: 450, normal: 300, fast: 180 };
const BUZZ_WINDOW_MS = 5000; // time to buzz after the question ends
const ANSWER_MS = 8000; // time to type an answer after buzzing

/**
 * Reads one tossup word by word. The player buzzes (Space or the Buzz button),
 * types an answer before the timer runs out, and sees the result.
 * Calls onDone({ correct, points, kind, buzzed }) when they move on.
 */
export default function TossupPlayer({ tossup, wordMs = SPEEDS.normal, onDone, label }) {
  const { words, powerIndex } = useMemo(() => tokenize(tossup.question, tossup.powerIndex), [tossup]);
  const [phase, setPhase] = useState('reading'); // reading | waiting | buzzed | answered
  const [shown, setShown] = useState(0);
  const [buzzAt, setBuzzAt] = useState(null);
  const [response, setResponse] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const nextRef = useRef(null);

  // Reset when the question changes.
  useEffect(() => {
    setPhase('reading');
    setShown(0);
    setBuzzAt(null);
    setResponse('');
    setDeadline(null);
    setResult(null);
  }, [tossup]);

  // Reveal words.
  useEffect(() => {
    if (phase !== 'reading') return;
    if (shown >= words.length) {
      setPhase('waiting');
      setDeadline(Date.now() + BUZZ_WINDOW_MS);
      return;
    }
    const t = setTimeout(() => setShown((n) => n + 1), wordMs);
    return () => clearTimeout(t);
  }, [phase, shown, words.length, wordMs]);

  // Countdown clock for the buzz window and answer timer.
  useEffect(() => {
    if (deadline == null) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    setNow(Date.now());
    return () => clearInterval(t);
  }, [deadline]);

  const remaining = deadline == null ? 0 : Math.max(0, deadline - now);

  useEffect(() => {
    if (deadline == null || remaining > 0) return;
    if (phase === 'waiting') finish(null);
    else if (phase === 'buzzed') finish(response);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, deadline, phase]);

  function buzz() {
    if (phase !== 'reading' && phase !== 'waiting') return;
    setBuzzAt(shown);
    setPhase('buzzed');
    setDeadline(Date.now() + ANSWER_MS);
  }

  function finish(answer) {
    const buzzed = answer !== null;
    const correct = buzzed && checkAnswer(answer, tossup.answer, tossup.acceptable ?? []);
    const score = buzzed
      ? scoreBuzz({ correct, wordsRevealed: buzzAt ?? shown, totalWords: words.length, powerIndex })
      : { points: 0, kind: 'dead' };
    setResult({ correct, buzzed, ...score });
    setShown(words.length);
    setDeadline(null);
    setPhase('answered');
  }

  function override() {
    const score = scoreBuzz({ correct: true, wordsRevealed: buzzAt ?? words.length, totalWords: words.length, powerIndex });
    setResult({ ...result, correct: true, overridden: true, ...score });
  }

  // Keyboard: Space buzzes; Enter moves on after the answer is shown.
  useEffect(() => {
    function onKey(e) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space' && (phase === 'reading' || phase === 'waiting')) {
        e.preventDefault();
        buzz();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (phase === 'buzzed') inputRef.current?.focus();
    if (phase === 'answered') nextRef.current?.focus();
  }, [phase]);

  const timerTotal = phase === 'buzzed' ? ANSWER_MS : BUZZ_WINDOW_MS;

  return (
    <div className="tossup">
      <div className="tossup-meta">
        {label && <span>{label}</span>}
        <span className="tossup-topic">{tossup.topic}</span>
      </div>

      <p className="tossup-text" aria-live="off">
        {words.slice(0, shown).map((w, i) => (
          <span key={i} className={i < powerIndex ? 'word power' : 'word'}>
            {w}
            {buzzAt != null && i === buzzAt - 1 && phase === 'answered' && <span className="buzz-mark" title="You buzzed here">🔔</span>}{' '}
          </span>
        ))}
      </p>

      {(phase === 'waiting' || phase === 'buzzed') && (
        <div className="timer" role="timer" aria-label={`${Math.ceil(remaining / 1000)} seconds left`}>
          <div className="timer-bar" style={{ width: `${(remaining / timerTotal) * 100}%` }} />
          <span className="timer-label">{Math.ceil(remaining / 1000)}s</span>
        </div>
      )}

      {(phase === 'reading' || phase === 'waiting') && (
        <button type="button" className="buzz-button" onClick={buzz}>
          Buzz <kbd>Space</kbd>
        </button>
      )}

      {phase === 'buzzed' && (
        <form
          className="answer-form"
          onSubmit={(e) => {
            e.preventDefault();
            finish(response);
          }}
        >
          <input
            ref={inputRef}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your answer and press Enter"
            aria-label="Your answer"
            autoComplete="off"
          />
          <button type="submit">Answer</button>
        </form>
      )}

      {phase === 'answered' && result && (
        <div className={`result result-${result.correct ? 'right' : 'wrong'}`}>
          <p className="result-head">
            {result.kind === 'dead' && 'No buzz.'}
            {result.kind === 'power' && 'Power! +15'}
            {result.kind === 'correct' && 'Correct! +10'}
            {result.kind === 'neg' && 'Incorrect, interrupted early: −5'}
            {result.kind === 'wrong' && 'Incorrect. 0'}
            {result.overridden && ' (marked correct)'}
          </p>
          {result.buzzed && <p>You said: <strong>{response || '(nothing)'}</strong></p>}
          <p>
            Answer: <strong>{tossup.answer}</strong>
            {tossup.acceptable?.length > 0 && <span className="accept"> (also: {tossup.acceptable.join(', ')})</span>}
          </p>
          <div className="result-actions">
            {result.buzzed && !result.correct && (
              <button type="button" className="secondary" onClick={override}>
                I was right
              </button>
            )}
            <button type="button" ref={nextRef} onClick={() => onDone(result)}>
              Next <kbd>Enter</kbd>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
