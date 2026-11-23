import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllTossups, getSubjects } from '../content/index.js';
import { deleteAccount, signOut, useAuth } from '../hooks/useAuth.js';
import { flushProgress, useProgress } from '../hooks/useProgress.js';
import { lessonKey } from '../lib/progress.js';
import { dueQuestionIds, MASTERED_BOX, reviewQuestionIds } from '../lib/srs.js';
import { friendlyAuthError } from '../lib/account.js';
import '../components/quiz.css';

const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);
const SYNC_TEXT = {
  loading: 'Loading your saved progress…',
  saving: 'Saving…',
  saved: 'All progress saved to your account.',
  error: 'Could not reach the server. Progress is kept on this computer and will save when you’re back online.',
};

export default function ProgressPage() {
  const auth = useAuth();
  const { progress, sync } = useProgress();
  const subjects = getSubjects();
  const tossups = useMemo(() => getAllTossups(), []);
  const [now] = useState(() => Date.now());

  const lessonRows = subjects.map((s) => {
    const studied = s.lessons.filter((l) => progress.lessons[lessonKey(s.id, l.id)]).length;
    return { id: s.id, name: s.name, icon: s.icon, studied, total: s.lessons.length };
  });
  const lessonsStudied = lessonRows.reduce((n, r) => n + r.studied, 0);
  const lessonsTotal = lessonRows.reduce((n, r) => n + r.total, 0);

  const entries = Object.values(progress.questions);
  const attempts = entries.reduce((n, e) => n + e.attempts, 0);
  const correct = entries.reduce((n, e) => n + e.correct, 0);
  const mastered = entries.filter((e) => e.box >= MASTERED_BOX).length;
  const known = new Set(tossups.map((t) => t.id));
  const due = dueQuestionIds(progress, now).filter((id) => known.has(id)).length;
  const pile = reviewQuestionIds(progress).filter((id) => known.has(id)).length;

  const rounds = progress.quizzes;
  const best = rounds.length ? Math.max(...rounds.map((r) => r.points)) : null;
  const recent = [...rounds].reverse().slice(0, 10);

  return (
    <div className="progress-page">
      <h1>{auth.status === 'signedIn' ? `${auth.user.username}’s progress` : 'My progress'}</h1>
      <AccountBox auth={auth} sync={sync} />

      <div className="stat-tiles">
        <Tile value={`${lessonsStudied} / ${lessonsTotal}`} label="Lessons studied" />
        <Tile value={rounds.length} label="Quiz rounds played" />
        <Tile value={best ?? '–'} label="Best quiz score" />
        <Tile value={pct(attempts ? correct / attempts : null)} label="Questions answered right" />
        <Tile value={mastered} label="Questions mastered" />
        <Tile value={due} label={`Due for review (${pile} in pile)`} />
      </div>

      {due > 0 && (
        <p>
          You have {due} {due === 1 ? 'question' : 'questions'} to review today. <Link to="/review">Start review</Link>
        </p>
      )}

      <h2>Lessons by subject</h2>
      <div className="table-wrap">
        <table className="progress-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Studied</th>
            </tr>
          </thead>
          <tbody>
            {lessonRows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/subject/${r.id}`}>
                    <span aria-hidden="true">{r.icon}</span> {r.name}
                  </Link>
                </td>
                <td>
                  <span className="meter" aria-hidden="true">
                    <span style={{ width: pct(r.total ? r.studied / r.total : 0) }} />
                  </span>
                  {r.studied} / {r.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Recent quiz rounds</h2>
      {recent.length === 0 ? (
        <p>
          No rounds yet. <Link to="/quiz">Play a quiz</Link> and your scores will show up here.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="progress-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Score</th>
                <th>Powers</th>
                <th>Tens</th>
                <th>Negs</th>
                <th>Missed</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.at}>
                  <td>{new Date(r.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                  <td><strong>{r.points}</strong> <span className="accept">({r.total} q)</span></td>
                  <td>{r.power}</td>
                  <td>{r.correct}</td>
                  <td>{r.neg}</td>
                  <td>{r.missed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>
        For accuracy by subject and topic, see <Link to="/review">Review</Link>.
      </p>
      {auth.status === 'signedIn' && <AccountActions />}
    </div>
  );
}

function Tile({ value, label }) {
  return (
    <div className="stat-tile">
      <span className="value">{value}</span>
      <span className="label">{label}</span>
    </div>
  );
}

function AccountBox({ auth, sync }) {
  if (auth.status === 'disabled') return <p className="sync-status">Progress is saved in this browser only.</p>;
  if (auth.status === 'loading') return <p className="sync-status">Checking your account…</p>;
  if (auth.status === 'signedOut') {
    return (
      <p className="notice">
        You’re not signed in, so this progress lives only in this browser. <Link to="/account">Sign in or create an account</Link>{' '}
        to save it and see it on any computer.
      </p>
    );
  }
  return <p className="sync-status" role="status">{SYNC_TEXT[sync] ?? ''}</p>;
}

function AccountActions() {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await flushProgress();
    await signOut();
    navigate('/');
  }

  async function handleDelete() {
    setBusy(true);
    setError('');
    try {
      await deleteAccount();
      navigate('/');
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  return (
    <div className="account-actions">
      <button type="button" className="secondary" onClick={handleSignOut} disabled={busy}>Sign out</button>
      {confirmDelete ? (
        <>
          <span>Delete your account and all saved progress? This can’t be undone.</span>
          <button type="button" className="danger" onClick={handleDelete} disabled={busy}>Yes, delete</button>
          <button type="button" className="secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </>
      ) : (
        <button type="button" className="secondary" onClick={() => setConfirmDelete(true)}>Delete account</button>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
