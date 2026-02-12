import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Code2,
  Rocket,
  Lightbulb,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

function formatStars(count: number | null): string {
  if (!count) return "0";
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  if (!project) {
    return { title: "Project Not Found - Agentropic" };
  }

  return {
    title: `${project.name} - Try It on Agentropic`,
    description: project.description ?? `Try ${project.name} instantly in your browser.`,
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const { userId } = await auth();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back Link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </Link>

      {/* Project Header */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          {project.category && (
            <Badge variant="secondary">{project.category}</Badge>
          )}
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="size-4 fill-current" />
            {formatStars(project.stars)} stars
          </span>
          {project.language && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Code2 className="size-4" />
              {project.language}
            </span>
          )}
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {project.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {project.description}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        {userId ? (
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href={`/api/sessions/launch?projectId=${project.id}`}>
              <Rocket className="mr-2 size-5" />
              Launch Session
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href={`/sign-in?redirect_url=/projects/${project.slug}`}>
              <Rocket className="mr-2 size-5" />
              Sign In to Launch
            </Link>
          </Button>
        )}
        {project.githubUrl && (
          <Button asChild variant="outline" size="lg" className="h-12 px-6">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 size-4" />
              View on GitHub
            </a>
          </Button>
        )}
      </div>

      {/* Long Description */}
      {project.longDescription && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">About this project</h2>
          <div className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
            {project.longDescription}
          </div>
        </section>
      )}

      {/* What to Try First */}
      <section className="mt-12 rounded-xl border bg-muted/30 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lightbulb className="size-5" />
          </div>
          <h2 className="text-xl font-semibold">What to try first</h2>
        </div>
        <ul className="mt-4 space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
            Explore the main dashboard and familiarize yourself with the
            interface
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
            Create a simple project or workflow to see how it works
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
            Try the most popular features that the community is buzzing about
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
            Check out the settings panel for advanced configuration options
          </li>
        </ul>
      </section>
    </div>
  );
}
