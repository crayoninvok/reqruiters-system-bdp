import { Request, Response } from "express";
export declare class AuthController {
    loginUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    logoutUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    registerUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
