import test from 'node:test'
import assert from 'node:assert/strict'
import { attestChanges } from '../src/index.js'

test('classifies created modified deleted and unchanged paths', () => {
  const r = attestChanges(
    { head: 'a', files: { 'a.txt': '1', 'b.txt': '1', 'd.txt': 'same' } },
    { head: 'b', files: { 'b.txt': '2', 'c.txt': '1', 'd.txt': 'same' } },
  )
  assert.deepEqual(r.created, ['c.txt'])
  assert.deepEqual(r.modified, ['b.txt'])
  assert.deepEqual(r.deleted, ['a.txt'])
  assert.deepEqual(r.unchanged, ['d.txt'])
})

test('digest is deterministic', () => {
  const a = attestChanges({ files: { b: '2', a: '1' } }, { files: { a: '2', b: '2' } }, ['z','a'])
  const b = attestChanges({ files: { a: '1', b: '2' } }, { files: { b: '2', a: '2' } }, ['a','z'])
  assert.equal(a.digest, b.digest)
})

test('observed action ids are references not causation claims', () => {
  const r = attestChanges({ files: {} }, { files: { x: '1' } }, ['call-1'])
  assert.deepEqual(r.observedActionIds, ['call-1'])
  assert.equal('causedBy' in r, false)
})

test('change-attest command accepts a JSON payload via rawInput', async () => {
  const commands: Record<string, (invocation: { rawInput?: string }) => Promise<{ kind: string; text: string }>> = {}
  const { apply } = await import('../src/index.js')
  apply({ commands: { register: (d: { name: string; handler: unknown }) => { commands[d.name] = d.handler as never } } })
  const result = await commands['change-attest']!({ rawInput: JSON.stringify({ before: { files: { 'a.txt': 'v1' } }, after: { files: { 'a.txt': 'v2' } } }) })
  assert.equal(result.kind, 'success')
  const parsed = JSON.parse(result.text)
  assert.deepEqual(parsed.modified, ['a.txt'])
  assert.match(parsed.digest, /^[0-9a-f]{64}$/)
})

test('change-attest command reports malformed JSON gracefully', async () => {
  const commands: Record<string, (invocation: { rawInput?: string }) => Promise<{ kind: string; text: string }>> = {}
  const { apply } = await import('../src/index.js')
  apply({ commands: { register: (d: { name: string; handler: unknown }) => { commands[d.name] = d.handler as never } } })
  const result = await commands['change-attest']!({ rawInput: 'not-json' })
  assert.equal(result.kind, 'error')
})