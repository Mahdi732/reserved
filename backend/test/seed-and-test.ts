/**
 * Comprehensive API test & seed script
 * Tests all endpoints and creates fake data
 *
 * Run: npx ts-node test/seed-and-test.ts
 */

const BASE = 'http://localhost:4000/api';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  ok: boolean;
  detail?: string;
}

const results: TestResult[] = [];

async function req(
  method: string,
  path: string,
  body?: any,
  token?: string,
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json();
  } else if (ct.includes('application/pdf')) {
    const buf = await res.arrayBuffer();
    data = { pdfBytes: buf.byteLength };
  } else {
    data = await res.text();
  }

  return { status: res.status, data };
}

function log(method: string, path: string, status: number, ok: boolean, detail?: string) {
  const icon = ok ? 'PASS' : 'FAIL';
  const line = `  [${icon}] ${method.padEnd(6)} ${path} -> ${status}${detail ? ' | ' + detail : ''}`;
  console.log(line);
  results.push({ endpoint: path, method, status, ok, detail });
}

async function run() {
  console.log('='.repeat(70));
  console.log('  EventReserve API — Full Endpoint Test & Data Seed');
  console.log('='.repeat(70));

  // ──────────────────────────────────────────────
  // 1. AUTH — Register users
  // ──────────────────────────────────────────────
  console.log('\n--- AUTH: Register ---');

  const adminReg = await req('POST', '/auth/register', {
    email: 'admin@reserve.test',
    name: 'Admin User',
    password: 'Admin123!',
    role: 'ADMIN',
  });
  log('POST', '/auth/register (admin)', adminReg.status, adminReg.status === 201);

  const user1Reg = await req('POST', '/auth/register', {
    email: 'alice@reserve.test',
    name: 'Alice Martin',
    password: 'Alice123!',
  });
  log('POST', '/auth/register (alice)', user1Reg.status, user1Reg.status === 201);

  const user2Reg = await req('POST', '/auth/register', {
    email: 'bob@reserve.test',
    name: 'Bob Dupont',
    password: 'Bob12345!',
  });
  log('POST', '/auth/register (bob)', user2Reg.status, user2Reg.status === 201);

  const user3Reg = await req('POST', '/auth/register', {
    email: 'carol@reserve.test',
    name: 'Carol Bernard',
    password: 'Carol123!',
  });
  log('POST', '/auth/register (carol)', user3Reg.status, user3Reg.status === 201);

  // Duplicate email test
  const dupReg = await req('POST', '/auth/register', {
    email: 'admin@reserve.test',
    name: 'Duplicate',
    password: 'Dup12345!',
  });
  log('POST', '/auth/register (dup)', dupReg.status, dupReg.status === 409 || dupReg.status === 400, 'Expected conflict');

  // Validation failure test
  const badReg = await req('POST', '/auth/register', {
    email: 'not-an-email',
    name: '',
    password: '123',
  });
  log('POST', '/auth/register (bad)', badReg.status, badReg.status === 400, 'Expected validation error');

  // ──────────────────────────────────────────────
  // 2. AUTH — Login
  // ──────────────────────────────────────────────
  console.log('\n--- AUTH: Login ---');

  const adminLogin = await req('POST', '/auth/login', {
    email: 'admin@reserve.test',
    password: 'Admin123!',
  });
  const adminToken = adminLogin.data?.access_token;
  log('POST', '/auth/login (admin)', adminLogin.status, adminLogin.status === 201 && !!adminToken, adminToken ? 'Got token' : 'No token');

  const aliceLogin = await req('POST', '/auth/login', {
    email: 'alice@reserve.test',
    password: 'Alice123!',
  });
  const aliceToken = aliceLogin.data?.access_token;
  log('POST', '/auth/login (alice)', aliceLogin.status, aliceLogin.status === 201 && !!aliceToken);

  const bobLogin = await req('POST', '/auth/login', {
    email: 'bob@reserve.test',
    password: 'Bob12345!',
  });
  const bobToken = bobLogin.data?.access_token;
  log('POST', '/auth/login (bob)', bobLogin.status, bobLogin.status === 201 && !!bobToken);

  const carolLogin = await req('POST', '/auth/login', {
    email: 'carol@reserve.test',
    password: 'Carol123!',
  });
  const carolToken = carolLogin.data?.access_token;
  log('POST', '/auth/login (carol)', carolLogin.status, carolLogin.status === 201 && !!carolToken);

  // Wrong password
  const badLogin = await req('POST', '/auth/login', {
    email: 'admin@reserve.test',
    password: 'wrongpassword',
  });
  log('POST', '/auth/login (wrong pw)', badLogin.status, badLogin.status === 401, 'Expected unauthorized');

  // ──────────────────────────────────────────────
  // 3. AUTH — Me
  // ──────────────────────────────────────────────
  console.log('\n--- AUTH: Me ---');

  const meAdmin = await req('GET', '/auth/me', undefined, adminToken);
  log('GET', '/auth/me (admin)', meAdmin.status, meAdmin.status === 200 && meAdmin.data?.user?.role === 'ADMIN');

  const meAlice = await req('GET', '/auth/me', undefined, aliceToken);
  log('GET', '/auth/me (alice)', meAlice.status, meAlice.status === 200);

  const meNoAuth = await req('GET', '/auth/me');
  log('GET', '/auth/me (no token)', meNoAuth.status, meNoAuth.status === 401, 'Expected unauthorized');

  // ──────────────────────────────────────────────
  // 4. EVENTS — Admin creates events
  // ──────────────────────────────────────────────
  console.log('\n--- EVENTS: Create (Admin) ---');

  const eventData = [
    {
      title: 'Jazz Night at the Blue Room',
      description: 'An evening of smooth jazz featuring local musicians. Drinks and light snacks available.',
      dateTime: '2026-03-15T20:00:00.000Z',
      location: 'The Blue Room, 42 Rue des Arts, Paris',
      capacity: 80,
    },
    {
      title: 'Tech Conference 2026',
      description: 'Annual tech conference covering AI, cloud computing, and software engineering best practices.',
      dateTime: '2026-04-20T09:00:00.000Z',
      location: 'Convention Center, 10 Avenue de la Tech, Lyon',
      capacity: 300,
    },
    {
      title: 'Outdoor Yoga Session',
      description: 'Morning yoga session in the park. All levels welcome. Bring your own mat.',
      dateTime: '2026-03-22T07:30:00.000Z',
      location: 'Parc de la Tete d\'Or, Lyon',
      capacity: 30,
    },
    {
      title: 'Photography Workshop',
      description: 'Hands-on workshop covering portrait and street photography techniques.',
      dateTime: '2026-05-10T14:00:00.000Z',
      location: 'Studio Lumiere, 8 Rue du Faubourg, Marseille',
      capacity: 15,
    },
    {
      title: 'Startup Pitch Night',
      description: 'Five startups pitch their ideas to a panel of investors. Networking reception follows.',
      dateTime: '2026-04-05T18:30:00.000Z',
      location: 'Innovation Hub, 25 Boulevard Haussmann, Paris',
      capacity: 120,
    },
    {
      title: 'Book Club Meetup',
      description: 'Monthly book club discussion. This month we read "Project Hail Mary" by Andy Weir.',
      dateTime: '2026-03-28T19:00:00.000Z',
      location: 'Cafe Litteraire, 3 Place Bellecour, Lyon',
      capacity: 20,
    },
  ];

  const eventIds: string[] = [];

  for (const evt of eventData) {
    const res = await req('POST', '/events', evt, adminToken);
    const id = res.data?.id || res.data?._id;
    if (id) eventIds.push(id);
    log('POST', `/events ("${evt.title.slice(0, 25)}...")`, res.status, res.status === 201 && !!id);
  }

  // Non-admin tries to create event
  const forbidCreate = await req('POST', '/events', eventData[0], aliceToken);
  log('POST', '/events (non-admin)', forbidCreate.status, forbidCreate.status === 403, 'Expected forbidden');

  // No auth tries to create event
  const noAuthCreate = await req('POST', '/events', eventData[0]);
  log('POST', '/events (no auth)', noAuthCreate.status, noAuthCreate.status === 401);

  // ──────────────────────────────────────────────
  // 5. EVENTS — Publish some events
  // ──────────────────────────────────────────────
  console.log('\n--- EVENTS: Publish (Admin) ---');

  // Publish first 4 events, keep last 2 as DRAFT
  for (let i = 0; i < 4 && i < eventIds.length; i++) {
    const res = await req('PATCH', `/events/${eventIds[i]}`, { status: 'PUBLISHED' }, adminToken);
    log('PATCH', `/events/${eventIds[i].slice(-6)} -> PUBLISHED`, res.status, res.status === 200);
  }

  // ──────────────────────────────────────────────
  // 6. EVENTS — Public listing & detail
  // ──────────────────────────────────────────────
  console.log('\n--- EVENTS: Public endpoints ---');

  const pubList = await req('GET', '/events');
  const pubCount = Array.isArray(pubList.data) ? pubList.data.length : 0;
  log('GET', '/events (public)', pubList.status, pubList.status === 200 && pubCount === 4, `${pubCount} published events`);

  if (eventIds.length > 0) {
    const detail = await req('GET', `/events/${eventIds[0]}`);
    log('GET', `/events/:id (detail)`, detail.status, detail.status === 200 && !!detail.data?.title);
  }

  // Non-existent event
  const fake404 = await req('GET', '/events/000000000000000000000000');
  log('GET', '/events/:id (404)', fake404.status, fake404.status === 404 || fake404.status === 400, 'Expected not found');

  // ──────────────────────────────────────────────
  // 7. EVENTS — Admin listing & stats
  // ──────────────────────────────────────────────
  console.log('\n--- EVENTS: Admin endpoints ---');

  const adminAll = await req('GET', '/events/admin/all', undefined, adminToken);
  const adminCount = Array.isArray(adminAll.data) ? adminAll.data.length : 0;
  log('GET', '/events/admin/all', adminAll.status, adminAll.status === 200 && adminCount === eventIds.length, `${adminCount} total events`);

  const evtStats = await req('GET', '/events/admin/stats', undefined, adminToken);
  log('GET', '/events/admin/stats', evtStats.status, evtStats.status === 200, JSON.stringify(evtStats.data));

  // Non-admin tries admin endpoints
  const forbidAll = await req('GET', '/events/admin/all', undefined, aliceToken);
  log('GET', '/events/admin/all (user)', forbidAll.status, forbidAll.status === 403);

  // ──────────────────────────────────────────────
  // 8. EVENTS — Update
  // ──────────────────────────────────────────────
  console.log('\n--- EVENTS: Update ---');

  if (eventIds.length > 1) {
    const upd = await req('PATCH', `/events/${eventIds[1]}`, {
      title: 'Tech Conference 2026 — Extended Edition',
      capacity: 350,
    }, adminToken);
    log('PATCH', `/events/:id (update)`, upd.status, upd.status === 200);
  }

  // ──────────────────────────────────────────────
  // 9. RESERVATIONS — Participants reserve
  // ──────────────────────────────────────────────
  console.log('\n--- RESERVATIONS: Create ---');

  const reservationIds: string[] = [];

  // Alice reserves for event 0 (Jazz Night) and event 1 (Tech Conf)
  if (eventIds.length > 1) {
    const r1 = await req('POST', '/reservations', { eventId: eventIds[0] }, aliceToken);
    const r1Id = r1.data?.id || r1.data?._id;
    if (r1Id) reservationIds.push(r1Id);
    log('POST', '/reservations (alice->jazz)', r1.status, r1.status === 201 && !!r1Id);

    const r2 = await req('POST', '/reservations', { eventId: eventIds[1] }, aliceToken);
    const r2Id = r2.data?.id || r2.data?._id;
    if (r2Id) reservationIds.push(r2Id);
    log('POST', '/reservations (alice->tech)', r2.status, r2.status === 201 && !!r2Id);
  }

  // Bob reserves for event 0, 1, 2
  if (eventIds.length > 2) {
    const r3 = await req('POST', '/reservations', { eventId: eventIds[0] }, bobToken);
    const r3Id = r3.data?.id || r3.data?._id;
    if (r3Id) reservationIds.push(r3Id);
    log('POST', '/reservations (bob->jazz)', r3.status, r3.status === 201 && !!r3Id);

    const r4 = await req('POST', '/reservations', { eventId: eventIds[1] }, bobToken);
    const r4Id = r4.data?.id || r4.data?._id;
    if (r4Id) reservationIds.push(r4Id);
    log('POST', '/reservations (bob->tech)', r4.status, r4.status === 201 && !!r4Id);

    const r5 = await req('POST', '/reservations', { eventId: eventIds[2] }, bobToken);
    const r5Id = r5.data?.id || r5.data?._id;
    if (r5Id) reservationIds.push(r5Id);
    log('POST', '/reservations (bob->yoga)', r5.status, r5.status === 201 && !!r5Id);
  }

  // Carol reserves for event 0, 2, 3
  if (eventIds.length > 3) {
    const r6 = await req('POST', '/reservations', { eventId: eventIds[0] }, carolToken);
    const r6Id = r6.data?.id || r6.data?._id;
    if (r6Id) reservationIds.push(r6Id);
    log('POST', '/reservations (carol->jazz)', r6.status, r6.status === 201 && !!r6Id);

    const r7 = await req('POST', '/reservations', { eventId: eventIds[2] }, carolToken);
    const r7Id = r7.data?.id || r7.data?._id;
    if (r7Id) reservationIds.push(r7Id);
    log('POST', '/reservations (carol->yoga)', r7.status, r7.status === 201 && !!r7Id);

    const r8 = await req('POST', '/reservations', { eventId: eventIds[3] }, carolToken);
    const r8Id = r8.data?.id || r8.data?._id;
    if (r8Id) reservationIds.push(r8Id);
    log('POST', '/reservations (carol->photo)', r8.status, r8.status === 201 && !!r8Id);
  }

  // Duplicate reservation (alice already reserved event 0)
  if (eventIds.length > 0) {
    const dup = await req('POST', '/reservations', { eventId: eventIds[0] }, aliceToken);
    log('POST', '/reservations (duplicate)', dup.status, dup.status === 409 || dup.status === 400, 'Expected conflict');
  }

  // No auth
  const noAuthRes = await req('POST', '/reservations', { eventId: eventIds[0] });
  log('POST', '/reservations (no auth)', noAuthRes.status, noAuthRes.status === 401);

  // Reserve for unpublished event (event 4 is DRAFT)
  if (eventIds.length > 4) {
    const draftRes = await req('POST', '/reservations', { eventId: eventIds[4] }, aliceToken);
    log('POST', '/reservations (draft evt)', draftRes.status, draftRes.status !== 201, 'Expected rejection');
  }

  // ──────────────────────────────────────────────
  // 10. RESERVATIONS — Participant lists own
  // ──────────────────────────────────────────────
  console.log('\n--- RESERVATIONS: My reservations ---');

  const aliceMine = await req('GET', '/reservations/me', undefined, aliceToken);
  const aliceCount = Array.isArray(aliceMine.data) ? aliceMine.data.length : 0;
  log('GET', '/reservations/me (alice)', aliceMine.status, aliceMine.status === 200, `${aliceCount} reservations`);

  const bobMine = await req('GET', '/reservations/me', undefined, bobToken);
  const bobCount = Array.isArray(bobMine.data) ? bobMine.data.length : 0;
  log('GET', '/reservations/me (bob)', bobMine.status, bobMine.status === 200, `${bobCount} reservations`);

  // ──────────────────────────────────────────────
  // 11. RESERVATIONS — Admin operations
  // ──────────────────────────────────────────────
  console.log('\n--- RESERVATIONS: Admin operations ---');

  const allRes = await req('GET', '/reservations/admin/all', undefined, adminToken);
  const allResCount = Array.isArray(allRes.data) ? allRes.data.length : 0;
  log('GET', '/reservations/admin/all', allRes.status, allRes.status === 200, `${allResCount} reservations`);

  if (eventIds.length > 0) {
    const byEvt = await req('GET', `/reservations/admin/event/${eventIds[0]}`, undefined, adminToken);
    const byEvtCount = Array.isArray(byEvt.data) ? byEvt.data.length : 0;
    log('GET', '/reservations/admin/event/:id', byEvt.status, byEvt.status === 200, `${byEvtCount} for jazz`);
  }

  // Confirm reservation 0 (alice->jazz)
  if (reservationIds.length > 0) {
    const conf = await req('PATCH', `/reservations/${reservationIds[0]}/confirm`, undefined, adminToken);
    log('PATCH', '/reservations/:id/confirm', conf.status, conf.status === 200, 'alice->jazz confirmed');
  }

  // Confirm reservation 2 (bob->jazz)
  if (reservationIds.length > 2) {
    const conf2 = await req('PATCH', `/reservations/${reservationIds[2]}/confirm`, undefined, adminToken);
    log('PATCH', '/reservations/:id/confirm', conf2.status, conf2.status === 200, 'bob->jazz confirmed');
  }

  // Refuse reservation 3 (bob->tech)
  if (reservationIds.length > 3) {
    const ref = await req('PATCH', `/reservations/${reservationIds[3]}/refuse`, undefined, adminToken);
    log('PATCH', '/reservations/:id/refuse', ref.status, ref.status === 200, 'bob->tech refused');
  }

  // Admin cancel reservation 5 (carol->jazz)
  if (reservationIds.length > 5) {
    const ac = await req('PATCH', `/reservations/${reservationIds[5]}/admin-cancel`, undefined, adminToken);
    log('PATCH', '/reservations/:id/admin-cancel', ac.status, ac.status === 200, 'carol->jazz canceled');
  }

  // Non-admin tries admin operations
  if (reservationIds.length > 1) {
    const forbidConf = await req('PATCH', `/reservations/${reservationIds[1]}/confirm`, undefined, aliceToken);
    log('PATCH', '/reservations/:id/confirm (user)', forbidConf.status, forbidConf.status === 403);
  }

  // ──────────────────────────────────────────────
  // 12. RESERVATIONS — User cancel own
  // ──────────────────────────────────────────────
  console.log('\n--- RESERVATIONS: User cancel ---');

  // Bob cancels his yoga reservation (index 4)
  if (reservationIds.length > 4) {
    const uc = await req('PATCH', `/reservations/${reservationIds[4]}/cancel`, undefined, bobToken);
    log('PATCH', '/reservations/:id/cancel (bob)', uc.status, uc.status === 200, 'bob->yoga canceled');
  }

  // Alice tries to cancel bob's reservation
  if (reservationIds.length > 2) {
    const wrongCancel = await req('PATCH', `/reservations/${reservationIds[2]}/cancel`, undefined, aliceToken);
    log('PATCH', '/reservations/:id/cancel (wrong user)', wrongCancel.status, wrongCancel.status === 403 || wrongCancel.status === 400, 'Expected forbidden');
  }

  // ──────────────────────────────────────────────
  // 13. RESERVATIONS — PDF ticket
  // ──────────────────────────────────────────────
  console.log('\n--- RESERVATIONS: PDF ticket ---');

  // Confirmed reservation should give PDF (reservation 0 = alice->jazz, confirmed)
  if (reservationIds.length > 0) {
    const pdf = await req('GET', `/reservations/${reservationIds[0]}/ticket`, undefined, aliceToken);
    log('GET', '/reservations/:id/ticket (confirmed)', pdf.status, pdf.status === 200 && pdf.data?.pdfBytes > 0, `${pdf.data?.pdfBytes || 0} bytes`);
  }

  // Pending reservation should NOT give PDF (reservation 1 = alice->tech, still PENDING)
  if (reservationIds.length > 1) {
    const noPdf = await req('GET', `/reservations/${reservationIds[1]}/ticket`, undefined, aliceToken);
    log('GET', '/reservations/:id/ticket (pending)', noPdf.status, noPdf.status !== 200, 'Expected rejection');
  }

  // ──────────────────────────────────────────────
  // 14. RESERVATIONS — Stats
  // ──────────────────────────────────────────────
  console.log('\n--- RESERVATIONS: Stats ---');

  const resStats = await req('GET', '/reservations/admin/stats', undefined, adminToken);
  log('GET', '/reservations/admin/stats', resStats.status, resStats.status === 200, JSON.stringify(resStats.data));

  // ──────────────────────────────────────────────
  // 15. EVENTS — Cancel event
  // ──────────────────────────────────────────────
  console.log('\n--- EVENTS: Cancel ---');

  // Cancel event 3 (Photography Workshop)
  if (eventIds.length > 3) {
    const del = await req('DELETE', `/events/${eventIds[3]}`, undefined, adminToken);
    log('DELETE', `/events/:id (cancel)`, del.status, del.status === 200);
  }

  // Verify public list decreased
  const pubList2 = await req('GET', '/events');
  const pubCount2 = Array.isArray(pubList2.data) ? pubList2.data.length : 0;
  log('GET', '/events (after cancel)', pubList2.status, pubList2.status === 200 && pubCount2 === 3, `${pubCount2} published events`);

  // ──────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const total = results.length;
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${total} total`);

  if (failed > 0) {
    console.log('\n  FAILURES:');
    results.filter((r) => !r.ok).forEach((r) => {
      console.log(`    - ${r.method} ${r.endpoint} -> ${r.status} ${r.detail || ''}`);
    });
  }

  console.log('\n  SEED DATA SUMMARY:');
  console.log(`    Users:        4 (1 admin + 3 participants)`);
  console.log(`    Events:       ${eventIds.length} (4 published, 1 draft, 1 canceled)`);
  console.log(`    Reservations: ${reservationIds.length} (various statuses)`);
  console.log('='.repeat(70));

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Script crashed:', err);
  process.exit(1);
});
