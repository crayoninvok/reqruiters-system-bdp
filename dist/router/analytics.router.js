"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsRouter = void 0;
const express_1 = require("express");
const analytics_controller_1 = require("../controller/analytics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
class AnalyticsRouter {
    constructor() {
        this.analyticsController = new analytics_controller_1.AnalyticsController();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.use(auth_middleware_1.authMiddleware);
        this.router.get("/stats", this.analyticsController.getOverallStats.bind(this.analyticsController));
        this.router.get("/positions", this.analyticsController.getApplicationsByPosition.bind(this.analyticsController));
        this.router.get("/provinces", this.analyticsController.getApplicationsByProvince.bind(this.analyticsController));
        this.router.get("/experience", this.analyticsController.getApplicationsByExperience.bind(this.analyticsController));
        this.router.get("/education", this.analyticsController.getApplicationsByEducation.bind(this.analyticsController));
        this.router.get("/trends", this.analyticsController.getMonthlyTrends.bind(this.analyticsController));
        this.router.get("/recent", this.analyticsController.getRecentApplications.bind(this.analyticsController));
        this.router.get("/age-distribution", this.analyticsController.getAgeDistribution.bind(this.analyticsController));
        this.router.get("/dashboard", this.analyticsController.getDashboardData.bind(this.analyticsController));
    }
    getRouter() {
        return this.router;
    }
}
exports.AnalyticsRouter = AnalyticsRouter;
