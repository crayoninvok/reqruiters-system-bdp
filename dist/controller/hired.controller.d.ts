import { Request, Response } from "express";
import { User } from "@prisma/client";
interface AuthenticatedRequest extends Request {
    user?: User;
}
export declare class HiredEmployeeController {
    getHiredEmployees(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getHiredEmployeeById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getHiredEmployeesStats(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getAvailableSupervisors(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateHiredEmployee(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteHiredEmployee(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    restoreHiredEmployee(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    private checkCircularSupervision;
}
export {};
