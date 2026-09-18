# Unix Files & Folders

A web app for students to learn the Unix command line, files, and folders.

## Tech

- Single-page app: **Vite + React** (no TypeScript)
- No backend after the initial load of HTML, CSS, JS, and images
- **localStorage**: deferred to a later version
- UI language: English now; Finnish later

## Layout

1. **Tree (top)** — Passive file/folder tree, similar to Windows File Explorer. View only; no click-to-navigate.
2. **Terminal (bottom)** — Students type commands and see Unix-like output. Changes are reflected in the tree.
3. **Exercise popup (top right)** — Shows the current task. Can be minimized so the tree uses the full top area.

## Supported commands

| Command | Behavior |
| --- | --- |
| `pwd` | Print the current working directory |
| `cd` | Change directory |
| `ls` | List contents of the current directory |
| `ls -a` | Like `ls`, including hidden files (names starting with `.`) |
| `ls -l` | Long listing; metadata comes from the filesystem model below |
| `mkdir` | Create a directory (only where the user has write permission) |

**Later:** `rm`, `touch`, `cat`

## Paths and errors

- `~` is an alias for the user’s home directory (`/home/user/`)
- Bare `cd` (no arguments) is the same as `cd ~`
- Supported: `.`, `..`, absolute paths, relative paths
- Errors:
  - `no such file` — invalid path
  - `not a directory` — path exists but is not a directory when one is required
  - `permission denied` — missing read or write permission

## Permissions

- Read access in every directory
- Write access only under `/home/user/` (and its subdirectories)
- No read access to `/log/database.log` or `/data/database.db`

## Filesystem

- Logged in as user `user`
- Initial working directory: `/home/user/`
- Default timestamp for all files: **06:30** on the day the app starts
- Ownership: `/home/user/` and its contents are owned by `user`; everything else by `root`

```
/home/root/                  (root user's home, no permissions in the exercises)
/home/user/cyber/kyber.txt
/home/user/.bashrc
/bin/                        (fake binaries for each supported command)
/log/database.log            (not readable by user)
/data/database.db            (not readable by user)
```

## Tree ↔ terminal sync

- The current directory is highlighted in the tree (distinct text and background color)
- Tree updates when the filesystem or cwd changes (e.g. after `mkdir` or `cd`)

## Out of scope (v1)

- Pipes and redirects
- Tab completion
- Command history
- Colors inside the terminal output

## Exercises

In v1, exercises are **shown only**. Completion checks come later.

More tasks will be added later. Folder names in the commands must match the filesystem (`cyber`). Students also create new folders (`example`, `Cat_exercise`).

1. Go to the home directory with `cd`
2. Create a new folder named `example` with `mkdir example`
3. Enter the `cyber` folder: `cd cyber`
4. Create a new folder named `Cat_exercise` with `mkdir Cat_exercise`
5. Go to the home directory with `cd`
6. From the home directory, go into the `example` folder
7. Go to the `Cat_exercise` folder inside `cyber`
8. From `Cat_exercise`, go to the `example` folder in the home directory
