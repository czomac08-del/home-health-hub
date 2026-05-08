import * as React from 'npm:react@18.3.1'
import { Shell, Heading, Text, Button, h1, text, button, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

interface Props { propertyType?: 'well' | 'urban' | 'default'; deepLink?: string }

const COPY: Record<string, { title: string; body: string; link: string }> = {
  well: {
    title: 'Your Well Water Manager',
    body: 'Tracks well depth, water quality tests, filtration components, and reminds you when each test is due. Most homeowners never realize how much detail belongs in one place.',
    link: '/water',
  },
  urban: {
    title: 'Your AI Coverage Gap Analyzer',
    body: 'Reads your insurance policy and flags holes — sub-limits, exclusions, and missing endorsements that most homeowners only discover at claim time.',
    link: '/insurance',
  },
  default: {
    title: 'Your Breaker Panel Mapper',
    body: 'Builds a digital map of your electrical panel — what each breaker controls, which are tripped, which are dual-purpose. Print it and tape it inside the panel door.',
    link: '/electrical',
  },
}

const Email = ({ propertyType = 'default', deepLink }: Props) => {
  const c = COPY[propertyType] || COPY.default
  return (
    <Shell preview="One thing most homeowners haven't found yet">
      <Heading style={h1}>One thing most homeowners haven't found yet</Heading>
      <Text style={text}><strong>{c.title}</strong></Text>
      <Text style={text}>{c.body}</Text>
      <Button href={`${APP_URL}${deepLink || c.link}`} style={button}>Try it now</Button>
    </Shell>
  )
}

export const template = {
  component: Email,
  subject: "One thing most homeowners haven't found yet",
  displayName: 'Onboarding Day 3 — Hidden Feature',
  previewData: { propertyType: 'default' },
} satisfies TemplateEntry
