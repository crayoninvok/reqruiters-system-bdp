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
    // Add explicit CORS handling for the submit endpoint
    this.router.options("/submit", (req, res) => {
      console.log("OPTIONS request for /submit received");
      res.header(
        "Access-Control-Allow-Origin",
        process.env.BASE_URL_FE || "https://bdphrdatabase.vercel.app"
      );
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin"
      );
      res.sendStatus(200);
    });

    // Submit recruitment form (with file uploads) - POST /api/public-recruitment/submit
    this.router.post(
      "/submit",
      // Add CORS headers before multer middleware
      (req, res, next) => {
        console.log(
          "POST request for /submit received from:",
          req.headers.origin
        );
        res.header(
          "Access-Control-Allow-Origin",
          process.env.BASE_URL_FE || "https://bdphrdatabase.vercel.app"
        );
        res.header("Access-Control-Allow-Credentials", "true");
        next();
      },
      // Then apply multer middleware
      upload.fields([
        { name: "documentPhoto", maxCount: 1 },
        { name: "documentCv", maxCount: 1 },
        { name: "documentKtp", maxCount: 1 },
        { name: "documentSkck", maxCount: 1 },
        { name: "documentVaccine", maxCount: 1 },
        { name: "supportingDocs", maxCount: 1 },
      ]),
      // Finally the controller
      this.publicRecruitmentController.submitRecruitmentForm.bind(
        this.publicRecruitmentController
      )
    );

    // Get form options (provinces, sizes, etc.) - GET /api/public-recruitment/options
    this.router.get(
      "/options",
      this.publicRecruitmentController.getFormOptions.bind(
        this.publicRecruitmentController
      )
    );

    // Check application status by ID - GET /api/public-recruitment/status/:id
    this.router.get(
      "/status/:id",
      this.publicRecruitmentController.checkApplicationStatus.bind(
        this.publicRecruitmentController
      )
    );
    this.router.post(
      "/upload-signature",
      this.publicRecruitmentController.generateUploadSignature.bind(
        this.publicRecruitmentController
      )
    );

    // NEW ROUTE 2: Submit form with URLs (no file upload)
    this.router.post(
      "/submit-with-urls",
      this.publicRecruitmentController.submitWithUrls.bind(
        this.publicRecruitmentController
      )
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
