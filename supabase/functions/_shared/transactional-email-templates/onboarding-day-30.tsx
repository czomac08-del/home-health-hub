import * as React from 'npm:react@18.3.1'
import { Shell, Heading, Text, Button, h1, text, card, button, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  addedCount?: number
  autoFoundCount?: number
  scoreDelta?: number
  currentScore?: number
  qualifiesForCert?: boolean
  pointsToCert?: number
}

const Email = ({ addedCount = 0, autoFoundCount = 0, scoreDelta = 0, currentScore = 0, qualifiesForCert, pointsToCert }: Props) => (
  <Shell preview="You've been documenting your home for 30 days">
    <Heading style={h1}>You've been documenting your home for 30 days.</Heading>
    <Text style={card}>
      <strong>{addedCount}</strong> records you've added · <strong>{autoFoundCount}</strong> we found automatically · IQ Score change: <strong>{scoreDelta >= 0 ? '+' : ''}{scoreDelta}</strong>
    </Text>
    {qualifiesForCert ? (
      <>
        <Text style={text}>
          You qualify for your <strong>Home Health Certification</strong>. Claim it now and unlock
          insurance partner discounts.
        </Text>
        <Button href={`${APP_URL}/certification`} style={button}>Get Certified</Button>
      </>
    ) : (
      <>
        <Text style={text}>
          You're <strong>{pointsToCert ?? 0} points</strong> from your Home Health Certification.
          Here's your fastest path.
        </Text>
        <Button href={`${APP_URL}/dashboard?tab=missing`} style={button}>See what's needed</Button>
      </>
    )}
  </Shell>
)

export const template = {
  component: Email,
  subject: "You've been documenting your home for 30 days.",
  displayName: 'Onboarding Day 30 — Milestone',
  previewData: { addedCount: 8, autoFoundCount: 14, scoreDelta: 22, currentScore: 78, qualifiesForCert: false, pointsToCert: 7 },
} satisfies TemplateEntry
