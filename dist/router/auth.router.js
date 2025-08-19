"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controller/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
class AuthRouter {
    constructor() {
        this.authController = new auth_controller_1.AuthController();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post("/login", this.authController.loginUser.bind(this.authController));
        this.router.post("/register", this.authController.registerUser.bind(this.authController));
        this.router.post("/logout", this.authController.logoutUser.bind(this.authController));
        this.router.post("/create-hr-user", auth_middleware_1.authMiddleware, this.authController.createHRUser.bind(this.authController));
        this.router.get("/hr-users", auth_middleware_1.authMiddleware, this.authController.getHRUsers.bind(this.authController));
        this.router.get("/hr-users/:userId", auth_middleware_1.authMiddleware, this.authController.getHRUser.bind(this.authController));
        this.router.put("/hr-users/:userId", auth_middleware_1.authMiddleware, this.authController.updateHRUser.bind(this.authController));
        this.router.delete("/hr-users/:userId", auth_middleware_1.authMiddleware, this.authController.deleteHRUser.bind(this.authController));
        this.router.patch("/users/:userId/role", auth_middleware_1.authMiddleware, this.authController.changeUserRole.bind(this.authController));
    }
    getRouter() {
        return this.router;
    }
}
exports.AuthRouter = AuthRouter;
