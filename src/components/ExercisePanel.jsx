function renderExerciseText(text) {
  const parts = text.split(/(`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>
    }
    return <span key={i}>{part}</span>
  })
}

export default function ExercisePanel({
  exercises,
  index,
  minimized,
  onToggleMinimize,
  onPrev,
  onNext,
}) {
  const total = exercises.length
  const current = exercises[index]

  return (
    <aside className={`exercise-panel${minimized ? ' exercise-panel--minimized' : ''}`}>
      <div className="exercise-header">
        <span className="exercise-title">Exercise {index + 1} / {total}</span>
        <button
          type="button"
          className="exercise-toggle"
          onClick={onToggleMinimize}
          aria-expanded={!minimized}
        >
          {minimized ? 'Show' : 'Minimize'}
        </button>
      </div>

      {!minimized && (
        <>
          <p className="exercise-body">{renderExerciseText(current)}</p>
          <div className="exercise-nav">
            <button type="button" onClick={onPrev} disabled={index === 0}>
              Previous
            </button>
            <button type="button" onClick={onNext} disabled={index === total - 1}>
              Next
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
