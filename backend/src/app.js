import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import electionRoutes from "./routes/election.routes.js";
import postRoutes from "./routes/post.routes.js";
import candidateRoutes from "./routes/candidate.routes.js";
import voteRoutes from "./routes/vote.routes.js";
import resultRoutes from "./routes/result.routes.js";

import notFoundHandler from "./middleware/notFound.middleware.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

app.set("trust proxy", 1);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts. Please try again later.",
  },
});

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
    credentials: true,
  }),
);

app.use(generalLimiter);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(hpp());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Online Voting System API is running...",
  });
});

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/elections", electionRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/candidates", candidateRoutes);
app.use("/api/v1/votes", voteRoutes);
app.use("/api/v1/results", resultRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
