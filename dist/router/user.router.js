"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRouter = void 0;
const express_1 = require("express");
const user_controller_1 = require("../controller/user.controller");
const cludinary_1 = require("../services/cludinary");
const auth_middleware_1 = require("../middleware/auth.middleware");
class UserRouter {
    constructor() {
        this.userController = new user_controller_1.UserController();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.use(auth_middleware_1.authMiddleware);
        this.router.get("/profile", this.userController.getCurrentUser.bind(this.userController));
        this.router.put("/profile", cludinary_1.upload.single("avatar"), this.userController.updateProfile.bind(this.userController));
        this.router.delete("/avatar", this.userController.removeAvatar.bind(this.userController));
        this.router.put("/change-password", this.userController.changePassword.bind(this.userController));
        this.router.put("/update-email", this.userController.updateEmail.bind(this.userController));
        this.router.delete("/account", this.userController.deleteAccount.bind(this.userController));
    }
    getRouter() {
        return this.router;
    }
}
exports.UserRouter = UserRouter;
