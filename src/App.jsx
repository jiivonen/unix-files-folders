import { useRef, useState } from 'react'
import { createInitialState, displayPath, executeCommand, EXERCISES } from './fs/filesystem.js'
import FileTree from './components/FileTree.jsx'
import Terminal from './components/Terminal.jsx'
import ExercisePanel from './components/ExercisePanel.jsx'
import './App.css'

export default function App() {
  const [state, setState] = useState(() => createInitialState())
  const [lines, setLines] = useState(() => [
    { type: 'system', text: 'Unix Files & Folders — type commands below. Try pwd, ls, cd, mkdir.' },
  ])
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [exerciseMinimized, setExerciseMinimized] = useState(false)
  const inputRef = useRef(null)

  function handleSubmit(command) {
    const prompt = `${displayPath(state.cwd)}$ `
    const { state: nextState, output } = executeCommand(state, command)
    setState(nextState)

    const nextLines = [{ type: 'input', text: `${prompt}${command}` }]
    if (output) {
      nextLines.push({ type: 'output', text: output })
    }
    setLines((prev) => [...prev, ...nextLines])
  }

  function handleListCompletions(matches) {
    setLines((prev) => [...prev, { type: 'output', text: matches.join('  ') }])
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Unix Files &amp; Folders</h1>
      </header>

      <div className="workspace">
        <section className="tree-pane" aria-label="Filesystem tree">
          <div className="pane-label">Filesystem</div>
          <FileTree fs={state.fs} cwd={state.cwd} />
        </section>

        <ExercisePanel
          exercises={EXERCISES}
          index={exerciseIndex}
          minimized={exerciseMinimized}
          onToggleMinimize={() => setExerciseMinimized((v) => !v)}
          onPrev={() => setExerciseIndex((i) => Math.max(0, i - 1))}
          onNext={() => setExerciseIndex((i) => Math.min(EXERCISES.length - 1, i + 1))}
        />
      </div>

      <section className="terminal-pane" aria-label="Terminal" onClick={() => inputRef.current?.focus()}>
        <div className="pane-label">Terminal</div>
        <Terminal
          lines={lines}
          cwd={state.cwd}
          fs={state.fs}
          onSubmit={handleSubmit}
          onListCompletions={handleListCompletions}
          inputRef={inputRef}
        />
      </section>
    </div>
  )
}
