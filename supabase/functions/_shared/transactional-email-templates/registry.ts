/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as onboardingDay1 } from './onboarding-day-1.tsx'
import { template as onboardingDay2 } from './onboarding-day-2.tsx'
import { template as onboardingDay3 } from './onboarding-day-3.tsx'
import { template as onboardingDay7 } from './onboarding-day-7.tsx'
import { template as onboardingDay14 } from './onboarding-day-14.tsx'
import { template as onboardingDay30 } from './onboarding-day-30.tsx'
import { template as onboardingDay60 } from './onboarding-day-60.tsx'
import { template as pulseMonthly } from './pulse-monthly.tsx'
import { template as reengagement45 } from './reengagement-45.tsx'
import { template as reengagement60 } from './reengagement-60.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'onboarding-day-1': onboardingDay1,
  'onboarding-day-2': onboardingDay2,
  'onboarding-day-3': onboardingDay3,
  'onboarding-day-7': onboardingDay7,
  'onboarding-day-14': onboardingDay14,
  'onboarding-day-30': onboardingDay30,
  'onboarding-day-60': onboardingDay60,
  'pulse-monthly': pulseMonthly,
  'reengagement-45': reengagement45,
  'reengagement-60': reengagement60,
}
