import { FileText, ExternalLink } from "lucide-react";

interface LegalFlagAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface LegalFlagProps {
  title: string;
  description: string;
  context: string;
  actions?: LegalFlagAction[];
}

const LegalFlag = ({ title, description, context, actions = [] }: LegalFlagProps) => (
  <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
    <div className="flex items-start gap-3">
      <FileText className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed">{description}</p>
      </div>
    </div>

    <p className="text-xs text-muted-foreground leading-relaxed">{context}</p>

    {actions.length > 0 && (
      <div className="flex flex-wrap gap-2 pt-1">
        {actions.map((a, i) => (
          a.href ? (
            <a
              key={i}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
            >
              {a.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <button
              key={i}
              onClick={a.onClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
            >
              {a.label}
            </button>
          )
        ))}
      </div>
    )}

    <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-1">
      ComingHomeIQ provides property information and record research tools. We are not a law firm and nothing in this app constitutes legal advice. For questions about your legal rights or obligations, please consult a licensed attorney in your state.
    </p>
  </div>
);

export default LegalFlag;
