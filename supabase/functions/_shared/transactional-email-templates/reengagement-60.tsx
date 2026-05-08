import * as React from 'npm:react@18.3.1'
import { Shell, Heading, Text, Button, h1, text, button, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = () => (
  <Shell preview="Should we keep your home's record active?">
    <Heading style={h1}>Should we keep your home's record active?</Heading>
    <Text style={text}>
      We haven't seen you in 60 days. Your home's record is safe — we just want to make
      sure you're still getting value. If you'd like to pause your emails, you can do
      that here.
    </Text>
    <Button href={`${APP_URL}/dashboard`} style={button}>Take Me Back</Button>
    <Text style={text}>{' '}</Text>
    <Text style={text}>
      <a href={`${APP_URL}/profile?tab=email&action=pause`} style={{ color: '#1B3A8C' }}>Pause My Emails</a>
    </Text>
  </Shell>
)

export const template = {
  component: Email,
  subject: "Should we keep your home's record active?",
  displayName: 'Re-engagement — 60 days (final)',
  previewData: {},
} satisfies TemplateEntry
