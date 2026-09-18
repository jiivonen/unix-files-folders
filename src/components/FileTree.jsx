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
  // Directories always; files only when this node is the current directory
  const kids = isDir
    ? Object.keys(node.children)
        .filter((name) => {
          const child = node.children[name]
          return child.type === 'dir' || isCwd
        })
        .sort((a, b) => {
          const aDir = node.children[a].type === 'dir'
          const bDir = node.children[b].type === 'dir'
          if (aDir !== bDir) return aDir ? -1 : 1
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
