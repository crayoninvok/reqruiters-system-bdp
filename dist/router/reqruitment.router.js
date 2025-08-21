"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitmentFormRouter = void 0;
const express_1 = require("express");
const reqruitment_controller_1 = require("../controller/reqruitment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const cludinary_1 = require("../services/cludinary");
class RecruitmentFormRouter {
    constructor() {
        this.recruitmentFormController = new reqruitment_controller_1.RecruitmentFormController();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post("/", auth_middleware_1.authMiddleware, cludinary_1.upload.fields([
            { name: "documentPhoto", maxCount: 1 },
            { name: "documentCv", maxCount: 1 },
            { name: "documentKtp", maxCount: 1 },
            { name: "documentSkck", maxCount: 1 },
            { name: "documentVaccine", maxCount: 1 },
            { name: "supportingDocs", maxCount: 1 },
        ]), this.recruitmentFormController.createRecruitmentForm.bind(this.recruitmentFormController));
        this.router.get("/", auth_middleware_1.authMiddleware, this.recruitmentFormController.getRecruitmentForms.bind(this.recruitmentFormController));
        this.router.get("/stats", auth_middleware_1.authMiddleware, this.recruitmentFormController.getRecruitmentStats.bind(this.recruitmentFormController));
        this.router.get("/ready-for-hiring", auth_middleware_1.authMiddleware, this.recruitmentFormController.getCandidatesReadyForHiring.bind(this.recruitmentFormController));
        this.router.post("/migrate-to-hired", auth_middleware_1.authMiddleware, this.recruitmentFormController.migrateToHiredEmployee.bind(this.recruitmentFormController));
        this.router.get("/:id", auth_middleware_1.authMiddleware, this.recruitmentFormController.getRecruitmentFormById.bind(this.recruitmentFormController));
        this.router.put("/:id", auth_middleware_1.authMiddleware, cludinary_1.upload.fields([
            { name: "documentPhoto", maxCount: 1 },
            { name: "documentCv", maxCount: 1 },
            { name: "documentKtp", maxCount: 1 },
            { name: "documentSkck", maxCount: 1 },
            { name: "documentVaccine", maxCount: 1 },
            { name: "supportingDocs", maxCount: 1 },
        ]), this.recruitmentFormController.updateRecruitmentForm.bind(this.recruitmentFormController));
        this.router.patch("/:id/status", auth_middleware_1.authMiddleware, this.recruitmentFormController.updateRecruitmentStatus.bind(this.recruitmentFormController));
        this.router.delete("/:id", auth_middleware_1.authMiddleware, this.recruitmentFormController.deleteRecruitmentForm.bind(this.recruitmentFormController));
    }
    getRouter() {
        return this.router;
    }
}
exports.RecruitmentFormRouter = RecruitmentFormRouter;
