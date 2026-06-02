import cors from "cors";
import express from "express";
import { allowedOrigins, env, hasOpenAiKey } from "./env";
import { notFound, errorHandler } from "./middleware/errorHandler";
import { rateLimitPlaceholder } from "./middleware/rateLimitPlaceholder";
import { requestId } from "./middleware/requestId";
import { healthRouter } from "./routes/health";
import { workModeRouter } from "./routes/workMode";
import { AppError } from "./utils/errors";

const app = express();

app.use(requestId);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError(403, "cors_origin_blocked", `CORS blocked origin: ${origin}`));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(rateLimitPlaceholder);

app.use(healthRouter);
app.use("/api/work-mode", workModeRouter);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.info("[work-mode-api] server started", {
    url: `http://127.0.0.1:${env.PORT}`,
    frontendOrigins: allowedOrigins,
    hasOpenAiKey,
    llmFlags: {
      classifier: env.USE_LLM_CLASSIFIER,
      workPlan: env.USE_LLM_WORK_PLAN,
      answer: env.USE_LLM_ANSWER,
    },
  });
});

function shutdown(signal: "SIGINT" | "SIGTERM") {
  console.info(`[work-mode-api] ${signal} received, shutting down`);
  server.close(() => {
    console.info("[work-mode-api] server stopped");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[work-mode-api] graceful shutdown timed out");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
