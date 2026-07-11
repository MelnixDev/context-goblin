export function projectRoot(context: { directory?: string; worktree?: string }): string {
  if (context.directory) return context.directory
  if (context.worktree && context.worktree !== "/") return context.worktree
  return process.cwd()
}
