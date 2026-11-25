/** Small Read / Stop button for one lesson section. */
export default function ReadButton({ reader, id, label = 'this section', getSteps }) {
  if (!reader.supported) return null;
  const on = reader.activeId === id;
  return (
    <button
      type="button"
      className={`read-button${on ? ' reading' : ''}`}
      aria-pressed={on}
      title={on ? 'Stop reading' : `Read ${label} aloud`}
      onClick={(e) => {
        // Inside a <summary>, don't open or close the question.
        e.preventDefault();
        e.stopPropagation();
        reader.toggle(id, getSteps);
      }}
    >
      {on ? '⏹ Stop' : '🔊 Read'}
    </button>
  );
}
