"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.convertToPublicUrl = exports.getSignedDownloadUrl = exports.getPublicDownloadUrl = exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: (req, file) => {
            if (file.fieldname === 'avatar') {
                const userRole = req.user?.role;
                if (userRole === 'HR') {
                    return 'hr_avatar';
                }
                else if (userRole === 'ADMIN') {
                    return 'admin_avatar';
                }
                else {
                    return 'user_avatar';
                }
            }
            if (file.fieldname === 'documentPhoto') {
                return 'rec_avatar';
            }
            if (file.fieldname === 'documentCv' ||
                file.fieldname === 'documentKtp' ||
                file.fieldname === 'documentSkck' ||
                file.fieldname === 'documentVaccine' ||
                file.fieldname === 'supportingDocs') {
                return 'rec_docs';
            }
            return 'general_uploads';
        },
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `${file.fieldname}-${uniqueSuffix}`;
        },
        resource_type: 'auto',
        access_mode: 'public',
        type: 'upload',
        use_filename: false,
        unique_filename: true,
    },
});
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
        }
    }
});
const getPublicDownloadUrl = (publicId, resourceType = 'raw') => {
    return cloudinary_1.v2.url(publicId, {
        resource_type: resourceType,
        type: 'upload',
        flags: 'attachment',
        secure: true
    });
};
exports.getPublicDownloadUrl = getPublicDownloadUrl;
const getSignedDownloadUrl = (publicId, resourceType = 'raw') => {
    const timestamp = Math.round(new Date().getTime() / 1000) + 3600;
    return cloudinary_1.v2.utils.private_download_url(publicId, resourceType, {
        expires_at: timestamp,
        attachment: true
    });
};
exports.getSignedDownloadUrl = getSignedDownloadUrl;
const convertToPublicUrl = (cloudinaryUrl) => {
    if (!cloudinaryUrl.includes('res.cloudinary.com')) {
        return cloudinaryUrl;
    }
    if (cloudinaryUrl.includes('/upload/') && !cloudinaryUrl.includes('fl_attachment')) {
        return cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
    }
    return cloudinaryUrl;
};
exports.convertToPublicUrl = convertToPublicUrl;
