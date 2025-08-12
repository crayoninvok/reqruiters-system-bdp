import { Request, Response } from "express";
import { User } from "@prisma/client";
interface MulterRequest extends Request {
    file?: Express.Multer.File;
    user?: User;
}
export declare class UserController {
    getCurrentUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateProfile(req: MulterRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    removeAvatar(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    changePassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteAccount(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export {};
