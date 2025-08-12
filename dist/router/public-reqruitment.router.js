"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicRecruitmentRouter = void 0;
const express_1 = require("express");
const public_reqruitment_controller_1 = require("../controller/public-reqruitment.controller");
const cludinary_1 = require("../services/cludinary");
class PublicRecruitmentRouter {
    constructor() {
        this.publicRecruitmentController = new public_reqruitment_controller_1.PublicRecruitmentController();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post("/submit", cludinary_1.upload.fields([
            { name: "documentPhoto", maxCount: 1 },
            { name: "documentCv", maxCount: 1 },
            { name: "documentKtp", maxCount: 1 },
            { name: "documentSkck", maxCount: 1 },
            { name: "documentVaccine", maxCount: 1 },
            { name: "supportingDocs", maxCount: 1 },
        ]), this.publicRecruitmentController.submitRecruitmentForm.bind(this.publicRecruitmentController));
        this.router.get("/options", this.publicRecruitmentController.getFormOptions.bind(this.publicRecruitmentController));
        this.router.get("/status/:id", this.publicRecruitmentController.checkApplicationStatus.bind(this.publicRecruitmentController));
    }
    getRouter() {
        return this.router;
    }
}
exports.PublicRecruitmentRouter = PublicRecruitmentRouter;
