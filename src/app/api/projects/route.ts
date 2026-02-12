import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";

// ---------------------------------------------------------------------------
// GET /api/projects — list all live projects (public, no auth required)
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const liveProjects = await db
      .select({
        id: projects.id,
        slug: projects.slug,
        name: projects.name,
        description: projects.description,
        longDescription: projects.longDescription,
        githubUrl: projects.githubUrl,
        category: projects.category,
        language: projects.language,
        stars: projects.stars,
        port: projects.port,
        status: projects.status,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.status, "live"));

    return NextResponse.json({ projects: liveProjects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
