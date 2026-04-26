import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

const HOMEOWNER_PRO_MONTHLY = 9.99;

/**
 * Interactive ROI calculator for the homepage. Three inputs drive a single
 * estimated-savings number plus a "free months of Homeowner Pro" framing.
 *
 * Numbers are conservative industry averages — this is a marketing tool,
 * not a guarantee, and we surface that in the disclaimer.
 */
export default function SavingsCalculator() {
  const [price, setPrice] = useState(450_000);
  const [findings, setFindings] = useState(15);
  const [diy, setDiy] = useState(false);

  const savings = useMemo(() => {
    // Per-finding negotiation credit: $300 conservative.
    const negotiation = findings * 300;
    // Permit / disclosure intelligence: ~0.3% of price avoided in surprises.
    const disclosure = Math.round(price * 0.003);
    // DIY repair savings: $150 per finding the user can DIY.
    const diyBonus = diy ? findings * 150 : 0;
    return negotiation + disclosure + diyBonus;
  }, [price, findings, diy]);

  const freeMonths = Math.floor(savings / HOMEOWNER_PRO_MONTHLY);

  return (
    <Card className="p-6 lg:p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="flex items-center gap-3 mb-2">
        <Calculator className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-heading font-bold">See What You'd Save</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Drag the sliders to your situation. The estimate updates live.
      </p>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2 text-sm font-semibold">
            <span>Home purchase price</span>
            <span className="text-primary">${price.toLocaleString()}</span>
          </div>
          <Slider
            min={100_000}
            max={1_000_000}
            step={10_000}
            value={[price]}
            onValueChange={(v) => setPrice(v[0])}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2 text-sm font-semibold">
            <span>Inspection findings</span>
            <span className="text-primary">{findings}</span>
          </div>
          <Slider
            min={5}
            max={50}
            step={1}
            value={[findings]}
            onValueChange={(v) => setFindings(v[0])}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40">
          <div>
            <p className="font-semibold">Plan to DIY any repairs?</p>
            <p className="text-xs text-muted-foreground">We'll add the labor savings.</p>
          </div>
          <Switch checked={diy} onCheckedChange={setDiy} />
        </div>
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-primary/10 text-center">
        <p className="text-sm text-muted-foreground">Estimated savings with ComingHomeIQ</p>
        <p className="text-4xl lg:text-5xl font-heading font-extrabold text-primary mt-1">
          ${savings.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          That's <span className="font-semibold text-foreground">{freeMonths.toLocaleString()} months</span> of Homeowner Pro — free.
        </p>
      </div>

      <Link to="/auth?signup=1" className="block mt-6">
        <Button size="lg" className="w-full text-base h-12">
          Start Saving — First Month Free
          <ArrowRight className="h-5 w-5 ml-1" />
        </Button>
      </Link>
      <p className="text-xs text-muted-foreground text-center mt-3">
        Estimate based on industry averages; your actual savings depend on the property, market, and repairs.
      </p>
    </Card>
  );
}