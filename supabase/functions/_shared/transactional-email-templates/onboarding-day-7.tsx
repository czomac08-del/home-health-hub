import * as React from 'npm:react@18.3.1'
import { Shell, Heading, Text, Button, h1, text, card, button, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  street?: string
  floodZone?: string
  nearestDisaster?: string
  recordTypeCount?: number
}

const Email = ({ street, floodZone, nearestDisaster, recordTypeCount }: Props) => (
  <Shell preview={`3 things we found about ${street || 'your home'}`}>
    <Heading style={h1}>3 things we found about {street || 'your home'}</Heading>
    {floodZone && <Text style={card}><strong>FEMA flood zone:</strong> {floodZone}</Text>}
    {nearestDisaster && <Text style={card}><strong>Nearest disaster declaration:</strong> {nearestDisaster}</Text>}
    {typeof recordTypeCount === 'number' && (
      <Text style={card}><strong>Record types tracked so far:</strong> {recordTypeCount}</Text>
    )}
    <Text style={text}>This is just the start. Each verified record raises your Home IQ Score.</Text>
    <Button href={`${APP_URL}/dashboard`} style={button}>See your full Home IQ Score</Button>
  </Shell>
)

export const template = {
  component: Email,
  subject: (d: Props) => `3 things we found about ${d.street || 'your home'}`,
  displayName: 'Onboarding Day 7 — Home Summary',
  previewData: { street: '123 Main St', floodZone: 'Zone X', nearestDisaster: 'DR-4673 (2023)', recordTypeCount: 5 },
} satisfies TemplateEntry
