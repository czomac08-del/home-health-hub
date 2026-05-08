import * as React from 'npm:react@18.3.1'
import { Shell, Heading, Text, Button, h1, text, card, button, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  verifiedCount?: number
  currentScore?: number
  projectedScore?: number
  topActionLabel?: string
  topActionLink?: string
}

const Email = ({ verifiedCount = 0, currentScore, projectedScore, topActionLabel, topActionLink }: Props) => (
  <Shell preview={`Your home has ${verifiedCount} verified records`}>
    <Heading style={h1}>Your home has {verifiedCount} verified records. Here's what that means.</Heading>
    <Text style={text}>
      Verified records are facts about your home pulled from public sources — FEMA, NOAA,
      county permits, manufacturer recalls — and matched to your address. They're the
      foundation of your Home IQ Score.
    </Text>
    {typeof currentScore === 'number' && typeof projectedScore === 'number' && (
      <Text style={card}>
        <strong>Your current Home IQ Score: {currentScore}</strong><br />
        Complete your top 5 actions to reach <strong>{projectedScore}</strong>.
      </Text>
    )}
    <Text style={text}>{topActionLabel ? `Start with: ${topActionLabel}` : 'Start with your highest-impact action.'}</Text>
    <Button href={`${APP_URL}${topActionLink || '/dashboard'}`} style={button}>Complete your top action</Button>
  </Shell>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Your home has ${d.verifiedCount ?? 0} verified records. Here's what that means.`,
  displayName: 'Onboarding Day 14 — Value Reinforcement',
  previewData: { verifiedCount: 12, currentScore: 64, projectedScore: 81, topActionLabel: 'Add HVAC age', topActionLink: '/hvac' },
} satisfies TemplateEntry
