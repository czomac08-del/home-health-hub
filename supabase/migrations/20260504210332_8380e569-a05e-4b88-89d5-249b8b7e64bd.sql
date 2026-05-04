ALTER TABLE public.legal_acknowledgments
  ADD COLUMN IF NOT EXISTS fcra_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS not_professional_advice_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_version text NOT NULL DEFAULT '1.0.0';