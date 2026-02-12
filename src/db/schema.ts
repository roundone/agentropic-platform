import {
  pgTable,
  pgEnum,
  text,
  serial,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userTierEnum = pgEnum("user_tier", [
  "trial",
  "explorer",
  "unlimited",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "pending_review",
  "onboarding",
  "live",
  "deprecated",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "launching",
  "running",
  "stopped",
  "destroyed",
  "error",
]);

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID (e.g. user_2abc...)
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  tier: userTierEnum("tier").notNull().default("trial"),
  trialSessionsUsed: integer("trial_sessions_used").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ---------------------------------------------------------------------------
// projects
// ---------------------------------------------------------------------------

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    longDescription: text("long_description"),
    githubUrl: text("github_url"),
    category: text("category"),
    language: text("language"),
    stars: integer("stars").default(0),
    imageTag: text("image_tag"),
    port: integer("port").default(3000),
    healthCheckPath: text("health_check_path").default("/"),
    status: projectStatusEnum("status").notNull().default("pending_review"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("projects_slug_idx").on(table.slug),
  ],
);

// ---------------------------------------------------------------------------
// sessions
// ---------------------------------------------------------------------------

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // nanoid generated at insert time
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }),
    flyMachineId: text("fly_machine_id"),
    flyAppName: text("fly_app_name"),
    status: sessionStatusEnum("status").notNull().default("launching"),
    sessionUrl: text("session_url"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    stoppedAt: timestamp("stopped_at", { withTimezone: true }),
    apiSpendCents: integer("api_spend_cents").notNull().default(0),
    apiBudgetCents: integer("api_budget_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_project_id_idx").on(table.projectId),
    index("sessions_status_idx").on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// subscriptions
// ---------------------------------------------------------------------------

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  stripePriceId: text("stripe_price_id").notNull(),
  status: text("status").notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true })
    .notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ---------------------------------------------------------------------------
// Type exports (for use in application code)
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
