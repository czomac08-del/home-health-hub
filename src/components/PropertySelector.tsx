import { useEffect, useRef, useState } from "react";
import { Home, ChevronDown, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActiveProperty } from "@/hooks/useActiveProperty";

interface Props {
  /** Compact pill style (header) vs full-width banner style. */
  variant?: "pill" | "banner";
  className?: string;
}

/**
 * Global property selector. Renders as a pill (in headers) or full-width
 * banner (below nav). On a single property it renders as static text.
 */
const PropertySelector = ({ variant = "pill", className = "" }: Props) => {
  const { activeProperty, properties, setActiveProperty } = useActiveProperty();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasMultiple = properties.length > 1;
  const label = activeProperty?.label || "My Home";
  const address = activeProperty?.address || "No property added";

  const triggerClass =
    variant === "banner"
      ? "w-full flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground hover:bg-muted/70 transition-colors"
      : "flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-foreground hover:bg-muted/80 transition-colors max-w-full";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => hasMultiple && setOpen((o) => !o)}
        className={triggerClass}
        aria-haspopup={hasMultiple ? "listbox" : undefined}
        aria-expanded={hasMultiple ? open : undefined}
      >
        <Home className="h-3.5 w-3.5 text-primary shrink-0" />
        {variant === "banner" ? (
          <span className="text-sm text-foreground truncate flex-1 text-left">
            <span className="text-muted-foreground">Viewing:</span>{" "}
            <span className="font-medium">{address}</span>
          </span>
        ) : (
          <>
            <span className="font-heading font-bold truncate shrink-0">{label}</span>
            <span className="text-muted-foreground text-xs hidden xl:inline truncate min-w-0">— {address}</span>
          </>
        )}
        {hasMultiple && <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />}
      </button>

      {open && hasMultiple && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1 rounded-xl border border-border bg-card shadow-lg py-1 min-w-[260px] ${
            variant === "banner" ? "left-0 right-0" : "left-1/2 -translate-x-1/2"
          }`}
        >
          {properties.map((p) => {
            const active = p.id === activeProperty?.id;
            return (
              <button
                key={p.id}
                role="option"
                aria-selected={active}
                onClick={() => {
                  setActiveProperty(p.id);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-sm text-left flex items-start gap-2 hover:bg-muted ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Home className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate ${active ? "font-semibold text-foreground" : ""}`}>{p.label || "Home"}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                </div>
                {active && (
                  <span className="flex items-center gap-1 text-xs text-primary font-medium shrink-0">
                    <Check className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </button>
            );
          })}
          <div className="border-t border-border mt-1">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/onboarding");
              }}
              className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 text-primary hover:bg-muted font-medium"
            >
              <Plus className="h-4 w-4" /> Add Property
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertySelector;