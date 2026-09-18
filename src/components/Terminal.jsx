import { useEffect, useRef, useState } from 'react'
import { displayPath, USER } from '../fs/filesystem.js'

export default function Terminal({ lines, cwd, onSubmit, inputRef }) {
  const [value, setValue] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const command = value
      setValue('')
      onSubmit(command)
    }
  }

  const prompt = `${USER}@unix:${displayPath(cwd)}$`

  return (
    <div className="terminal" ref={scrollRef}>
      {lines.map((line, i) => (
        <pre key={i} className={`terminal-line terminal-line--${line.type}`}>
          {line.text}
        </pre>
      ))}
      <div className="terminal-input-row">
        <span className="terminal-prompt">{prompt}</span>
        <input
          ref={inputRef}
          className="terminal-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Command input"
          autoFocus
        />
      </div>
    </div>
  )
}
