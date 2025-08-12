import { Router } from "express";
import { AnalyticsController } from "../controller/analytics.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export class AnalyticsRouter {
  private analyticsController: AnalyticsController;
  private router: Router;

  constructor() {
    this.analyticsController = new AnalyticsController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Apply auth middleware to all routes
    this.router.use(authMiddleware);

    // Overall statistics - GET /api/analytics/stats
    this.router.get(
      "/stats",
      this.analyticsController.getOverallStats.bind(this.analyticsController)
    );

    // Applications by position - GET /api/analytics/positions
    this.router.get(
      "/positions",
      this.analyticsController.getApplicationsByPosition.bind(this.analyticsController)
    );

    // Applications by province - GET /api/analytics/provinces
    this.router.get(
      "/provinces",
      this.analyticsController.getApplicationsByProvince.bind(this.analyticsController)
    );

    // Applications by experience level - GET /api/analytics/experience
    this.router.get(
      "/experience",
      this.analyticsController.getApplicationsByExperience.bind(this.analyticsController)
    );

    // Applications by education level - GET /api/analytics/education
    this.router.get(
      "/education",
      this.analyticsController.getApplicationsByEducation.bind(this.analyticsController)
    );

    // Monthly trends - GET /api/analytics/trends?year=2024
    this.router.get(
      "/trends",
      this.analyticsController.getMonthlyTrends.bind(this.analyticsController)
    );

    // Recent applications - GET /api/analytics/recent?limit=10
    this.router.get(
      "/recent",
      this.analyticsController.getRecentApplications.bind(this.analyticsController)
    );

    // Age distribution - GET /api/analytics/age-distribution
    this.router.get(
      "/age-distribution",
      this.analyticsController.getAgeDistribution.bind(this.analyticsController)
    );

    // Dashboard data - GET /api/analytics/dashboard
    this.router.get(
      "/dashboard",
      this.analyticsController.getDashboardData.bind(this.analyticsController)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}