import { Router } from "express";
import { AuthController } from "../controller/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export class AuthRouter {
  private authController: AuthController;
  private router: Router;

  constructor() {
    this.authController = new AuthController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Public routes (no authentication required)
    this.router.post(
      "/login",
      this.authController.loginUser.bind(this.authController)
    );
    this.router.post(
      "/register",
      this.authController.registerUser.bind(this.authController)
    );
    this.router.post(
      "/logout",
      this.authController.logoutUser.bind(this.authController)
    );

    // Admin-only routes (authentication required)
    this.router.post(
      "/create-hr-user", 
      authMiddleware,
      this.authController.createHRUser.bind(this.authController)
    );
    this.router.get(
      "/hr-users", 
      authMiddleware,
      this.authController.getHRUsers.bind(this.authController)
    );
    this.router.get(
      "/hr-users/:userId", 
      authMiddleware,
      this.authController.getHRUser.bind(this.authController)
    );
    this.router.put(
      "/hr-users/:userId", 
      authMiddleware,
      this.authController.updateHRUser.bind(this.authController)
    );
    this.router.delete(
      "/hr-users/:userId", 
      authMiddleware,
      this.authController.deleteHRUser.bind(this.authController)
    );
    this.router.patch(
      "/users/:userId/role", 
      authMiddleware,
      this.authController.changeUserRole.bind(this.authController)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}