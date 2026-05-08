import * as React from 'npm:react@18.3.1'
import { Shell, Heading, Text, Button, h1, text, card, button, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  stormCount?: number
  warrantyCount?: number
}

const Email = ({ stormCount = 0, warrantyCount = 0 }: Props) => (
  <Shell preview="Your home didn't stop changing while you were away">
    <Heading style={h1}>Your home didn't stop changing while you were away.</Heading>
    <Text style={text}>Since you last logged in:</Text>
    <Text style={card}>FEMA updates flood zone maps periodically — yours may have changed.</Text>
    <Text style={card}>NOAA has recorded <strong>{stormCount}</strong> storm events near your area.</Text>
    <Text style={card}><strong>{warrantyCount}</strong> of your warranties are now closer to expiration.</Text>
    <Text style={text}>Your home's record is waiting for you.</Text>
    <Button href={`${APP_URL}/dashboard`} style={button}>See what's changed</Button>
  </Shell>
)

export const template = {
  component: Email,
  subject: "Your home didn't stop changing while you were away.",
  displayName: 'Re-engagement — 45 days',
  previewData: { stormCount: 3, warrantyCount: 2 },
} satisfies TemplateEntry
