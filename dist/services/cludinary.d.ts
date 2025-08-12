import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare const getPublicDownloadUrl: (publicId: string, resourceType?: "image" | "video" | "raw") => string;
export declare const getSignedDownloadUrl: (publicId: string, resourceType?: "image" | "video" | "raw") => string;
export declare const convertToPublicUrl: (cloudinaryUrl: string) => string;
export { cloudinary };
