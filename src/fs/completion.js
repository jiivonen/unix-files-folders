import { COMMANDS, getNode, HOME, normalizePath, parentPath } from './filesystem.js'

function commonPrefix(strings) {
  if (strings.length === 0) return ''
  let prefix = strings[0]
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1)
      if (!prefix) return ''
    }
  }
  return prefix
}

function completeFromList(partial, candidates) {
  const matches = candidates
    .filter((c) => c.startsWith(partial))
    .sort((a, b) => a.localeCompare(b))
  if (matches.length === 0) {
    return { replacement: partial, matches: [] }
  }
  return { replacement: commonPrefix(matches), matches }
}

function splitCompletable(input) {
  const match = input.match(/^(.*?)(\S*)$/)
  const before = match[1]
  const token = match[2]
  const tokensBefore = before.trim() === '' ? [] : before.trim().split(/\s+/)
  return { before, token, tokensBefore }
}

function basenameList(matches) {
  return matches.map((m) => {
    const cleaned = m.replace(/\/$/, '')
    const parts = cleaned.split('/')
    return parts[parts.length - 1] || m
  })
}

function completeCommand(token) {
  const { replacement, matches } = completeFromList(token, COMMANDS)
  if (matches.length === 1) {
    return { completedToken: `${matches[0]} `, matches }
  }
  return { completedToken: replacement, matches }
}

function completePath(fs, cwd, token, dirsOnly) {
  let dirDisplay
  let namePartial
  let lookupDir

  if (token.startsWith('~/') || token === '~') {
    if (token === '~') {
      return { completedToken: '~/', matches: ['~'] }
    }
    const rest = token.slice(2)
    const slash = rest.lastIndexOf('/')
    if (slash === -1) {
      dirDisplay = '~/'
      namePartial = rest
      lookupDir = HOME
    } else {
      dirDisplay = `~/${rest.slice(0, slash + 1)}`
      namePartial = rest.slice(slash + 1)
      lookupDir = normalizePath(`~/${rest.slice(0, slash)}`, cwd)
    }
  } else if (token.startsWith('/')) {
    if (token === '/') {
      dirDisplay = '/'
      namePartial = ''
      lookupDir = '/'
    } else if (token.endsWith('/')) {
      dirDisplay = token
      namePartial = ''
      lookupDir = normalizePath(token, cwd)
    } else {
      const parent = parentPath(token)
      dirDisplay = parent === '/' ? '/' : `${parent}/`
      namePartial = token.slice(token.lastIndexOf('/') + 1)
      lookupDir = parent
    }
  } else {
    const slash = token.lastIndexOf('/')
    if (slash === -1) {
      dirDisplay = ''
      namePartial = token
      lookupDir = cwd
    } else {
      dirDisplay = token.slice(0, slash + 1)
      namePartial = token.slice(slash + 1)
      lookupDir = normalizePath(token.slice(0, slash) || '.', cwd)
    }
  }

  const dirNode = getNode(fs, lookupDir)
  if (!dirNode || dirNode.type !== 'dir') {
    return { completedToken: token, matches: [] }
  }

  let names = Object.keys(dirNode.children).sort((a, b) => a.localeCompare(b))
  if (dirsOnly) {
    names = names.filter((n) => dirNode.children[n].type === 'dir')
  }

  const { replacement, matches } = completeFromList(namePartial, names)
  if (matches.length === 0) {
    return { completedToken: token, matches: [] }
  }

  if (matches.length === 1) {
    const name = matches[0]
    const node = dirNode.children[name]
    const suffix = node.type === 'dir' ? '/' : ' '
    return {
      completedToken: `${dirDisplay}${name}${suffix}`,
      matches,
    }
  }

  return {
    completedToken: `${dirDisplay}${replacement}`,
    matches,
  }
}

/**
 * @returns {{ value: string, listings: string[] | null }}
 */
export function tabComplete(fs, cwd, input) {
  const { before, token, tokensBefore } = splitCompletable(input)

  if (tokensBefore.length === 0) {
    const { completedToken, matches } = completeCommand(token)
    const value = before + completedToken
    return {
      value,
      listings: matches.length > 1 && value === input ? matches : null,
    }
  }

  if (token.startsWith('-')) {
    return { value: input, listings: null }
  }

  const dirsOnly = tokensBefore[0] === 'cd'
  const { completedToken, matches } = completePath(fs, cwd, token, dirsOnly)
  const value = before + completedToken

  return {
    value,
    listings: matches.length > 1 && value === input ? basenameList(matches) : null,
  }
}
