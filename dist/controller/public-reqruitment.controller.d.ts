import { Request, Response } from "express";
interface PublicRequest extends Request {
    files?: {
        [fieldname: string]: Express.Multer.File[];
    } | Express.Multer.File[];
}
export declare class PublicRecruitmentController {
    private getCloudinaryFolder;
    private cleanupFiles;
    submitRecruitmentForm(req: PublicRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getFormOptions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    checkApplicationStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    generateUploadSignature(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    submitWithUrls(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export {};
