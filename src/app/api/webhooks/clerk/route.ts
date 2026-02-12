import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// ---------------------------------------------------------------------------
// Clerk Webhook Handler — POST /api/webhooks/clerk
//
// Handles:
//   - user.created  → insert user into our Neon DB
//   - user.updated  → update user in our Neon DB
//
// Webhook verification uses the Svix library, which is Clerk's recommended
// approach. Install it with:
//
//   npm install svix
//
// Then set the CLERK_WEBHOOK_SECRET env var to the signing secret from
// Clerk Dashboard → Webhooks → your endpoint → Signing Secret.
// ---------------------------------------------------------------------------

// NOTE: svix package is required for webhook verification.
// Install with: npm install svix
// import { Webhook } from "svix";

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserEventData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserEventData;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPrimaryEmail(data: ClerkUserEventData): string {
  const primary = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id,
  );
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? "";
}

function getFullName(data: ClerkUserEventData): string | null {
  const parts = [data.first_name, data.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

// ---------------------------------------------------------------------------
// Webhook verification
// ---------------------------------------------------------------------------

async function verifyWebhook(request: Request): Promise<ClerkWebhookEvent> {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET environment variable is not set");
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing svix verification headers");
  }

  const body = await request.text();

  // Dynamic import to avoid build errors if svix is not yet installed.
  // Install svix: npm install svix
  const { Webhook } = await import("svix");
  const wh = new Webhook(WEBHOOK_SECRET);

  // verify() throws if the signature is invalid
  const event = wh.verify(body, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  }) as ClerkWebhookEvent;

  return event;
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/clerk
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let event: ClerkWebhookEvent;

  try {
    event = await verifyWebhook(request);
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      // ----------------------------------------------------------------
      // user.created — new Clerk user signed up
      // ----------------------------------------------------------------
      case "user.created": {
        const email = getPrimaryEmail(event.data);
        const name = getFullName(event.data);

        await db.insert(users).values({
          id: event.data.id,
          email,
          name,
          imageUrl: event.data.image_url,
          tier: "trial",
          trialSessionsUsed: 0,
        });

        console.log(`[clerk-webhook] Created user ${event.data.id} (${email})`);
        break;
      }

      // ----------------------------------------------------------------
      // user.updated — Clerk user profile changed
      // ----------------------------------------------------------------
      case "user.updated": {
        const email = getPrimaryEmail(event.data);
        const name = getFullName(event.data);

        await db
          .update(users)
          .set({
            email,
            name,
            imageUrl: event.data.image_url,
          })
          .where(eq(users.id, event.data.id));

        console.log(`[clerk-webhook] Updated user ${event.data.id} (${email})`);
        break;
      }

      default:
        // Ignore events we don't handle
        console.log(`[clerk-webhook] Ignoring event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
