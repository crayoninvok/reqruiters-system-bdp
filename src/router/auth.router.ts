import { Router } from "express";
import { AuthController } from "../controller/auth.controller";

export class AuthRouter {
  private authController: AuthController;
  private router: Router;

  constructor() {
    this.authController = new AuthController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
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
  }
  public getRouter(): Router {
    return this.router;
  }
}
