import { Router } from "express";
import { HiredEmployeeController } from "../controller/hired.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export class HiredEmployeeRouter {
  private hiredEmployeeController: HiredEmployeeController;
  private router: Router;

  constructor() {
    this.hiredEmployeeController = new HiredEmployeeController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Get all hired employees with comprehensive filtering and pagination - AUTH REQUIRED
    this.router.get(
      "/",
      authMiddleware,
      this.hiredEmployeeController.getHiredEmployees.bind(
        this.hiredEmployeeController
      )
    );

    // Get hired employees statistics and analytics - AUTH REQUIRED
    this.router.get(
      "/stats",
      authMiddleware,
      this.hiredEmployeeController.getHiredEmployeesStats.bind(
        this.hiredEmployeeController
      )
    );

    // Get available supervisors for dropdown/selection - AUTH REQUIRED
    this.router.get(
      "/supervisors",
      authMiddleware,
      this.hiredEmployeeController.getAvailableSupervisors.bind(
        this.hiredEmployeeController
      )
    );

    // Update hired employee - AUTH REQUIRED
    this.router.put(
      "/:id",
      authMiddleware,
      this.hiredEmployeeController.updateHiredEmployee.bind(
        this.hiredEmployeeController
      )
    );

    // Delete/Deactivate hired employee - AUTH REQUIRED
    this.router.delete(
      "/:id",
      authMiddleware,
      this.hiredEmployeeController.deleteHiredEmployee.bind(
        this.hiredEmployeeController
      )
    );

    // Restore hired employee (reactivate) - AUTH REQUIRED
    this.router.patch(
      "/:id/restore",
      authMiddleware,
      this.hiredEmployeeController.restoreHiredEmployee.bind(
        this.hiredEmployeeController
      )
    );

    // Get single hired employee by ID with full details - AUTH REQUIRED
    // This should be last to avoid conflicts with other parameterized routes
    this.router.get(
      "/:id",
      authMiddleware,
      this.hiredEmployeeController.getHiredEmployeeById.bind(
        this.hiredEmployeeController
      )
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}