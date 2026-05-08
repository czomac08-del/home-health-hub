// Retention email dispatcher. Runs on cron (see migration).
// 1. Picks pending email_queue rows whose scheduled_for <= now()
// 2. Checks email_preferences (master + per-sequence flags)
// 3. Invokes send-transactional-email
// 4. On the 1st of the month: enqueues pulse-monthly for opted-in users
// 5. Detects inactivity (45/60 days) and enqueues re-engagement emails
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PREF_FOR_SEQUENCE: Record<string, string> = {
  onboarding: 'onboarding_emails',
  pulse: 'pulse_emails',
  referral: 'referral_emails',
  handover: 'handover_emails',
  reengagement: 'reengagement_emails',
}

// Personalized seasonal Pulse content by month (1-12)
function pulseDataForMonth(month: number, city?: string): Record<string, any> {
  const cityLabel = city || 'your area'
  const map: Record<number, any> = {
    1:  { subjectLine: "Your home's tax documents are due in 90 days",
          seasonalAction: 'Pull together property tax documents and check heating system service log.',
          seasonalActionLink: '/documents' },
    3:  { subjectLine: `Spring is here. Time to refresh your HVAC filter.`,
          seasonalAction: 'Replace your HVAC filter and walk the exterior — gutters, roofline, downspouts.',
          seasonalActionLink: '/hvac' },
    6:  { subjectLine: 'Has your A/C been serviced this year?',
          seasonalAction: 'Schedule A/C service and run the pest prevention checklist.',
          seasonalActionLink: '/hvac' },
    9:  { subjectLine: `3 things to do before winter hits ${cityLabel}`,
          seasonalAction: 'Run weatherization checklist, replace HVAC filter, and book pre-season furnace service.',
          seasonalActionLink: '/hvac' },
    11: { subjectLine: 'Winter is here — check your warranties before they expire',
          seasonalAction: 'Audit warranty expirations on tracked systems and finish winterization.',
          seasonalActionLink: '/warranties' },
  }
  // Map non-themed months to the most relevant theme
  const fallback = month <= 2 ? 1 : month <= 5 ? 3 : month <= 8 ? 6 : month <= 10 ? 9 : 11
  return map[month] || map[fallback]
}

async function processDueQueue(supabase: any) {
  const { data: due } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(100)

  if (!due || due.length === 0) return { processed: 0 }

  let processed = 0
  for (const row of due) {
    try {
      // Check preferences if there's a user_id
      if (row.user_id) {
        const { data: prefs } = await supabase
          .from('email_preferences')
          .select('*')
          .eq('user_id', row.user_id)
          .maybeSingle()

        if (prefs?.unsubscribed_all) {
          await supabase.from('email_queue').update({ status: 'skipped', error_message: 'unsubscribed_all', sent_at: new Date().toISOString() }).eq('id', row.id)
          continue
        }
        const prefKey = PREF_FOR_SEQUENCE[row.sequence_type]
        if (prefKey && prefs && prefs[prefKey] === false) {
          await supabase.from('email_queue').update({ status: 'skipped', error_message: `${prefKey}=false`, sent_at: new Date().toISOString() }).eq('id', row.id)
          continue
        }
      }

      // Invoke sender
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName: row.template_name,
          recipientEmail: row.email,
          idempotencyKey: row.idempotency_key || `q-${row.id}`,
          templateData: row.template_data || {},
        }),
      })

      if (resp.ok) {
        await supabase.from('email_queue').update({ status: 'sent', sent_at: new Date().toISOString(), attempts: row.attempts + 1 }).eq('id', row.id)
        processed++
      } else {
        const txt = await resp.text()
        const newAttempts = row.attempts + 1
        const newStatus = newAttempts >= 3 ? 'failed' : 'pending'
        await supabase.from('email_queue').update({
          status: newStatus,
          error_message: txt.slice(0, 500),
          attempts: newAttempts,
          scheduled_for: newStatus === 'pending' ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : row.scheduled_for,
        }).eq('id', row.id)
      }
    } catch (err) {
      const newAttempts = (row.attempts || 0) + 1
      await supabase.from('email_queue').update({
        status: newAttempts >= 3 ? 'failed' : 'pending',
        error_message: String(err).slice(0, 500),
        attempts: newAttempts,
      }).eq('id', row.id)
    }
  }
  return { processed }
}

async function scheduleMonthlyPulse(supabase: any) {
  const now = new Date()
  // Run only on the 1st of the month
  if (now.getUTCDate() !== 1) return { scheduled: 0 }

  const month = now.getUTCMonth() + 1
  const idemPrefix = `pulse-${now.getUTCFullYear()}-${month}-`

  // Pull opted-in users
  const { data: prefs } = await supabase
    .from('email_preferences')
    .select('user_id, pulse_emails, unsubscribed_all')
    .eq('pulse_emails', true)
    .eq('unsubscribed_all', false)

  if (!prefs || prefs.length === 0) return { scheduled: 0 }

  // Pull email + city per user from profiles + properties
  const userIds = prefs.map((p: any) => p.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, email')
    .in('user_id', userIds)

  const emailByUser = new Map<string, string>()
  for (const p of profiles || []) if (p.email) emailByUser.set(p.user_id, p.email)

  const { data: properties } = await supabase
    .from('properties')
    .select('user_id, city')
    .in('user_id', userIds)

  const cityByUser = new Map<string, string>()
  for (const p of properties || []) if (p.city && !cityByUser.has(p.user_id)) cityByUser.set(p.user_id, p.city)

  // Open safety/major inspection findings per user — joined via properties.
  const { data: userProps } = await supabase
    .from('properties')
    .select('id, user_id')
    .in('user_id', userIds)
  const propIdByUser = new Map<string, string[]>()
  const userByPropId = new Map<string, string>()
  for (const p of userProps || []) {
    if (!p.user_id || !p.id) continue
    userByPropId.set(p.id, p.user_id)
    const arr = propIdByUser.get(p.user_id) || []
    arr.push(p.id)
    propIdByUser.set(p.user_id, arr)
  }
  const openSafetyByUser = new Map<string, { safety: number; major: number }>()
  const allPropIds = Array.from(userByPropId.keys())
  if (allPropIds.length > 0) {
    const { data: openFindings } = await supabase
      .from('inspection_findings')
      .select('property_id, level, status')
      .in('property_id', allPropIds)
      .in('level', [1, 2])
      .not('status', 'in', '("resolved","fixed","dismissed","skipped","monitoring")')
    for (const f of openFindings || []) {
      const uid = userByPropId.get(f.property_id)
      if (!uid) continue
      const cur = openSafetyByUser.get(uid) || { safety: 0, major: 0 }
      if (f.level === 1) cur.safety += 1
      else if (f.level === 2) cur.major += 1
      openSafetyByUser.set(uid, cur)
    }
  }

  const rows = []
  for (const pref of prefs) {
    const email = emailByUser.get(pref.user_id)
    if (!email) continue
    const data: Record<string, any> = { ...pulseDataForMonth(month, cityByUser.get(pref.user_id)) }
    const open = openSafetyByUser.get(pref.user_id)
    if (open && (open.safety > 0 || open.major > 0)) {
      data.openSafetyCount = open.safety
      data.openMajorCount = open.major
      data.openSafetyLink = '/property'
    }
    rows.push({
      user_id: pref.user_id,
      email,
      sequence_type: 'pulse',
      sequence_step: month,
      template_name: 'pulse-monthly',
      template_data: data,
      scheduled_for: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
      idempotency_key: idemPrefix + pref.user_id,
    })
  }
  if (rows.length === 0) return { scheduled: 0 }
  // Bulk insert, ignore conflicts via upsert on idempotency_key
  const { error } = await supabase.from('email_queue').upsert(rows, { onConflict: 'idempotency_key', ignoreDuplicates: true })
  if (error) console.error('pulse insert error', error)
  return { scheduled: rows.length }
}

async function scheduleReengagement(supabase: any) {
  const now = new Date()
  const cutoff45 = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString()
  const cutoff60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

  // Re-engagement 45
  const { data: stale45 } = await supabase
    .from('email_preferences')
    .select('user_id, last_seen_at, reengagement_45_sent_at')
    .eq('unsubscribed_all', false)
    .eq('reengagement_emails', true)
    .lt('last_seen_at', cutoff45)
    .is('reengagement_45_sent_at', null)
    .limit(200)

  let scheduled45 = 0
  for (const pref of stale45 || []) {
    const { data: profile } = await supabase.from('profiles').select('email').eq('user_id', pref.user_id).maybeSingle()
    if (!profile?.email) continue
    await supabase.from('email_queue').upsert({
      user_id: pref.user_id,
      email: profile.email,
      sequence_type: 'reengagement',
      sequence_step: 45,
      template_name: 'reengagement-45',
      template_data: { stormCount: 0, warrantyCount: 0 },
      scheduled_for: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
      idempotency_key: `reeng45-${pref.user_id}`,
    }, { onConflict: 'idempotency_key', ignoreDuplicates: true })
    await supabase.from('email_preferences').update({ reengagement_45_sent_at: now.toISOString() }).eq('user_id', pref.user_id)
    scheduled45++
  }

  // Re-engagement 60 — sent 15 days after the 45-day email if user still hasn't returned
  const { data: stale60 } = await supabase
    .from('email_preferences')
    .select('user_id, last_seen_at, reengagement_45_sent_at, reengagement_60_sent_at')
    .eq('unsubscribed_all', false)
    .eq('reengagement_emails', true)
    .lt('last_seen_at', cutoff60)
    .not('reengagement_45_sent_at', 'is', null)
    .is('reengagement_60_sent_at', null)
    .limit(200)

  let scheduled60 = 0
  for (const pref of stale60 || []) {
    const { data: profile } = await supabase.from('profiles').select('email').eq('user_id', pref.user_id).maybeSingle()
    if (!profile?.email) continue
    await supabase.from('email_queue').upsert({
      user_id: pref.user_id,
      email: profile.email,
      sequence_type: 'reengagement',
      sequence_step: 60,
      template_name: 'reengagement-60',
      template_data: {},
      scheduled_for: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
      idempotency_key: `reeng60-${pref.user_id}`,
    }, { onConflict: 'idempotency_key', ignoreDuplicates: true })
    await supabase.from('email_preferences').update({ reengagement_60_sent_at: now.toISOString() }).eq('user_id', pref.user_id)
    scheduled60++
  }

  return { scheduled45, scheduled60 }
}

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const result: any = {}
  result.queue = await processDueQueue(supabase)
  result.pulse = await scheduleMonthlyPulse(supabase)
  result.reengagement = await scheduleReengagement(supabase)
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
})
