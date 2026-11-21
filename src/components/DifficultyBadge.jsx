export default function DifficultyBadge({ level }) {
  return <span className={`badge badge-${level}`}>{level}</span>;
}
