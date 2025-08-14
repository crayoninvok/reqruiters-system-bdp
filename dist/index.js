"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const auth_router_1 = require("./router/auth.router");
const user_router_1 = require("./router/user.router");
const reqruitment_router_1 = require("./router/reqruitment.router");
const public_reqruitment_router_1 = require("./router/public-reqruitment.router");
const analytics_router_1 = require("./router/analytics.router");
const auth_middleware_1 = require("./middleware/auth.middleware");
const PORT = 8000;
const base_url_fe = process.env.BASE_URL_FE;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: base_url_fe,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
const authRouter = new auth_router_1.AuthRouter();
const userRouter = new user_router_1.UserRouter();
const recruitmentFormRouter = new reqruitment_router_1.RecruitmentFormRouter();
app.use("/api/auth", authRouter.getRouter());
app.use("/api/user", auth_middleware_1.authMiddleware, userRouter.getRouter());
app.use("/api/recruitment", auth_middleware_1.authMiddleware, recruitmentFormRouter.getRouter());
app.use("/api/public-recruitment", new public_reqruitment_router_1.PublicRecruitmentRouter().getRouter());
app.use("/api/analytics", auth_middleware_1.authMiddleware, new analytics_router_1.AnalyticsRouter().getRouter());
app.get("/api", (req, res) => {
    res.send("Welcome to the API!");
});
app.listen(PORT, () => {
    console.log(`Server is running on -> http://localhost:${PORT}/api`);
});
