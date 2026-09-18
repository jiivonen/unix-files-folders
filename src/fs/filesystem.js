export const HOME = '/home/user';
export const USER = 'user';

export const COMMANDS = ['cd', 'ls', 'mkdir', 'pwd'];
const COMMAND_BINARIES = COMMANDS;

function defaultTimestamp() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 30, 0);
}

function makeDir(name, owner, children = {}) {
  return { type: 'dir', name, owner, children };
}

function makeFile(name, owner, { readable = true, size = 0 } = {}) {
  return { type: 'file', name, owner, readable, size };
}

export function createInitialFs() {
  const binChildren = Object.fromEntries(
    COMMAND_BINARIES.map((name) => [name, makeFile(name, 'root', { size: 1024 })])
  );

  return makeDir('', 'root', {
    home: makeDir('home', 'root', {
      root: makeDir('root', 'root', {}),
      user: makeDir('user', 'user', {
        cyber: makeDir('cyber', 'user', {
          'kyber.txt': makeFile('kyber.txt', 'user', { size: 42 }),
        }),
        '.bashrc': makeFile('.bashrc', 'user', { size: 128 }),
      }),
    }),
    bin: makeDir('bin', 'root', binChildren),
    log: makeDir('log', 'root', {
      'database.log': makeFile('database.log', 'root', { readable: false, size: 2048 }),
    }),
    data: makeDir('data', 'root', {
      'database.db': makeFile('database.db', 'root', { readable: false, size: 4096 }),
    }),
  });
}

export function createInitialState() {
  return {
    fs: createInitialFs(),
    cwd: HOME,
    timestamp: defaultTimestamp(),
  };
}

export function normalizePath(path, cwd) {
  let raw = path.trim();
  if (raw === '' || raw === '~') {
    raw = HOME;
  } else if (raw.startsWith('~/')) {
    raw = `${HOME}/${raw.slice(2)}`;
  } else if (!raw.startsWith('/')) {
    raw = `${cwd === '/' ? '' : cwd}/${raw}`;
  }

  const parts = raw.split('/').filter((p) => p.length > 0);
  const stack = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return '/' + stack.join('/');
}

export function pathSegments(path) {
  if (path === '/') return [];
  return path.split('/').filter(Boolean);
}

export function getNode(fs, path) {
  if (path === '/') return fs;
  let node = fs;
  for (const segment of pathSegments(path)) {
    if (!node || node.type !== 'dir' || !node.children[segment]) {
      return null;
    }
    node = node.children[segment];
  }
  return node;
}

export function parentPath(path) {
  if (path === '/') return '/';
  const segments = pathSegments(path);
  segments.pop();
  return segments.length === 0 ? '/' : '/' + segments.join('/');
}

export function isWritablePath(path) {
  return path === HOME || path.startsWith(`${HOME}/`);
}

export function canReadNode(node) {
  if (!node) return false;
  if (node.type === 'dir') return true;
  return node.readable !== false;
}

function cloneFs(fs) {
  return structuredClone(fs);
}

function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, ' ');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${mon} ${day} ${hh}:${mm}`;
}

function permissionString(node) {
  if (node.type === 'dir') {
    return 'drwxr-xr-x';
  }
  if (node.readable === false) {
    return '-rw-------';
  }
  return '-rw-r--r--';
}

function listNames(dirNode, { all = false } = {}) {
  return Object.keys(dirNode.children)
    .filter((name) => all || !name.startsWith('.'))
    .sort((a, b) => a.localeCompare(b));
}

function formatLongListing(names, dirNode, timestamp) {
  const lines = [`total ${names.length}`];
  for (const name of names) {
    const child = dirNode.children[name];
    const perms = permissionString(child);
    const owner = child.owner.padEnd(4, ' ');
    const size = String(child.type === 'dir' ? 4096 : child.size ?? 0).padStart(4, ' ');
    lines.push(`${perms} 1 ${owner} ${owner} ${size} ${formatDate(timestamp)} ${name}`);
  }
  return lines.join('\n');
}

function resolveTarget(state, pathArg) {
  const path = normalizePath(pathArg ?? '.', state.cwd);
  const node = getNode(state.fs, path);
  if (!node) {
    return { error: 'no such file' };
  }
  return { path, node };
}

export function executeCommand(state, input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { state, output: '' };
  }

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  switch (cmd) {
    case 'pwd':
      return { state, output: state.cwd };

    case 'cd': {
      const targetArg = args.length === 0 ? '~' : args[0];
      const path = normalizePath(targetArg, state.cwd);
      const node = getNode(state.fs, path);
      if (!node) {
        return { state, output: 'no such file' };
      }
      if (node.type !== 'dir') {
        return { state, output: 'not a directory' };
      }
      return { state: { ...state, cwd: path === '/' ? '/' : path.replace(/\/$/, '') || '/' }, output: '' };
    }

    case 'ls': {
      const flags = new Set();
      const pathArgs = [];
      for (const arg of args) {
        if (arg.startsWith('-') && arg.length > 1) {
          for (const ch of arg.slice(1)) flags.add(ch);
        } else {
          pathArgs.push(arg);
        }
      }

      const targetArg = pathArgs[0] ?? '.';
      const resolved = resolveTarget(state, targetArg);
      if (resolved.error) return { state, output: resolved.error };

      const { path, node } = resolved;

      if (node.type === 'file') {
        if (!canReadNode(node)) {
          return { state, output: 'permission denied' };
        }
        if (flags.has('l')) {
          return {
            state,
            output: formatLongListing([node.name], { children: { [node.name]: node } }, state.timestamp),
          };
        }
        return { state, output: node.name };
      }

      const names = listNames(node, { all: flags.has('a') });
      if (flags.has('l')) {
        return { state, output: formatLongListing(names, node, state.timestamp) };
      }
      return { state, output: names.join('  ') };
    }

    case 'mkdir': {
      if (args.length === 0) {
        return { state, output: 'no such file' };
      }
      const path = normalizePath(args[0], state.cwd);
      if (getNode(state.fs, path)) {
        return { state, output: 'File exists' };
      }
      const parent = parentPath(path);
      const parentNode = getNode(state.fs, parent);
      if (!parentNode) {
        return { state, output: 'no such file' };
      }
      if (parentNode.type !== 'dir') {
        return { state, output: 'not a directory' };
      }
      if (!isWritablePath(parent)) {
        return { state, output: 'permission denied' };
      }

      const name = pathSegments(path).at(-1);
      const nextFs = cloneFs(state.fs);
      const nextParent = getNode(nextFs, parent);
      nextParent.children[name] = makeDir(name, USER, {});
      return { state: { ...state, fs: nextFs }, output: '' };
    }

    default:
      return { state, output: `${cmd}: command not found` };
  }
}

export function displayPath(cwd) {
  if (cwd === HOME) return '~';
  if (cwd.startsWith(`${HOME}/`)) return `~${cwd.slice(HOME.length)}`;
  return cwd;
}

export const EXERCISES = [
  'Go to the home directory with `cd`',
  'Create a new folder named `example` with `mkdir example`',
  'Enter the `cyber` folder: `cd cyber`',
  'Create a new folder named `Cat_exercise` with `mkdir Cat_exercise`',
  'Go to the home directory with `cd`',
  'From the home directory, go into the `example` folder',
  'Go to the `Cat_exercise` folder inside `cyber`',
  'From `Cat_exercise`, go to the `example` folder in the home directory',
];
