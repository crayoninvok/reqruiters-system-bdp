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
        this.router.options("/submit", (req, res) => {
            console.log("OPTIONS request for /submit received");
            res.header("Access-Control-Allow-Origin", process.env.BASE_URL_FE || "https://bdphrdatabase.vercel.app");
            res.header("Access-Control-Allow-Credentials", "true");
            res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
            res.sendStatus(200);
        });
        this.router.post("/submit", (req, res, next) => {
            console.log("POST request for /submit received from:", req.headers.origin);
            res.header("Access-Control-Allow-Origin", process.env.BASE_URL_FE || "https://bdphrdatabase.vercel.app");
            res.header("Access-Control-Allow-Credentials", "true");
            next();
        }, cludinary_1.upload.fields([
            { name: "documentPhoto", maxCount: 1 },
            { name: "documentCv", maxCount: 1 },
            { name: "documentKtp", maxCount: 1 },
            { name: "documentSkck", maxCount: 1 },
            { name: "documentVaccine", maxCount: 1 },
            { name: "supportingDocs", maxCount: 1 },
        ]), this.publicRecruitmentController.submitRecruitmentForm.bind(this.publicRecruitmentController));
        this.router.get("/options", this.publicRecruitmentController.getFormOptions.bind(this.publicRecruitmentController));
        this.router.get("/status/:id", this.publicRecruitmentController.checkApplicationStatus.bind(this.publicRecruitmentController));
        this.router.post("/upload-signature", this.publicRecruitmentController.generateUploadSignature.bind(this.publicRecruitmentController));
        this.router.post("/submit-with-urls", this.publicRecruitmentController.submitWithUrls.bind(this.publicRecruitmentController));
    }
    getRouter() {
        return this.router;
    }
}
exports.PublicRecruitmentRouter = PublicRecruitmentRouter;
