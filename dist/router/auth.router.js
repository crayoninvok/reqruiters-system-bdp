"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controller/auth.controller");
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
    }
    getRouter() {
        return this.router;
    }
}
exports.AuthRouter = AuthRouter;
