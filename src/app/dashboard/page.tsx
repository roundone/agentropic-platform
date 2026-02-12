import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { sessions, projects, users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Clock,
  ArrowRight,
  Play,
  Square,
  AlertCircle,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard - Agentropic",
};

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const user = await currentUser();

  // Fetch user record
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Fetch user's sessions with project info
  const userSessions = await db
    .select({
      session: sessions,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(sessions)
    .innerJoin(projects, eq(sessions.projectId, projects.id))
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt))
    .limit(20);

  const activeSessions = userSessions.filter(
    (s) => s.session.status === "launching" || s.session.status === "running"
  );
  const pastSessions = userSessions.filter(
    (s) => s.session.status !== "launching" && s.session.status !== "running"
  );

  // Plan info
  const tier = dbUser?.tier ?? "trial";
  const trialUsed = dbUser?.trialSessionsUsed ?? 0;
  const trialLimit = 3;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Manage your sessions and explore new AI projects.
        </p>
      </div>

      {/* Plan & Usage Card */}
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Current Plan</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              {tier === "trial"
                ? "Free Trial"
                : tier === "explorer"
                  ? "Explorer"
                  : "Unlimited"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tier === "trial" ? (
              <p className="text-sm text-muted-foreground">
                {trialUsed} of {trialLimit} free sessions used
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Unlimited sessions available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Active Sessions</CardDescription>
            <CardTitle>{activeSessions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {activeSessions.length === 0
                ? "No active sessions"
                : `${activeSessions.length} session${activeSessions.length > 1 ? "s" : ""} running`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Sessions</CardDescription>
            <CardTitle>{userSessions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active Sessions</h2>
          <Button asChild size="sm" variant="outline">
            <Link href="/projects">
              <Rocket className="mr-1.5 size-3.5" />
              Launch New
            </Link>
          </Button>
        </div>

        {activeSessions.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {activeSessions.map(({ session: s, projectName, projectSlug }) => (
              <Card key={s.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{projectName}</CardTitle>
                    <Badge
                      variant={
                        s.status === "running" ? "default" : "secondary"
                      }
                    >
                      {s.status === "launching" ? (
                        <>
                          <Clock className="mr-1 size-3" />
                          Starting
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 size-3" />
                          Running
                        </>
                      )}
                    </Badge>
                  </div>
                  <CardDescription>
                    Started{" "}
                    {new Date(s.startedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="sm">
                    <Link href={`/session/${s.id}`}>
                      Open Session
                      <ArrowRight className="ml-1 size-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <Rocket className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No active sessions</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse projects and launch your first session.
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/projects">Browse Projects</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Past Sessions */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Session History</h2>

        {pastSessions.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Project
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pastSessions.map(
                  ({ session: s, projectName, projectSlug }) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{projectName}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                        {new Date(s.startedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            s.status === "error" ? "destructive" : "secondary"
                          }
                        >
                          {s.status === "stopped" && (
                            <Square className="mr-1 size-3" />
                          )}
                          {s.status === "error" && (
                            <AlertCircle className="mr-1 size-3" />
                          )}
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/projects/${projectSlug}`}>
                            Relaunch
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No past sessions yet. Your completed sessions will appear here.
          </p>
        )}
      </section>
    </div>
  );
}
