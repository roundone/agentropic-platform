import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { TIER_LIMITS, type TierName } from "@/lib/constants";
import {
  getMachine,
  stopMachine,
  destroyMachine,
} from "@/server/fly/client";

// ---------------------------------------------------------------------------
// GET /api/sessions/:id — get a specific session's status
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 },
      );
    }

    // If the session is running, also fetch live status from fly.io
    let machineState: string | null = null;
    if (
      session.flyMachineId &&
      session.flyAppName &&
      (session.status === "running" || session.status === "launching")
    ) {
      try {
        const machine = await getMachine(
          session.flyAppName,
          session.flyMachineId,
        );
        machineState = machine.state;
      } catch {
        // If we can't reach fly.io, still return our DB status
        machineState = null;
      }
    }

    return NextResponse.json({
      session: {
        id: session.id,
        projectId: session.projectId,
        status: session.status,
        sessionUrl: session.sessionUrl,
        startedAt: session.startedAt,
        stoppedAt: session.stoppedAt,
        apiSpendCents: session.apiSpendCents,
        apiBudgetCents: session.apiBudgetCents,
        flyMachineState: machineState,
      },
    });
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/sessions/:id — stop or destroy a session
//
// Behaviour depends on user tier:
//   - Trial users: machine is destroyed (no persistence)
//   - Paid users (explorer/unlimited): machine is stopped (state preserved)
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // ------------------------------------------------------------------
    // 1. Fetch session (must belong to the requesting user)
    // ------------------------------------------------------------------
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 },
      );
    }

    if (session.status === "destroyed" || session.status === "stopped") {
      return NextResponse.json({
        message: `Session is already ${session.status}`,
        session: { id: session.id, status: session.status },
      });
    }

    // ------------------------------------------------------------------
    // 2. Determine action based on user tier
    // ------------------------------------------------------------------
    const [user] = await db
      .select({ tier: users.tier })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const tier = (user?.tier ?? "trial") as TierName;
    const shouldPersist = TIER_LIMITS[tier].persistence;

    // ------------------------------------------------------------------
    // 3. Stop or destroy the fly.io machine
    // ------------------------------------------------------------------
    if (session.flyMachineId && session.flyAppName) {
      try {
        if (shouldPersist) {
          await stopMachine(session.flyAppName, session.flyMachineId);
        } else {
          await destroyMachine(session.flyAppName, session.flyMachineId);
        }
      } catch (error) {
        console.error("Failed to stop/destroy fly machine:", error);
        // Continue to update DB status even if fly.io call fails —
        // a background cleanup job can reconcile later.
      }
    }

    // ------------------------------------------------------------------
    // 4. Update session record
    // ------------------------------------------------------------------
    const newStatus = shouldPersist ? "stopped" : "destroyed";

    await db
      .update(sessions)
      .set({
        status: newStatus,
        stoppedAt: new Date(),
      })
      .where(eq(sessions.id, id));

    return NextResponse.json({
      message: shouldPersist
        ? "Session stopped. Your state is preserved."
        : "Session ended and resources released.",
      session: { id: session.id, status: newStatus },
    });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
