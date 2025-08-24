const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

(async function main(){
  const base = process.env.BASE_URL || 'http://localhost:3000';
  function log(...a){ console.log(...a) }
  log('base', base)

  // wait for server up
  const wait = async () => {
    for (let i=0;i<40;i++){
      try { await fetch(base); return true } catch(e){ await new Promise(r=>setTimeout(r,1000)) }
    }
    return false
  }
  if (!(await wait())){ console.error('server not reachable at', base); process.exit(1) }

  const getJson = async (path) => { const r = await fetch(base+path); return r.json() }

  let users = await getJson('/api/users')
  if (!users.users || users.users.length < 2){
    log('seeding...')
    await fetch('/api/seed', { method: 'POST' })
    users = await getJson('/api/users')
  }
  const selected = users.users[0].id
  const actor = users.users.find(u=>u.id !== selected).id
  log('selected', selected, 'actor', actor)

  const before = (await getJson(`/api/users/${selected}/notifications?sort=chrono`)).meta.total
  log('before', before)

  const payloads = [
    { type: 'new_post', actorId: actor, notifyUserId: selected, text: 'Smoke post' },
    { type: 'new_like', actorId: actor, notifyUserId: selected, targetUserId: selected, text: 'Smoke like' },
    { type: 'new_follow', actorId: actor, notifyUserId: selected, followeeId: selected }
  ]

  const counts = []
  for (const p of payloads){
    await fetch('/api/events', { method: 'POST', body: JSON.stringify(p), headers: { 'content-type': 'application/json' } })
    await new Promise(r=>setTimeout(r, 1000))
    const now = (await getJson(`/api/users/${selected}/notifications?sort=chrono`)).meta.total
    counts.push(now)
    log('now', now)
  }

  const recent = (await getJson(`/api/users/${selected}/notifications?sort=chrono&limit=5`)).notifications
  log('recent', recent.map(n=>`${n.type}|${n.actorId}|${n.text}|read=${n.read}`))

  if (counts[0] > before) log('PASS_POST') ; else { console.error('FAIL_POST'); process.exitCode = 2 }
  if (counts[1] > counts[0]) log('PASS_LIKE') ; else { console.error('FAIL_LIKE'); process.exitCode = 3 }
  if (counts[2] > counts[1]) log('PASS_FOLLOW') ; else { console.error('FAIL_FOLLOW'); process.exitCode = 4 }

  log('SMOKE_DONE')
})().catch(e=>{ console.error(e); process.exit(10) })
