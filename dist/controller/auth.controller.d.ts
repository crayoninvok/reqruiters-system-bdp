import { Request, Response } from "express";
export declare class AuthController {
    loginUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    logoutUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    registerUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createHRUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getHRUsers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getHRUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateHRUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteHRUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    changeUserRole(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
