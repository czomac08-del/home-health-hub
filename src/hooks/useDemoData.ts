import { useState, useCallback } from "react";

const DEMO_DISMISSED_KEY = "home-passport-demo-dismissed";

export function useDemoData(role: string) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      const val = localStorage.getItem(DEMO_DISMISSED_KEY);
      if (!val) return false;
      const parsed = JSON.parse(val);
      return !!parsed[role];
    } catch { return false; }
  });

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      const val = localStorage.getItem(DEMO_DISMISSED_KEY);
      const parsed = val ? JSON.parse(val) : {};
      parsed[role] = true;
      localStorage.setItem(DEMO_DISMISSED_KEY, JSON.stringify(parsed));
    } catch {}
  }, [role]);

  return { showDemo: !dismissed, dismissDemo: dismiss };
}

export function clearAllDemoData() {
  localStorage.removeItem(DEMO_DISMISSED_KEY);
}

export function dismissAllDemoData() {
  const roles = ["realtor", "inspector", "contractor", "investor"];
  const obj: Record<string, boolean> = {};
  roles.forEach(r => obj[r] = true);
  localStorage.setItem(DEMO_DISMISSED_KEY, JSON.stringify(obj));
}
