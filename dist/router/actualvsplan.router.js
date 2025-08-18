"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActualVsPlanRouter = void 0;
const express_1 = require("express");
const actualvsplan_controller_1 = require("../controller/actualvsplan.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
class ActualVsPlanRouter {
    constructor() {
        this.actualVsPlanController = new actualvsplan_controller_1.ActualVsPlanController();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get("/", auth_middleware_1.authMiddleware, this.actualVsPlanController.getActualVsPlan.bind(this.actualVsPlanController));
        this.router.get("/department-summary", auth_middleware_1.authMiddleware, this.actualVsPlanController.getDepartmentSummary.bind(this.actualVsPlanController));
        this.router.put("/plan", auth_middleware_1.authMiddleware, this.actualVsPlanController.updatePlan.bind(this.actualVsPlanController));
    }
    getRouter() {
        return this.router;
    }
}
exports.ActualVsPlanRouter = ActualVsPlanRouter;
