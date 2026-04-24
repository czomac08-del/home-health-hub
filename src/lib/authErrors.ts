/**
 * Translates Supabase Auth errors into friendly, plain-English messages.
 */
export function friendlyAuthError(err: unknown): string {
  const raw = (err instanceof Error ? err.message : String(err || "")).toLowerCase();

  if (raw.includes("invalid login credentials") || raw.includes("invalid_credentials")) {
    return "That email or password doesn't look right. Try again.";
  }
  if (raw.includes("email not confirmed") || raw.includes("email_not_confirmed")) {
    return "Please verify your email first. Check your inbox for the confirmation link.";
  }
  if (raw.includes("user already registered") || raw.includes("already been registered")) {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (raw.includes("password should be at least")) {
    return "Your password needs to be at least 6 characters.";
  }
  if (raw.includes("pwned") || raw.includes("compromised")) {
    return "That password has appeared in a known data breach. Please choose a different one.";
  }
  if (raw.includes("rate limit") || raw.includes("too many requests")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (raw.includes("token has expired") || raw.includes("expired") || raw.includes("invalid token")) {
    return "That link has expired or already been used. Please request a new one.";
  }
  if (raw.includes("otp") && raw.includes("invalid")) {
    return "That code is incorrect or has expired. Try again or request a new one.";
  }
  if (raw.includes("network") || raw.includes("fetch")) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  if (raw.includes("same password")) {
    return "Your new password must be different from your old one.";
  }
  if (!raw) return "Something went wrong. Please try again.";
  // Capitalize first letter, strip trailing period
  const original = err instanceof Error ? err.message : String(err);
  return original.charAt(0).toUpperCase() + original.slice(1).replace(/\.$/, "");
}

/**
 * Generates a stable browser device fingerprint stored in localStorage.
 * Used to recognize "trusted devices" for 2FA skip.
 */
const DEVICE_TOKEN_KEY = "chiq_device_token";

export function getDeviceToken(): string {
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

export function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  let os = "Device";
  if (/Mac/i.test(ua)) os = "Mac";
  else if (/Windows/i.test(ua)) os = "Windows PC";
  else if (/iPhone/i.test(ua)) os = "iPhone";
  else if (/iPad/i.test(ua)) os = "iPad";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  return `${os} · ${browser}`;
}