import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Hr, Link,
} from 'npm:@react-email/components@0.0.22'

export const SITE_NAME = 'ComingHomeIQ'
export const APP_URL = 'https://cominghomeiq.com'
export const PRIMARY = '#F47920'
export const NAVY = '#1B3A8C'

export const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }
export const container = { padding: '32px 24px', maxWidth: '560px' }
export const brand = { color: NAVY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', margin: '0 0 24px' }
export const h1 = { color: '#0F172A', fontSize: '24px', fontWeight: 800, lineHeight: '1.3', margin: '0 0 16px' }
export const text = { color: '#334155', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px' }
export const small = { color: '#64748B', fontSize: '13px', lineHeight: '1.5', margin: '24px 0 0' }
export const button = {
  backgroundColor: PRIMARY, color: '#ffffff', borderRadius: '12px',
  padding: '14px 24px', fontWeight: 700, fontSize: '15px', textDecoration: 'none',
  display: 'inline-block',
}
export const card = {
  backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px 20px',
  margin: '0 0 16px', borderLeft: `3px solid ${PRIMARY}`,
}
export const hr = { borderColor: '#E2E8F0', margin: '24px 0' }

export interface ShellProps {
  preview: string
  children: React.ReactNode
}

export const Shell = ({ preview, children }: ShellProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>COMINGHOMEIQ</Text>
        {children}
        <Hr style={hr} />
        <Text style={small}>
          You're receiving this because you have a {SITE_NAME} account. {' '}
          <Link href={`${APP_URL}/profile?tab=email`} style={{ color: NAVY }}>Manage email preferences</Link>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export { Heading, Text, Button, Section, Hr, Link }
