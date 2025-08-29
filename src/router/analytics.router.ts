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
    // All routes require authentication
    this.router.use(authMiddleware);

    // Dashboard overview stats
    this.router.get(
      "/dashboard",
      this.analyticsController.getDashboardStats.bind(this.analyticsController)
    );

    // Applications breakdowns
    this.router.get(
      "/applications/status",
      this.analyticsController.getApplicationsByStatus.bind(this.analyticsController)
    );

    this.router.get(
      "/applications/position",
      this.analyticsController.getApplicationsByPosition.bind(this.analyticsController)
    );

    this.router.get(
      "/applications/province",
      this.analyticsController.getApplicationsByProvince.bind(this.analyticsController)
    );

    this.router.get(
      "/applications/education",
      this.analyticsController.getApplicationsByEducation.bind(this.analyticsController)
    );

    this.router.get(
      "/applications/experience",
      this.analyticsController.getApplicationsByExperience.bind(this.analyticsController)
    );

    this.router.get(
      "/applications/marital-status",
      this.analyticsController.getApplicationsByMaritalStatus.bind(this.analyticsController)
    );

    this.router.get(
      "/applications/age-distribution",
      this.analyticsController.getAgeDistribution.bind(this.analyticsController)
    );

    // Trend analysis
    this.router.get(
      "/applications/trend",
      this.analyticsController.getApplicationsTrend.bind(this.analyticsController)
    );

    // Custom analytics with query parameters
    this.router.get(
      "/custom",
      this.analyticsController.getCustomAnalytics.bind(this.analyticsController)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}