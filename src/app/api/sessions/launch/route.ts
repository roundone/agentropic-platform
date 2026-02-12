import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, projects, sessions } from "@/db/schema";
import { TIER_LIMITS, type TierName } from "@/lib/constants";
import { createMachine } from "@/server/fly/client";

const FLY_APP_NAME = process.env.FLY_APP_NAME ?? "agentropic-sessions";

// ---------------------------------------------------------------------------
// GET /api/sessions/launch?projectId=123
//
// Called when a user clicks "Launch Session" on a project detail page.
// Creates a fly.io machine, inserts a session record, and redirects to
// the session view page.
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const { userId } = await auth();
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  if (!userId) {
    return NextResponse.redirect(
      new URL(`/sign-in?redirect_url=${url.pathname}${url.search}`, url.origin),
    );
  }

  if (!projectId) {
    return NextResponse.redirect(new URL("/projects", url.origin));
  }

  try {
    // 1. Fetch user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.redirect(
        new URL("/dashboard?error=user_not_found", url.origin),
      );
    }

    // 2. Fetch project
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, Number(projectId)), eq(projects.status, "live")),
      )
      .limit(1);

    if (!project) {
      return NextResponse.redirect(
        new URL("/projects?error=project_not_found", url.origin),
      );
    }

    // 3. Check tier limits
    const tier = user.tier as TierName;
    const limits = TIER_LIMITS[tier];

    if (tier === "trial" && user.trialSessionsUsed >= limits.maxSessions) {
      return NextResponse.redirect(
        new URL("/dashboard?error=trial_limit", url.origin),
      );
    }

    // 4. Check concurrent sessions
    const activeSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(eq(sessions.userId, userId), eq(sessions.status, "running")),
      );

    if (activeSessions.length > 0) {
      return NextResponse.redirect(
        new URL(`/session/${activeSessions[0].id}`, url.origin),
      );
    }

    // 5. Create fly.io machine
    let machine;
    try {
      machine = await createMachine(FLY_APP_NAME, {
        image: project.imageTag ?? "nginx:alpine",
        port: project.port ?? 3000,
        env: {
          AGENTROPIC_PROJECT: project.slug,
        },
        resources: {
          cpus: 2,
          memoryMb: 2048,
        },
      });
    } catch (flyError) {
      console.error("Fly.io machine creation failed:", flyError);
      return NextResponse.redirect(
        new URL(
          `/projects/${project.slug}?error=launch_failed`,
          url.origin,
        ),
      );
    }

    // 6. Insert session record
    const sessionId = crypto.randomUUID();
    const sessionUrl = `https://${machine.id}.fly.dev`;

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

    // 7. Increment trial usage
    if (tier === "trial") {
      await db
        .update(users)
        .set({ trialSessionsUsed: user.trialSessionsUsed + 1 })
        .where(eq(users.id, userId));
    }

    // 8. Redirect to session page
    return NextResponse.redirect(new URL(`/session/${sessionId}`, url.origin));
  } catch (error) {
    console.error("Session launch error:", error);
    return NextResponse.redirect(
      new URL("/projects?error=launch_failed", url.origin),
    );
  }
}
