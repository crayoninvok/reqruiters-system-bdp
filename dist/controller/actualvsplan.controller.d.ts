import { Request, Response } from "express";
import { User } from "@prisma/client";
interface AuthenticatedRequest extends Request {
    user?: User;
}
export declare class ActualVsPlanController {
    getActualVsPlan(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getDepartmentSummary(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updatePlan(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export {};
