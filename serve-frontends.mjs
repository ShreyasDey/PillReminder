// Zero-dependency static server for the two SaathiPill front-ends.
//   node serve-frontends.mjs
// Patient app  → http://localhost:5173
// Pharmacy app → http://localhost:5174
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".jsx": "text/babel",
  ".css": "text/css",
  ".png": "image/png",
  ".json": "application/json",
};

function serve(appDir, port, label) {
  const base = join(root, "apps", appDir);
  createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath === "/") urlPath = "/index.html";
      const filePath = normalize(join(base, urlPath));
      if (!filePath.startsWith(base)) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      const data = await readFile(filePath);
      res.writeHead(200, {
        "Content-Type": TYPES[extname(filePath)] || "application/octet-stream",
        // Never cache — so the browser always loads the latest app code on reload.
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      });
      res.end(data);
    } catch {
      res.writeHead(404).end("Not found");
    }
  }).listen(port, () => console.log(`${label} → http://localhost:${port}`));
}

serve("patient", 5173, "Patient app  ");
serve("portal", 5174, "Pharmacy portal");
