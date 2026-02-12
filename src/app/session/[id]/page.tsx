"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Square, Clock, AlertTriangle } from "lucide-react";

interface SessionResponse {
  session: {
    id: string;
    projectId: number;
    status: "launching" | "running" | "stopped" | "destroyed" | "error";
    sessionUrl: string | null;
    startedAt: string;
    stoppedAt: string | null;
    apiBudgetCents: number;
    apiSpendCents: number;
    flyMachineState: string | null;
  };
}

const SESSION_DURATION_MINUTES = 30;

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionResponse["session"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    SESSION_DURATION_MINUTES * 60
  );
  const [stopping, setStopping] = useState(false);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${params.id}`);
      if (!res.ok) {
        throw new Error("Failed to load session");
      }
      const data: SessionResponse = await res.json();
      setSession(data.session);
      setLoading(false);

      // Calculate remaining time from startedAt
      if (data.session.startedAt) {
        const started = new Date(data.session.startedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - started) / 1000);
        const remaining = SESSION_DURATION_MINUTES * 60 - elapsed;
        setRemainingSeconds(Math.max(0, remaining));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }, [params.id]);

  // Poll session status
  useEffect(() => {
    fetchSession();

    const interval = setInterval(() => {
      fetchSession();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchSession]);

  // Countdown timer
  useEffect(() => {
    if (!session || session.status !== "running") return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  // Stop session
  const handleStop = async () => {
    setStopping(true);
    try {
      await fetch(`/api/sessions/${params.id}/stop`, { method: "POST" });
      router.push("/dashboard");
    } catch {
      setStopping(false);
    }
  };

  // Format time remaining
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Timer color logic
  const getTimerClasses = (): string => {
    if (remainingSeconds <= 60) return "text-red-600 font-semibold";
    if (remainingSeconds <= 300) return "text-amber-600 font-semibold";
    return "text-muted-foreground";
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="text-lg font-medium">
          {error ?? "Session not found"}
        </p>
        <Button asChild variant="outline">
          <a href="/dashboard">Back to Dashboard</a>
        </Button>
      </div>
    );
  }

  // Session ended
  if (session.status === "stopped" || session.status === "destroyed") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Session ended</p>
        <p className="text-muted-foreground">
          This session has been stopped.
        </p>
        <Button asChild variant="outline">
          <a href="/dashboard">Back to Dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Session Header Bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">
            Session
          </span>
          {session.status === "launching" && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Starting up...
            </span>
          )}
          {session.status === "running" && (
            <span className="flex size-2 rounded-full bg-green-500" />
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <span className={`flex items-center gap-1.5 text-sm ${getTimerClasses()}`}>
            <Clock className="size-3.5" />
            {formatTime(remainingSeconds)}
          </span>

          {/* Stop Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={stopping}
          >
            {stopping ? (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : (
              <Square className="mr-1 size-3.5" />
            )}
            Stop Session
          </Button>
        </div>
      </div>

      {/* Session Content */}
      <div className="relative flex-1">
        {session.status === "launching" ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-muted/30">
            <Loader2 className="size-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium">
                Spinning up your environment
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This usually takes 15-30 seconds. We&apos;re setting up a
                private instance just for you.
              </p>
            </div>
          </div>
        ) : session.sessionUrl ? (
          <iframe
            src={session.sessionUrl}
            className="h-full w-full border-0"
            title="Session"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <AlertTriangle className="size-8 text-amber-500" />
            <p className="text-muted-foreground">
              Waiting for session URL...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
