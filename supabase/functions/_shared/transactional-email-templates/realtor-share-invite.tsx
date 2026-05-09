import * as React from 'npm:react@18.3.1'
import { Heading, Text, Button, Hr, Link, Shell, h1, text, button, card, small, hr, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props {
  ownerName?: string
  recipientName?: string
  propertyAddress?: string
  shareUrl: string
  expiresOn?: string
  message?: string
}

const Email = ({ ownerName, recipientName, propertyAddress, shareUrl, expiresOn, message }: Props) => (
  <Shell preview={`${ownerName || 'A homeowner'} shared their property record with you`}>
    <Heading style={h1}>
      {recipientName ? `Hi ${recipientName},` : 'Hello,'}
    </Heading>
    <Text style={text}>
      <strong>{ownerName || 'A homeowner'}</strong> has shared their property record
      {propertyAddress ? <> for <strong>{propertyAddress}</strong></> : null} with you on ComingHomeIQ.
    </Text>
    {message ? (
      <Text style={card}>"{message}"</Text>
    ) : null}
    <Text style={text}>
      The package includes inspection reports, warranties, permits, disclosures, and system records — everything you need to evaluate or list the property.
    </Text>
    <Button href={shareUrl} style={button}>View Property Record</Button>
    <Text style={{ ...text, fontSize: '13px', color: '#64748B', marginTop: '16px' }}>
      ComingHomeIQ helps homeowners build a verified, document-backed record of their home —
      so when it's time to sell, everything's ready.
    </Text>
    {expiresOn ? (
      <Text style={{ ...small, marginTop: '8px' }}>This link expires on {expiresOn}.</Text>
    ) : null}
    <Hr style={hr} />
    <Text style={small}>
      Want to manage disclosures and request documents from any homeowner?{' '}
      <Link href={`${APP_URL}/realtor`} style={{ color: '#1B3A8C' }}>cominghomeiq.com/realtor</Link>
    </Text>
  </Shell>
)

export const template = {
  component: Email,
  subject: (d: Props) =>
    `${d.ownerName || 'A homeowner'} shared a property record with you${d.propertyAddress ? ` — ${d.propertyAddress}` : ''}`,
  displayName: 'Realtor Share Invite',
  previewData: {
    ownerName: 'Chance Anderson',
    recipientName: 'Sarah',
    propertyAddress: '123 Main St, Austin, TX',
    shareUrl: 'https://cominghomeiq.com/share/example-token',
    expiresOn: 'Dec 15, 2026',
    message: "Here's the full record for the Main St property.",
  },
} satisfies TemplateEntry