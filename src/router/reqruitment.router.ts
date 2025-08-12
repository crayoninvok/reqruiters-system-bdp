import { Router } from "express";
import { RecruitmentFormController } from "../controller/reqruitment.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../services/cludinary";

export class RecruitmentFormRouter {
  private recruitmentFormController: RecruitmentFormController;
  private router: Router;

  constructor() {
    this.recruitmentFormController = new RecruitmentFormController();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Create recruitment form with file uploads
    this.router.post(
      "/", authMiddleware,
      upload.fields([
        { name: "documentPhoto", maxCount: 1 },
        { name: "documentCv", maxCount: 1 },
        { name: "documentKtp", maxCount: 1 },
        { name: "documentSkck", maxCount: 1 },
        { name: "documentVaccine", maxCount: 1 },
        { name: "supportingDocs", maxCount: 1 },
      ]),
      this.recruitmentFormController.createRecruitmentForm.bind(
        this.recruitmentFormController
      )
    );

    // Get all recruitment forms (with pagination and filtering) - AUTH REQUIRED
    this.router.get(
      "/",
      authMiddleware,
      this.recruitmentFormController.getRecruitmentForms.bind(
        this.recruitmentFormController
      )
    );

    // Get recruitment statistics - AUTH REQUIRED
    this.router.get(
      "/stats",
      authMiddleware,
      this.recruitmentFormController.getRecruitmentStats.bind(
        this.recruitmentFormController
      )
    );

    // Get single recruitment form by ID - AUTH REQUIRED
    this.router.get(
      "/:id",
      authMiddleware,
      this.recruitmentFormController.getRecruitmentFormById.bind(
        this.recruitmentFormController
      )
    );

    // Update recruitment form with file uploads - AUTH REQUIRED
    this.router.put(
      "/:id",
      authMiddleware,
      upload.fields([
        { name: "documentPhoto", maxCount: 1 },
        { name: "documentCv", maxCount: 1 },
        { name: "documentKtp", maxCount: 1 },
        { name: "documentSkck", maxCount: 1 },
        { name: "documentVaccine", maxCount: 1 },
        { name: "supportingDocs", maxCount: 1 },
      ]),
      this.recruitmentFormController.updateRecruitmentForm.bind(
        this.recruitmentFormController
      )
    );

    // Update recruitment status only - AUTH REQUIRED
    this.router.patch(
      "/:id/status",
      authMiddleware,
      this.recruitmentFormController.updateRecruitmentStatus.bind(
        this.recruitmentFormController
      )
    );

    // Delete recruitment form - AUTH REQUIRED
    this.router.delete(
      "/:id",
      authMiddleware,
      this.recruitmentFormController.deleteRecruitmentForm.bind(
        this.recruitmentFormController
      )
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}