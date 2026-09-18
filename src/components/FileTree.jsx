export default function FileTree({ fs, cwd }) {
  const normalizedCwd = cwd === '/' ? '/' : cwd.replace(/\/$/, '')

  return (
    <div className="file-tree">
      <TreeNode node={fs} path="/" cwd={normalizedCwd} depth={0} />
    </div>
  )
}

function TreeNode({ node, path, cwd, depth }) {
  const isCwd = path === cwd
  const isDir = node.type === 'dir'
  const kids = isDir
    ? Object.keys(node.children).sort((a, b) => {
        const aHidden = a.startsWith('.')
        const bHidden = b.startsWith('.')
        if (aHidden !== bHidden) return aHidden ? 1 : -1
        return a.localeCompare(b)
      })
    : []

  const label = path === '/' ? '/' : node.name

  return (
    <div className="tree-branch">
      <div
        className={[
          'tree-row',
          isCwd ? 'tree-row--cwd' : '',
          isDir ? 'tree-row--dir' : 'tree-row--file',
          node.readable === false ? 'tree-row--denied' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ paddingLeft: `${0.35 + depth * 1.05}rem` }}
      >
        <span className="tree-marker" aria-hidden="true">
          {isDir ? '▾' : '·'}
        </span>
        <span className="tree-name">{label}</span>
      </div>
      {kids.map((name) => {
        const childPath = path === '/' ? `/${name}` : `${path}/${name}`
        return (
          <TreeNode
            key={childPath}
            node={node.children[name]}
            path={childPath}
            cwd={cwd}
            depth={depth + 1}
          />
        )
      })}
    </div>
  )
}
