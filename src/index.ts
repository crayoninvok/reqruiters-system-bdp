import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import { AuthRouter } from "./router/auth.router";
import { UserRouter } from "./router/user.router";
import { RecruitmentFormRouter } from "./router/reqruitment.router";
import { PublicRecruitmentRouter } from "./router/public-reqruitment.router";
import { AnalyticsRouter } from "./router/analytics.router";
import { authMiddleware } from "./middleware/auth.middleware"; // Importing authMiddleware
import { ActualVsPlanRouter } from "./router/actualvsplan.router";
import { HiredEmployeeRouter } from "./router/hired.router";



const PORT: number = 8000;
const base_url_fe = process.env.BASE_URL_FE; // Frontend URL from environment

// Initialize Express app
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());


app.use(
  cors({
    origin: base_url_fe, // Allow requests from the frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allow Authorization header
    credentials: true, // Allow credentials (cookies, headers, etc.)
  })
);


// Initialize Routers
const authRouter = new AuthRouter();
const userRouter = new UserRouter();
const recruitmentFormRouter = new RecruitmentFormRouter();

// Register Routes
app.use("/api/auth", authRouter.getRouter());  // Authentication routes
app.use("/api/user", authMiddleware, userRouter.getRouter()); // User routes (Protected)
app.use("/api/recruitment", authMiddleware, recruitmentFormRouter.getRouter()); // Recruitment routes (Protected)
app.use("/api/public-recruitment", new PublicRecruitmentRouter().getRouter()); // Public recruitment routes
app.use("/api/analytics", authMiddleware, new AnalyticsRouter().getRouter()); // Analytics routes (Protected)
app.use("/api/actual-vs-plan", new ActualVsPlanRouter().getRouter());
app.use("/api/hired", new HiredEmployeeRouter().getRouter());



// Base route
app.get("/api", (req, res) => {
  res.send("Welcome to the API!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on -> http://localhost:${PORT}/api`);
});
