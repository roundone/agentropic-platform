import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { TIER_LIMITS, type TierName } from "@/lib/constants";
import { stopMachine, destroyMachine } from "@/server/fly/client";

// ---------------------------------------------------------------------------
// POST /api/sessions/:id/stop — stop a running session
//
// Called from the session view page when the user clicks "Stop Session".
// ---------------------------------------------------------------------------

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 1. Fetch session
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

    if (session.status === "stopped" || session.status === "destroyed") {
      return NextResponse.json({
        message: `Session is already ${session.status}`,
        status: session.status,
      });
    }

    // 2. Determine action based on user tier
    const [user] = await db
      .select({ tier: users.tier })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const tier = (user?.tier ?? "trial") as TierName;
    const shouldPersist = TIER_LIMITS[tier].persistence;

    // 3. Stop or destroy the fly.io machine
    if (session.flyMachineId && session.flyAppName) {
      try {
        if (shouldPersist) {
          await stopMachine(session.flyAppName, session.flyMachineId);
        } else {
          await destroyMachine(session.flyAppName, session.flyMachineId);
        }
      } catch (error) {
        console.error("Failed to stop/destroy fly machine:", error);
      }
    }

    // 4. Update session record
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
      status: newStatus,
    });
  } catch (error) {
    console.error("Failed to stop session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
