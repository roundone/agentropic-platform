// ---------------------------------------------------------------------------
// fly.io Machines API Client
// Docs: https://fly.io/docs/machines/api/
// ---------------------------------------------------------------------------

const FLY_API_BASE = "https://api.machines.dev/v1/apps";

function getFlyToken(): string {
  const token = process.env.FLY_API_TOKEN;
  if (!token) {
    throw new Error("FLY_API_TOKEN environment variable is not set");
  }
  return token;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getFlyToken()}`,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Subset of the fly.io Machine object we care about. */
export interface FlyMachine {
  id: string;
  name: string;
  state: FlyMachineState;
  region: string;
  instance_id: string;
  private_ip: string;
  created_at: string;
  updated_at: string;
  config: FlyMachineConfig;
  image_ref?: {
    registry: string;
    repository: string;
    tag: string;
    digest: string;
  };
  events?: FlyMachineEvent[];
}

export type FlyMachineState =
  | "created"
  | "starting"
  | "started"
  | "stopping"
  | "stopped"
  | "replacing"
  | "destroying"
  | "destroyed";

export interface FlyMachineConfig {
  image: string;
  env?: Record<string, string>;
  services?: FlyService[];
  guest?: FlyGuest;
  auto_destroy?: boolean;
  restart?: { policy: "no" | "on-failure" | "always" };
}

export interface FlyService {
  ports: { port: number; handlers: string[] }[];
  protocol: "tcp" | "udp";
  internal_port: number;
  force_instance_key?: string | null;
}

export interface FlyGuest {
  cpus: number;
  memory_mb: number;
  cpu_kind?: "shared" | "performance";
}

export interface FlyMachineEvent {
  id: string;
  type: string;
  status: string;
  timestamp: number;
}

export interface CreateMachineConfig {
  image: string;
  port: number;
  env?: Record<string, string>;
  resources?: {
    cpus: number;
    memoryMb: number;
  };
}

interface FlyApiError {
  error: string;
  status?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function flyFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    let errorBody: string;
    try {
      errorBody = await response.text();
    } catch {
      errorBody = "Unable to read error response body";
    }
    throw new FlyMachineError(
      `fly.io API error ${response.status}: ${errorBody}`,
      response.status,
    );
  }

  // Some endpoints (stop, destroy) return 200 with empty body
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export class FlyMachineError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "FlyMachineError";
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Create a new fly.io Machine in the given app.
 *
 * Returns the created Machine object including its `id` and `private_ip`.
 */
export async function createMachine(
  appName: string,
  config: CreateMachineConfig,
): Promise<FlyMachine> {
  const { image, port, env, resources } = config;

  const body: { config: FlyMachineConfig } = {
    config: {
      image,
      env,
      guest: {
        cpus: resources?.cpus ?? 2,
        memory_mb: resources?.memoryMb ?? 2048,
        cpu_kind: "shared",
      },
      services: [
        {
          ports: [
            { port: 443, handlers: ["tls", "http"] },
            { port: 80, handlers: ["http"] },
          ],
          protocol: "tcp",
          internal_port: port,
        },
      ],
      auto_destroy: false,
      restart: { policy: "on-failure" },
    },
  };

  return flyFetch<FlyMachine>(
    `${FLY_API_BASE}/${appName}/machines`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/**
 * Start a stopped Machine.
 */
export async function startMachine(
  appName: string,
  machineId: string,
): Promise<void> {
  await flyFetch<Record<string, never>>(
    `${FLY_API_BASE}/${appName}/machines/${machineId}/start`,
    { method: "POST" },
  );
}

/**
 * Stop a running Machine. The machine's state is preserved (rootfs + volumes).
 * Stopped machines do not consume compute charges.
 */
export async function stopMachine(
  appName: string,
  machineId: string,
): Promise<void> {
  await flyFetch<Record<string, never>>(
    `${FLY_API_BASE}/${appName}/machines/${machineId}/stop`,
    { method: "POST" },
  );
}

/**
 * Permanently destroy a Machine and its rootfs. Volumes are NOT automatically
 * deleted -- they must be cleaned up separately if needed.
 */
export async function destroyMachine(
  appName: string,
  machineId: string,
): Promise<void> {
  await flyFetch<Record<string, never>>(
    `${FLY_API_BASE}/${appName}/machines/${machineId}`,
    { method: "DELETE" },
  );
}

/**
 * Get the current status and full details of a Machine.
 */
export async function getMachine(
  appName: string,
  machineId: string,
): Promise<FlyMachine> {
  return flyFetch<FlyMachine>(
    `${FLY_API_BASE}/${appName}/machines/${machineId}`,
    { method: "GET" },
  );
}
