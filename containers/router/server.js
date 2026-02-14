// Agentropic Session Router
//
// Routes iframe requests to specific fly.io machines using fly-replay.
// Uses a cookie to persist the machine binding so all subsequent requests
// (CSS, JS, images, API calls within the iframe) route to the same machine.
//
// Flow:
//   1. iframe src = https://agentropic-router.fly.dev/init/{machineId}
//   2. Router sets cookie _inst={machineId} and redirects to /
//   3. All subsequent requests read the cookie and fly-replay to the machine
//   4. Target machine sees clean URLs (/, /api, /assets, etc.)

const http = require("http");

const TARGET_APP = process.env.TARGET_APP || "agentropic-sessions";
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  // Health check
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  // Step 1: /init/{machineId} — set cookie and redirect to /
  const initMatch = req.url.match(/^\/init\/([a-f0-9]+)$/);
  if (initMatch) {
    const machineId = initMatch[1];
    res.writeHead(302, {
      Location: "/",
      "Set-Cookie": `_inst=${machineId}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=86400`,
    });
    res.end();
    return;
  }

  // Step 2: Read cookie and fly-replay to the machine
  const cookies = parseCookies(req.headers.cookie || "");
  const machineId = cookies._inst;

  if (!machineId) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("No session. Navigate to /init/{machineId} first.");
    return;
  }

  // fly-replay tells the fly proxy to replay this exact request to the target machine
  res.writeHead(200, {
    "fly-replay": `app=${TARGET_APP};instance=${machineId}`,
  });
  res.end();
});

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [key, ...val] = cookie.split("=");
    if (key) cookies[key.trim()] = val.join("=").trim();
  });
  return cookies;
}

server.listen(PORT, () => {
  console.log(`Router listening on port ${PORT}, replaying to ${TARGET_APP}`);
});
