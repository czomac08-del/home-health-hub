import { useEffect, useRef, useState } from "react";
import { Home, ChevronDown, Check, Plus, X } from "lucide-react";
import { useActiveProperty } from "@/hooks/useActiveProperty";
import AddPropertyForm from "@/components/AddPropertyForm";

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
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
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
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1 rounded-xl border border-border bg-card shadow-lg py-1 min-w-[260px] ${
            variant === "banner" ? "left-0 right-0" : "left-1/2 -translate-x-1/2"
          }`}
        >
          {properties.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted-foreground">No properties yet.</p>
          )}
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
                setAddOpen(true);
              }}
              className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 text-primary hover:bg-muted font-medium"
            >
              <Plus className="h-4 w-4" /> Add a Property
            </button>
          </div>
        </div>
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-sm flex justify-end animate-fade-in"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-md h-full bg-card border-l border-border shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-heading font-bold text-lg text-foreground">Add a Property</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-6">
              <AddPropertyForm
                onSaved={() => setAddOpen(false)}
                submitLabel="Add Property"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertySelector;