// ---------------------------------------------------------------------------
// Tier limits
// ---------------------------------------------------------------------------

export type TierName = "trial" | "explorer" | "unlimited";

export interface TierLimit {
  /** Max sessions allowed. -1 means unlimited. For trial, this is a lifetime cap. */
  maxSessions: number;
  /** Max session duration in minutes. */
  sessionMinutes: number;
  /** Per-session AI API budget in cents. */
  apiBudgetCents: number;
  /** Whether the user's container state persists between visits. */
  persistence: boolean;
}

export const TIER_LIMITS: Record<TierName, TierLimit> = {
  trial: {
    maxSessions: 3, // 3 total, lifetime
    sessionMinutes: 20,
    apiBudgetCents: 150,
    persistence: false,
  },
  explorer: {
    maxSessions: 15, // 15 per month
    sessionMinutes: 60,
    apiBudgetCents: 200,
    persistence: true,
  },
  unlimited: {
    maxSessions: -1, // unlimited
    sessionMinutes: 120,
    apiBudgetCents: 500,
    persistence: true,
  },
} as const;
