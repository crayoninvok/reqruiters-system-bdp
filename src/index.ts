import dotenv from "dotenv"
dotenv.config()
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import { AuthRouter } from "./router/auth.router";
import { UserRouter } from "./router/user.router";
import { RecruitmentFormRouter } from "./router/reqruitment.router";

const PORT: number = 8000;
const base_url_fe = process.env.BASE_URL_FE;

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: base_url_fe,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Initialize routers
const authRouter = new AuthRouter();
const userRouter = new UserRouter();
const recruitmentFormRouter = new RecruitmentFormRouter();


// Register routes
app.use("/api/auth", authRouter.getRouter());
app.use("/api/user", userRouter.getRouter());
app.use("/api/recruitment", recruitmentFormRouter.getRouter());

// Base route
app.get("/api", (req, res) => {
  res.send("Welcome to the API!");
});

app.listen(PORT, () => {
  console.log(`Server is running on -> http://localhost:${PORT}/api`);
});