import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import apiRoutes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { generalApiLimiter } from "./middleware/rateLimiters.js";

const app = express();

// Security headers
app.use(helmet());

// CORS — only the real frontend origin is allowed
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . from req.body/query/params to prevent NoSQL injection

if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use("/api", generalApiLimiter, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`[server] Listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

if (env.NODE_ENV !== "test") {
  start();
}

export default app;
