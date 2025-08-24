// Robust smoke test: uses global fetch when available (Node 18+), falls back to node-fetch
let _fetch = globalThis.fetch;
const useNodeFetch = async () => {
  if (!_fetch) {
    try {
      const mod = await import('node-fetch');
      _fetch = mod.default || mod;
    } catch (e) {
      // no fetch available
      throw new Error('fetch is not available; please run on Node 18+ or install node-fetch');
    }
  }
};

(async function main(){
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const log = (...a) => console.log(new Date().toISOString(), ...a);
  log('base', base)

  await useNodeFetch();

  // wait for server up
  const wait = async () => {
    for (let i=0;i<40;i++){
      try { await _fetch(base); return true } catch(e){ await new Promise(r=>setTimeout(r,1000)) }
    }
    return false
  }
  if (!(await wait())){ console.error('server not reachable at', base); process.exit(1) }

  const getJson = async (path) => { const r = await _fetch(base+path); return r.json() }

  let users = await getJson('/api/users')
  if (!users.users || users.users.length < 2){
    log('seeding...')
    await _fetch(base + '/api/seed', { method: 'POST' })
    users = await getJson('/api/users')
  }
  if (!users.users || users.users.length === 0) {
    console.error('No users available after seed');
    process.exit(5);
  }
  const selected = users.users[0].id
  const actor = (users.users.find(u=>u.id !== selected) || users.users[0]).id
  log('selected', selected, 'actor', actor)

  const beforeRes = await getJson(`/api/users/${selected}/notifications?sort=chrono`);
  const before = beforeRes?.meta?.total ?? 0;
  log('before', before)

  const payloads = [
    { type: 'new_post', actorId: actor, notifyUserId: selected, text: 'Smoke post' },
    { type: 'new_like', actorId: actor, notifyUserId: selected, targetUserId: selected, text: 'Smoke like' },
    { type: 'new_follow', actorId: actor, notifyUserId: selected, followeeId: selected }
  ]

  const counts = []
  for (const p of payloads){
    await _fetch(base + '/api/events', { method: 'POST', body: JSON.stringify(p), headers: { 'content-type': 'application/json' } })
    await new Promise(r=>setTimeout(r, 1000))
    const nowRes = await getJson(`/api/users/${selected}/notifications?sort=chrono`)
    const now = nowRes?.meta?.total ?? 0;
    counts.push(now)
    log('now', now)
  }

  const recentRes = await getJson(`/api/users/${selected}/notifications?sort=chrono&limit=5`)
  const recent = recentRes?.notifications || [];
  log('recent', recent.map(n=>`${n.type}|${n.actorId}|${n.text}|read=${n.read}`))

  if (counts[0] > before) log('PASS_POST') ; else { console.error('FAIL_POST'); process.exitCode = 2 }
  if (counts[1] > counts[0]) log('PASS_LIKE') ; else { console.error('FAIL_LIKE'); process.exitCode = 3 }
  if (counts[2] > counts[1]) log('PASS_FOLLOW') ; else { console.error('FAIL_FOLLOW'); process.exitCode = 4 }

  log('SMOKE_DONE')
})().catch(e=>{ console.error(e); process.exit(10) })
