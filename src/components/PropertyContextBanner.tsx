import { useAuth } from "@/contexts/AuthContext";
import PropertySelector from "./PropertySelector";

/**
 * Slim global banner shown beneath the main nav on authenticated screens.
 * Confirms which property is currently active. Hidden when the user has
 * no property yet.
 */
const PropertyContextBanner = () => {
  const { activeProperty, properties } = useAuth();
  if (!activeProperty || properties.length === 0) return null;

  return (
    <div className="border-b border-border bg-[hsl(var(--bg-secondary))]/60">
      <div className="max-w-lg lg:max-w-6xl mx-auto px-4 py-2">
        <PropertySelector variant="banner" />
      </div>
    </div>
  );
};

export default PropertyContextBanner;