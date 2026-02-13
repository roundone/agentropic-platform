import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Search,
  Rocket,
  MousePointerClick,
  Star,
} from "lucide-react";

function formatStars(count: number | null): string {
  if (!count) return "0";
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export default async function HomePage() {
  const featuredProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "live"))
    .limit(4);
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 px-3 py-1 text-sm">
              Zero setup required
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Try the AI tools everyone&apos;s talking about&nbsp;&mdash;{" "}
              <span className="text-primary">instantly</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              No setup. No API keys. No command line. Just click and start
              exploring the hottest open-source AI projects in your browser.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/projects">
                  Browse Projects
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base"
              >
                <Link href="/sign-up">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              How it works
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              From curious to hands-on in under a minute
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <StepCard
              icon={<Search className="size-6" />}
              step="1"
              title="Browse"
              description="Explore our curated collection of trending open-source AI projects. We add new ones within hours of going viral."
            />
            <StepCard
              icon={<Rocket className="size-6" />}
              step="2"
              title="Launch"
              description="Click a project and we spin up a private, isolated instance just for you. No installs, no configuration."
            />
            <StepCard
              icon={<MousePointerClick className="size-6" />}
              step="3"
              title="Explore"
              description="Use the real tool right in your browser. Your sessions persist, so you can pick up where you left off."
            />
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Featured projects
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                The most popular AI tools you can try right now
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:flex">
              <Link href="/projects">
                View all
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProjects.map((project) => (
              <Card
                key={project.slug}
                className="flex h-full flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    {project.category && (
                      <Badge variant="secondary">{project.category}</Badge>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-current" />
                      {formatStars(project.stars)}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-lg">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="hover:underline"
                    >
                      {project.name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="line-clamp-3">
                    {project.description}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/projects/${project.slug}`}>
                      Try It
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline">
              <Link href="/projects">View all projects</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to explore?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start with 3 free sessions. No credit card required.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepCard({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Step {step}
      </span>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
