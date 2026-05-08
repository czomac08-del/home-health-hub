import * as React from 'npm:react@18.3.1'
import { Shell, Heading, Text, Button, h1, text, card, button, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  firstName?: string
  hasAddress?: boolean
  address?: string
  floodZone?: string
  nearestStorm?: string
  permitCount?: number
}

const Email = ({ firstName, hasAddress, address, floodZone, nearestStorm, permitCount }: Props) => (
  <Shell preview={hasAddress ? `Here's what we found about ${address || 'your home'}` : 'Add your home and we\'ll pull the public record'}>
    <Heading style={h1}>
      Welcome{firstName ? `, ${firstName}` : ''}.{' '}
      {hasAddress ? `Here's what we found about your home.` : `Let's find your home.`}
    </Heading>
    {hasAddress ? (
      <>
        <Text style={text}>We pulled the first records from public sources for {address || 'your address'}:</Text>
        {floodZone && <Text style={card}><strong>FEMA flood zone:</strong> {floodZone}</Text>}
        {nearestStorm && <Text style={card}><strong>Nearest NOAA storm event:</strong> {nearestStorm}</Text>}
        {typeof permitCount === 'number' && (
          <Text style={card}><strong>Permits on file:</strong> {permitCount}</Text>
        )}
        <Button href={`${APP_URL}/property`} style={button}>See your home's full record</Button>
      </>
    ) : (
      <>
        <Text style={text}>
          Your account is ready. Add your home address and we'll pull everything we know about it
          from public records in about 30 seconds.
        </Text>
        <Button href={`${APP_URL}/dashboard`} style={button}>Add My Home</Button>
      </>
    )}
  </Shell>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Welcome${d.firstName ? `, ${d.firstName}` : ''}. Here's what we found about your home.`,
  displayName: 'Onboarding Day 1 — Welcome',
  previewData: { firstName: 'Jane', hasAddress: true, address: '123 Main St', floodZone: 'Zone X (minimal risk)', nearestStorm: 'Hail event, 4.2 mi away (2023)', permitCount: 7 },
} satisfies TemplateEntry
