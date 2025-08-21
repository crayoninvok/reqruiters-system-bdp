import { Request, Response } from "express";
import { User } from "@prisma/client";
interface AuthenticatedRequest extends Request {
    user?: User;
    files?: {
        [fieldname: string]: Express.Multer.File[];
    } | Express.Multer.File[];
}
export declare class RecruitmentFormController {
    private getCloudinaryFolder;
    private cleanupFiles;
    private deleteOldFile;
    private deleteAllFiles;
    private generateEmployeeId;
    migrateToHiredEmployee(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getCandidatesReadyForHiring(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createRecruitmentForm(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getRecruitmentForms(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getRecruitmentFormById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateRecruitmentForm(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteRecruitmentForm(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getRecruitmentStats(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateRecruitmentStatus(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export {};
