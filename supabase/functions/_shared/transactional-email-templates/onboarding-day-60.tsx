import * as React from 'npm:react@18.3.1'
import { Shell, Heading, Text, Button, h1, text, card, button, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  systemsCount?: number
  hitLimits?: string[]
}

const Email = ({ systemsCount = 0, hitLimits = [] }: Props) => (
  <Shell preview={`You've documented ${systemsCount} systems. Here's what Pro unlocks.`}>
    <Heading style={h1}>You've documented {systemsCount} systems. Here's what Pro unlocks.</Heading>
    {hitLimits.length > 0 ? (
      <>
        <Text style={text}>You've recently hit these Pro-only features:</Text>
        {hitLimits.map((l, i) => <Text key={i} style={card}>• {l}</Text>)}
      </>
    ) : (
      <Text style={text}>
        Pro unlocks unlimited systems, AI Coverage Gap Analyzer, full warranty intelligence,
        Home Passport sharing, and the AI Home Assistant.
      </Text>
    )}
    <Text style={text}>Try it free for 14 days.</Text>
    <Button href={`${APP_URL}/pricing`} style={button}>Unlock Pro — 14 days free</Button>
  </Shell>
)

export const template = {
  component: Email,
  subject: (d: Props) => `You've documented ${d.systemsCount ?? 0} systems. Here's what Pro unlocks.`,
  displayName: 'Onboarding Day 60 — Upgrade',
  previewData: { systemsCount: 11, hitLimits: ['Coverage Gap Analyzer', 'Home Passport sharing'] },
} satisfies TemplateEntry
