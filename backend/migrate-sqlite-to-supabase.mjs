#!/usr/bin/env node
// migrate-sqlite-to-supabase.mjs
// Migrates Appointment and FixedSlot data from SQLite to Supabase via REST API

import { execSync } from 'child_process';

const SUPABASE_URL = 'https://qcnvfnoeyftvsjuzjxho.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbnZmbm9leWZ0dnNqdXpqeGhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0OTA5MywiZXhwIjoyMTAwMjI1MDkzfQ.t95zs4rSdTHmPRe67BHGAEQAsK8lP-EZpm4FDu9hGTI';
const DB_PATH = './prisma/dev.db';

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates',
};

function queryDb(sql) {
  const result = execSync(`sqlite3 -json "${DB_PATH}" "${sql}"`, { encoding: 'utf8' }).trim();
  return result ? JSON.parse(result) : [];
}

function toIso(ms) {
  if (!ms) return null;
  return new Date(Number(ms)).toISOString();
}

async function insertBatch(table, records) {
  if (records.length === 0) return;

  const BATCH = 100;
  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error inserting into ${table} (batch ${i}): ${res.status} ${text}`);
    }
    console.log(`  ✓ ${table}: inserted batch ${i + 1}–${Math.min(i + BATCH, records.length)}`);
  }
}

async function main() {
  console.log('📦 Reading SQLite data...');

  // --- Appointments ---
  const rawAppts = queryDb('SELECT * FROM Appointment');
  const appointments = rawAppts.map((r) => ({
    id: r.id,
    date: toIso(r.date),
    startTime: r.startTime,
    endTime: r.endTime,
    status: r.status,
    clientName: r.clientName || null,
    clientPhone: r.clientPhone || null,
    courtId: r.courtId ?? 1,
    type: r.type || null,
    createdAt: toIso(r.createdAt),
  }));
  console.log(`  Found ${appointments.length} appointments`);

  // --- FixedSlots ---
  const rawFixed = queryDb('SELECT * FROM FixedSlot');
  const fixedSlots = rawFixed.map((r) => ({
    id: r.id,
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
    clientName: r.clientName,
    startDate: toIso(r.startDate),
    endDate: toIso(r.endDate),
    courtId: r.courtId ?? 1,
  }));
  console.log(`  Found ${fixedSlots.length} fixed slots`);

  // --- Insert ---
  console.log('\n🚀 Inserting into Supabase...');
  await insertBatch('Appointment', appointments);
  await insertBatch('FixedSlot', fixedSlots);

  // --- Verify ---
  console.log('\n✅ Verifying...');
  const [apptCount, fixedCount] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/Appointment?select=count`, {
      headers: { ...headers, Prefer: 'count=exact' },
    }).then((r) => r.headers.get('content-range')),
    fetch(`${SUPABASE_URL}/rest/v1/FixedSlot?select=count`, {
      headers: { ...headers, Prefer: 'count=exact' },
    }).then((r) => r.headers.get('content-range')),
  ]);

  console.log(`  Appointments in Supabase: ${apptCount}`);
  console.log(`  FixedSlots in Supabase:   ${fixedCount}`);
  console.log('\n🎉 Migration complete!');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
