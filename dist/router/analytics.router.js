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
        this.router.get("/dashboard", this.analyticsController.getDashboardStats.bind(this.analyticsController));
        this.router.get("/applications/status", this.analyticsController.getApplicationsByStatus.bind(this.analyticsController));
        this.router.get("/applications/position", this.analyticsController.getApplicationsByPosition.bind(this.analyticsController));
        this.router.get("/applications/province", this.analyticsController.getApplicationsByProvince.bind(this.analyticsController));
        this.router.get("/applications/education", this.analyticsController.getApplicationsByEducation.bind(this.analyticsController));
        this.router.get("/applications/experience", this.analyticsController.getApplicationsByExperience.bind(this.analyticsController));
        this.router.get("/applications/marital-status", this.analyticsController.getApplicationsByMaritalStatus.bind(this.analyticsController));
        this.router.get("/applications/age-distribution", this.analyticsController.getAgeDistribution.bind(this.analyticsController));
        this.router.get("/applications/trend", this.analyticsController.getApplicationsTrend.bind(this.analyticsController));
        this.router.get("/recruiters/department", this.analyticsController.getRecruitersByDepartment.bind(this.analyticsController));
        this.router.get("/custom", this.analyticsController.getCustomAnalytics.bind(this.analyticsController));
    }
    getRouter() {
        return this.router;
    }
}
exports.AnalyticsRouter = AnalyticsRouter;
