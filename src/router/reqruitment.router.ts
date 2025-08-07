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
    // Apply authentication middleware to all routes
    this.router.use(authMiddleware);

    // Create recruitment form with file uploads
    this.router.post(
      "/",
      upload.fields([
        { name: 'documentPhoto', maxCount: 1 },
        { name: 'documentCv', maxCount: 1 },
        { name: 'documentKtp', maxCount: 1 },
        { name: 'documentSkck', maxCount: 1 },
        { name: 'documentVaccine', maxCount: 1 },
        { name: 'supportingDocs', maxCount: 1 }
      ]),
      this.recruitmentFormController.createRecruitmentForm.bind(this.recruitmentFormController)
    );

    // Get all recruitment forms (with pagination and filtering)
    this.router.get(
      "/",
      this.recruitmentFormController.getRecruitmentForms.bind(this.recruitmentFormController)
    );

    // Get recruitment statistics
    this.router.get(
      "/stats",
      this.recruitmentFormController.getRecruitmentStats.bind(this.recruitmentFormController)
    );

    // Get single recruitment form by ID
    this.router.get(
      "/:id",
      this.recruitmentFormController.getRecruitmentFormById.bind(this.recruitmentFormController)
    );

    // Update recruitment form with file uploads
    this.router.put(
      "/:id",
      upload.fields([
        { name: 'documentPhoto', maxCount: 1 },
        { name: 'documentCv', maxCount: 1 },
        { name: 'documentKtp', maxCount: 1 },
        { name: 'documentSkck', maxCount: 1 },
        { name: 'documentVaccine', maxCount: 1 },
        { name: 'supportingDocs', maxCount: 1 }
      ]),
      this.recruitmentFormController.updateRecruitmentForm.bind(this.recruitmentFormController)
    );

    // Update recruitment status only (lightweight endpoint)
    this.router.patch(
      "/:id/status",
      this.recruitmentFormController.updateRecruitmentStatus.bind(this.recruitmentFormController)
    );

    // Delete recruitment form
    this.router.delete(
      "/:id",
      this.recruitmentFormController.deleteRecruitmentForm.bind(this.recruitmentFormController)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}