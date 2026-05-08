import * as React from 'npm:react@18.3.1'
import { Shell, Heading, Text, Button, h1, text, card, button, APP_URL } from './_layout.tsx'
import type { TemplateEntry } from './registry.ts'

const Email = () => (
  <Shell preview="What homeowners discovered in their first week">
    <Heading style={h1}>What homeowners discovered in their first week</Heading>
    <Text style={card}>
      A homeowner in Texas discovered an open electrical permit from 2019 that
      had never been finalized — the previous owner had sold without closing it out.
    </Text>
    <Text style={card}>
      A homeowner in Florida discovered their property had been re-mapped into
      a higher-risk flood zone in 2022 — their insurance hadn't reflected it.
    </Text>
    <Text style={card}>
      A homeowner in Ohio discovered their water heater warranty was 4 months
      from expiring — and used the claim assistant to file before it lapsed.
    </Text>
    <Text style={text}>Your home's record is pulling in the same kinds of details right now.</Text>
    <Button href={`${APP_URL}/property`} style={button}>See what's in your home's record</Button>
  </Shell>
)

export const template = {
  component: Email,
  subject: 'What homeowners discovered in their first week',
  displayName: 'Onboarding Day 2 — Social Proof',
  previewData: {},
} satisfies TemplateEntry
