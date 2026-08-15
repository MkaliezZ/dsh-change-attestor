import { createHash } from 'node:crypto'

export interface Snapshot { head?: string; files: Record<string, string> }
export interface Attestation {
  beforeHead?: string
  afterHead?: string
  created: string[]
  modified: string[]
  deleted: string[]
  unchanged: string[]
  observedActionIds: string[]
  digest: string
}

export function attestChanges(before: Snapshot, after: Snapshot, observedActionIds: string[] = []): Attestation {
  const names = [...new Set([...Object.keys(before.files), ...Object.keys(after.files)])].sort()
  const created: string[] = [], modified: string[] = [], deleted: string[] = [], unchanged: string[] = []
  for (const name of names) {
    const a = before.files[name], b = after.files[name]
    if (a === undefined && b !== undefined) created.push(name)
    else if (a !== undefined && b === undefined) deleted.push(name)
    else if (a !== b) modified.push(name)
    else unchanged.push(name)
  }
  const body = { beforeHead: before.head, afterHead: after.head, created, modified, deleted, unchanged, observedActionIds: [...observedActionIds].sort() }
  return { ...body, digest: createHash('sha256').update(JSON.stringify(body)).digest('hex') }
}

export const name = 'change-attestor'
export const inject = ['commands']
export function apply(ctx: any): void {
  ctx.commands.register({
    name: 'change-attest',
    description: 'Compare two supplied workspace snapshot JSON objects and emit a deterministic attestation.',
    recordInput: false,
    async handler(invocation: any) {
      const raw = String(invocation.args?.join(' ') ?? '').trim()
      if (!raw) return { kind: 'error', text: 'usage: /change-attest {"before":...,"after":...,"observedActionIds":[]}' }
      const input = JSON.parse(raw) as { before: Snapshot; after: Snapshot; observedActionIds?: string[] }
      return { kind: 'success', text: JSON.stringify(attestChanges(input.before, input.after, input.observedActionIds ?? []), null, 2) }
    },
  })
}
