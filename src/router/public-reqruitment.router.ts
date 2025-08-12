import { Router } from "express";
import { PublicRecruitmentController } from "../controller/public-reqruitment.controller";
import { upload } from "../services/cludinary";

export class PublicRecruitmentRouter {
  private publicRecruitmentController: PublicRecruitmentController;
  private router: Router;

  constructor() {
    this.publicRecruitmentController = new PublicRecruitmentController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Submit recruitment form (with file uploads) - POST /api/public/recruitment/submit
    this.router.post(
      "/submit",
      upload.fields([
        { name: "documentPhoto", maxCount: 1 },
        { name: "documentCv", maxCount: 1 },
        { name: "documentKtp", maxCount: 1 },
        { name: "documentSkck", maxCount: 1 },
        { name: "documentVaccine", maxCount: 1 },
        { name: "supportingDocs", maxCount: 1 },
      ]),
      this.publicRecruitmentController.submitRecruitmentForm.bind(
        this.publicRecruitmentController
      )
    );

    // Get form options (provinces, sizes, etc.) - GET /api/public/recruitment/options
    this.router.get(
      "/options",
      this.publicRecruitmentController.getFormOptions.bind(
        this.publicRecruitmentController
      )
    );

    // Check application status by ID - GET /api/public/recruitment/status/:id
    this.router.get(
      "/status/:id",
      this.publicRecruitmentController.checkApplicationStatus.bind(
        this.publicRecruitmentController
      )
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}