import * as React from 'npm:react@18.3.1'
import { Shell, Heading, Text, Button, h1, text, card, button, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  subjectLine?: string
  personalDataPoint?: string
  seasonalAction?: string
  seasonalActionLink?: string
  topGap?: string
  topGapLink?: string
  city?: string
}

const Email = ({ subjectLine, personalDataPoint, seasonalAction, seasonalActionLink, topGap, topGapLink, city }: Props) => (
  <Shell preview={subjectLine || 'Your monthly Home Health Pulse'}>
    <Heading style={h1}>{subjectLine || `Your monthly Home Health Pulse${city ? ` for ${city}` : ''}`}</Heading>
    {personalDataPoint && (
      <Text style={card}><strong>About your home:</strong> {personalDataPoint}</Text>
    )}
    {seasonalAction && (
      <>
        <Text style={text}><strong>This month's action</strong></Text>
        <Text style={card}>{seasonalAction}</Text>
        {seasonalActionLink && (
          <Button href={`${APP_URL}${seasonalActionLink}`} style={button}>Take action</Button>
        )}
      </>
    )}
    {topGap && (
      <>
        <Text style={text}><strong>One gap worth closing</strong></Text>
        <Text style={card}>{topGap}</Text>
        {topGapLink && (
          <Text style={text}>
            <a href={`${APP_URL}${topGapLink}`} style={{ color: '#1B3A8C' }}>Resolve in your dashboard →</a>
          </Text>
        )}
      </>
    )}
  </Shell>
)

export const template = {
  component: Email,
  subject: (d: Props) => d.subjectLine || 'Your monthly Home Health Pulse',
  displayName: 'Monthly Pulse',
  previewData: {
    subjectLine: '3 things to do before winter hits Denver',
    personalDataPoint: 'Your furnace is now 12 years old — average lifespan is 15-20.',
    seasonalAction: 'Replace your 16x25x1 HVAC filter (last changed 78 days ago).',
    seasonalActionLink: '/hvac',
    topGap: "Water heater serial number — needed for warranty lookup.",
    topGapLink: '/water?action=add-serial',
    city: 'Denver',
  },
} satisfies TemplateEntry
