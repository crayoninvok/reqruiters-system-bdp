"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiredEmployeeRouter = void 0;
const express_1 = require("express");
const hired_controller_1 = require("../controller/hired.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
class HiredEmployeeRouter {
    constructor() {
        this.hiredEmployeeController = new hired_controller_1.HiredEmployeeController();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get("/", auth_middleware_1.authMiddleware, this.hiredEmployeeController.getHiredEmployees.bind(this.hiredEmployeeController));
        this.router.get("/stats", auth_middleware_1.authMiddleware, this.hiredEmployeeController.getHiredEmployeesStats.bind(this.hiredEmployeeController));
        this.router.get("/supervisors", auth_middleware_1.authMiddleware, this.hiredEmployeeController.getAvailableSupervisors.bind(this.hiredEmployeeController));
        this.router.put("/:id", auth_middleware_1.authMiddleware, this.hiredEmployeeController.updateHiredEmployee.bind(this.hiredEmployeeController));
        this.router.delete("/:id", auth_middleware_1.authMiddleware, this.hiredEmployeeController.deleteHiredEmployee.bind(this.hiredEmployeeController));
        this.router.patch("/:id/restore", auth_middleware_1.authMiddleware, this.hiredEmployeeController.restoreHiredEmployee.bind(this.hiredEmployeeController));
        this.router.get("/:id", auth_middleware_1.authMiddleware, this.hiredEmployeeController.getHiredEmployeeById.bind(this.hiredEmployeeController));
    }
    getRouter() {
        return this.router;
    }
}
exports.HiredEmployeeRouter = HiredEmployeeRouter;
