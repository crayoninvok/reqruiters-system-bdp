import { Router } from "express";
import { UserController } from "../controller/user.controller";
import { upload } from "../services/cludinary"; // Import upload middleware
import { authMiddleware } from "../middleware/auth.middleware"; // Your auth middleware

export class UserRouter {
  private userController: UserController;
  private router: Router;

  constructor() {
    this.userController = new UserController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // All routes require authentication
    this.router.use(authMiddleware);

    // Get current user profile
    this.router.get(
      "/profile",
      this.userController.getCurrentUser.bind(this.userController)
    );

    // Update profile with optional avatar upload
    this.router.put(
      "/profile",
      upload.single("avatar"), // Handle single avatar upload
      this.userController.updateProfile.bind(this.userController)
    );

    // Remove avatar
    this.router.delete(
      "/avatar",
      this.userController.removeAvatar.bind(this.userController)
    );

    // Change password
    this.router.put(
      "/change-password",
      this.userController.changePassword.bind(this.userController)
    );

    // Update email
    this.router.put(
      "/update-email",
      this.userController.updateEmail.bind(this.userController)
    );

    // Delete account
    this.router.delete(
      "/account",
      this.userController.deleteAccount.bind(this.userController)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}