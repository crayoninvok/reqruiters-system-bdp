import { Request, Response } from "express";
export declare class AnalyticsController {
    getOverallStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsByPosition(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsByProvince(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsByExperience(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getApplicationsByEducation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getMonthlyTrends(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getRecentApplications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAgeDistribution(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getDashboardData(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private getOverallStatsData;
    private getTopPositionsData;
    private getTopProvincesData;
    private getMonthlyTrendsData;
    private getRecentApplicationsData;
}
