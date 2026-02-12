import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { ProjectCard } from "@/components/projects/project-card";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore AI Projects - Agentropic",
  description:
    "Browse and try trending open-source AI agent projects instantly in your browser.",
};

export default async function ProjectsPage() {
  const allProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "live"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Explore AI Projects
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Browse our curated collection of trending open-source AI tools. Each
          one is ready to try in your browser -- no setup required.
        </p>
      </div>

      {/* Project Grid */}
      {allProjects.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-20 flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Search className="size-7 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">No projects yet</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            We&apos;re onboarding new AI projects every day. Check back soon or
            sign up to get notified when new projects go live.
          </p>
        </div>
      )}
    </div>
  );
}
