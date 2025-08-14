import { Request, Response } from "express";
export declare class AnalyticsController {
    getDashboardStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsByStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsByPosition(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsByProvince(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsByEducation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsTrend(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsByExperience(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsByMaritalStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAgeDistribution(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getRecruitersByDepartment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getCustomAnalytics(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
