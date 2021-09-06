const test = require('tape')
const hypercore = require('hypercore')
const ram = require('random-access-memory')

const { toPromises, unwrap } = require('..')

test('cb hypercore -> promises, simple', async t => {
  const core = hypercore(ram, { valueEncoding: 'utf-8' })
  const wrapper = toPromises(core)
  await wrapper.ready()
  await wrapper.append('hello world')
  const block = await wrapper.get(0)
  t.same(block, 'hello world')
  t.end()
})

test('cb hypercore -> promises, events', async t => {
  const core = hypercore(ram, { valueEncoding: 'utf-8' })
  const wrapper = toPromises(core)

  let ready = 0
  let appended = 0
  wrapper.on('ready', () => {
    ready++
  })
  wrapper.on('append', () => {
    appended++
  })

  await wrapper.ready()
  await wrapper.append('hello world')
  t.same(ready, 1)
  t.same(appended, 1)

  t.end()
})

test('double wrapping', async t => {
  const core = hypercore(ram, { valueEncoding: 'utf-8' })
  const wrapper = toPromises(toPromises(core))
  await wrapper.ready()
  await wrapper.append('hello world')
  const block = await wrapper.get(0)
  t.same(block, 'hello world')
  t.end()
})

test('can unwrap', async t => {
  const core = hypercore(ram, { valueEncoding: 'utf-8' })
  const wrapper = toPromises(toPromises(core))
  t.same(core, unwrap(wrapper))
  t.same(core, unwrap(core))
  t.end()
})
