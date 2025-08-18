import { Router } from "express";
import { ActualVsPlanController } from "../controller/actualvsplan.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export class ActualVsPlanRouter {
  private actualVsPlanController: ActualVsPlanController;
  private router: Router;

  constructor() {
    this.actualVsPlanController = new ActualVsPlanController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Get full actual vs plan comparison - AUTH REQUIRED
    this.router.get(
      "/",
      authMiddleware,
      this.actualVsPlanController.getActualVsPlan.bind(
        this.actualVsPlanController
      )
    );

    // Get department-wise summary - AUTH REQUIRED
    this.router.get(
      "/department-summary",
      authMiddleware,
      this.actualVsPlanController.getDepartmentSummary.bind(
        this.actualVsPlanController
      )
    );

    // Update plan data - AUTH REQUIRED (ADMIN only)
    this.router.put(
      "/plan",
      authMiddleware,
      this.actualVsPlanController.updatePlan.bind(
        this.actualVsPlanController
      )
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}