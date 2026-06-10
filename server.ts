import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const BACKEND_BASE = "http://aleiiicat-managementlatest.zeabur.internal:8000";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body Parsing
  app.use(express.json());
  app.use(express.text({ type: "*/*" }));

  // API gateway / proxy route
  app.all("/api/*", async (req, res) => {
    const targetUrl = `${BACKEND_BASE}${req.originalUrl || req.url}`;
    console.log(`[Proxy Server] Routing: ${req.method} ${req.url} -> ${targetUrl}`);

    try {
      const fetchOptions: RequestInit = {
        method: req.method,
        headers: {},
      };

      // Copy headers from client request
      for (const [key, val] of Object.entries(req.headers)) {
        if (key.toLowerCase() !== "host" && val !== undefined) {
          fetchOptions.headers![key] = Array.isArray(val) ? val.join(", ") : val;
        }
      }

      // Read of body
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.body) {
        if (typeof req.body === "object") {
          fetchOptions.body = JSON.stringify(req.body);
          fetchOptions.headers!["content-type"] = "application/json";
        } else {
          fetchOptions.body = req.body;
        }
      }

      const backendResponse = await fetch(targetUrl, fetchOptions);
      const data = await backendResponse.text();

      res.status(backendResponse.status);

      const contentType = backendResponse.headers.get("content-type");
      if (contentType) {
        res.setHeader("content-type", contentType);
      }

      res.send(data);
    } catch (err: any) {
      console.error(`[Proxy Server Error] Failed to contact Zeabur backend API: ${targetUrl}`, err);
      res.status(502).json({
        error: "Bad Gateway",
        message: "无法连接至后端数据库实体服务，请检查 Zeabur 实例运行状况。",
        details: err.message
      });
    }
  });

  // Vite middleware deployment configuration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
}

startServer();
