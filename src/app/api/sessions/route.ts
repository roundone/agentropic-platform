import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, projects, sessions } from "@/db/schema";
import { TIER_LIMITS, type TierName } from "@/lib/constants";
import { createMachine } from "@/server/fly/client";

// ---------------------------------------------------------------------------
// Fly.io app name — all user session machines live in a single fly app.
// Set via env var; defaults to "agentropic-sessions".
// ---------------------------------------------------------------------------
const FLY_APP_NAME = process.env.FLY_APP_NAME ?? "agentropic-sessions";

// ---------------------------------------------------------------------------
// POST /api/sessions — launch a new session
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse request body
    const body = await request.json() as { projectSlug?: string };
    const { projectSlug } = body;

    if (!projectSlug) {
      return NextResponse.json(
        { error: "projectSlug is required" },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // 1. Fetch user from our DB
    // ------------------------------------------------------------------
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please sign up first." },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------------
    // 2. Fetch the requested project
    // ------------------------------------------------------------------
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, projectSlug), eq(projects.status, "live")))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not available" },
        { status: 404 },
      );
    }

    if (!project.imageTag) {
      return NextResponse.json(
        { error: "Project image is not configured" },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------------
    // 3. Check tier limits
    // ------------------------------------------------------------------
    const tier = user.tier as TierName;
    const limits = TIER_LIMITS[tier];

    // 3a. Check lifetime / monthly session cap
    if (tier === "trial") {
      if (user.trialSessionsUsed >= limits.maxSessions) {
        return NextResponse.json(
          {
            error: "Trial session limit reached. Upgrade to continue.",
            code: "TRIAL_LIMIT_REACHED",
          },
          { status: 403 },
        );
      }
    }

    // 3b. Check concurrent sessions (max 1 running at a time for all tiers)
    const activeSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.status, "running"),
        ),
      );

    if (activeSessions.length > 0) {
      return NextResponse.json(
        {
          error: "You already have an active session. Stop it before starting a new one.",
          code: "CONCURRENT_LIMIT",
          activeSessionId: activeSessions[0].id,
        },
        { status: 409 },
      );
    }

    // ------------------------------------------------------------------
    // 4. Create the fly.io machine
    // ------------------------------------------------------------------
    const machine = await createMachine(FLY_APP_NAME, {
      image: project.imageTag,
      port: project.port ?? 80,
      env: {
        AGENTROPIC_PROJECT: project.slug,
      },
      resources: {
        cpus: 1,
        memoryMb: 256,
      },
    });

    // ------------------------------------------------------------------
    // 5. Insert session record
    // ------------------------------------------------------------------
    const sessionId = crypto.randomUUID();
    const routerBase = process.env.FLY_ROUTER_URL ?? "https://agentropic-router.fly.dev";
    const sessionUrl = `${routerBase}/init/${machine.id}`;

    await db.insert(sessions).values({
      id: sessionId,
      userId,
      projectId: project.id,
      flyMachineId: machine.id,
      flyAppName: FLY_APP_NAME,
      status: "running",
      sessionUrl,
      apiBudgetCents: limits.apiBudgetCents,
    });

    // ------------------------------------------------------------------
    // 6. Increment trial usage if applicable
    // ------------------------------------------------------------------
    if (tier === "trial") {
      await db
        .update(users)
        .set({ trialSessionsUsed: user.trialSessionsUsed + 1 })
        .where(eq(users.id, userId));
    }

    return NextResponse.json({
      sessionId,
      sessionUrl,
      machineId: machine.id,
      projectSlug: project.slug,
    });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to launch session" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/sessions — list current user's sessions
// ---------------------------------------------------------------------------

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userSessions = await db
      .select({
        id: sessions.id,
        projectId: sessions.projectId,
        status: sessions.status,
        sessionUrl: sessions.sessionUrl,
        startedAt: sessions.startedAt,
        stoppedAt: sessions.stoppedAt,
        apiSpendCents: sessions.apiSpendCents,
        apiBudgetCents: sessions.apiBudgetCents,
      })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt));

    return NextResponse.json({ sessions: userSessions });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
