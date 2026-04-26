import { useAuth } from "@/contexts/AuthContext";

/**
 * Thin adapter hook over AuthContext that exposes the globally selected
 * "active property" with a stable, focused API. Selection is persisted to
 * localStorage AND to profiles.active_property_id so it follows the user
 * across devices.
 */
export function useActiveProperty() {
  const { activeProperty, setActivePropertyId, properties, loading } = useAuth();
  return {
    activeProperty,
    properties,
    isLoading: loading,
    setActiveProperty: (id: string) => setActivePropertyId(id),
  };
}