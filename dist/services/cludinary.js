"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.getFileSizeLimit = exports.convertToPublicUrl = exports.getSignedDownloadUrl = exports.getPublicDownloadUrl = exports.uploadKTP = exports.uploadCV = exports.uploadProfilePhoto = exports.uploadRecruitmentDocs = exports.upload = void 0;
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
        fileSize: 3 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypesMap = {
            documentPhoto: { types: /jpeg|jpg|png/, mimetypes: /image\/(jpeg|jpg|png)/ },
            documentCv: { types: /pdf/, mimetypes: /application\/pdf/ },
            documentKtp: { types: /jpeg|jpg|png|pdf/, mimetypes: /image\/(jpeg|jpg|png)|application\/pdf/ },
            documentSkck: { types: /pdf/, mimetypes: /application\/pdf/ },
            documentVaccine: { types: /jpeg|jpg|png|pdf/, mimetypes: /image\/(jpeg|jpg|png)|application\/pdf/ },
            supportingDocs: { types: /pdf/, mimetypes: /application\/pdf/ },
            avatar: { types: /jpeg|jpg|png|gif/, mimetypes: /image\/(jpeg|jpg|png|gif)/ }
        };
        const fieldConfig = allowedTypesMap[file.fieldname];
        if (!fieldConfig) {
            const allowedTypes = /jpeg|jpg|png|gif|pdf/;
            const extname = allowedTypes.test(file.originalname.toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);
            if (mimetype && extname) {
                return cb(null, true);
            }
            else {
                return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
            }
        }
        const extname = fieldConfig.types.test(file.originalname.toLowerCase());
        const mimetype = fieldConfig.mimetypes.test(file.mimetype);
        if (!mimetype || !extname) {
            let allowedFormats = '';
            switch (file.fieldname) {
                case 'documentPhoto':
                    allowedFormats = 'JPG, PNG';
                    break;
                case 'documentCv':
                    allowedFormats = 'PDF';
                    break;
                case 'documentKtp':
                    allowedFormats = 'PDF, JPG, PNG';
                    break;
                case 'documentSkck':
                    allowedFormats = 'PDF';
                    break;
                case 'documentVaccine':
                    allowedFormats = 'PDF, JPG, PNG';
                    break;
                case 'supportingDocs':
                    allowedFormats = 'PDF';
                    break;
                default:
                    allowedFormats = 'JPEG, PNG, GIF, PDF';
            }
            return cb(new Error(`Invalid file type for ${file.fieldname}. Only ${allowedFormats} files are allowed.`));
        }
        return cb(null, true);
    }
});
exports.uploadRecruitmentDocs = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const maxSizes = {
            documentPhoto: 3 * 1024 * 1024,
            documentCv: 2 * 1024 * 1024,
            documentKtp: 1 * 1024 * 1024,
            documentSkck: 2 * 1024 * 1024,
            documentVaccine: 2 * 1024 * 1024,
            supportingDocs: 3 * 1024 * 1024,
            avatar: 3 * 1024 * 1024,
        };
        const fieldMaxSize = maxSizes[file.fieldname] || 3 * 1024 * 1024;
        const allowedTypesMap = {
            documentPhoto: { types: /jpeg|jpg|png/, mimetypes: /image\/(jpeg|jpg|png)/, formats: 'JPG, PNG' },
            documentCv: { types: /pdf/, mimetypes: /application\/pdf/, formats: 'PDF' },
            documentKtp: { types: /jpeg|jpg|png|pdf/, mimetypes: /image\/(jpeg|jpg|png)|application\/pdf/, formats: 'PDF, JPG, PNG' },
            documentSkck: { types: /pdf/, mimetypes: /application\/pdf/, formats: 'PDF' },
            documentVaccine: { types: /jpeg|jpg|png|pdf/, mimetypes: /image\/(jpeg|jpg|png)|application\/pdf/, formats: 'PDF, JPG, PNG' },
            supportingDocs: { types: /pdf/, mimetypes: /application\/pdf/, formats: 'PDF' },
        };
        const fieldConfig = allowedTypesMap[file.fieldname];
        if (!fieldConfig) {
            return cb(new Error('Invalid field name for file upload.'));
        }
        const extname = fieldConfig.types.test(file.originalname.toLowerCase());
        const mimetype = fieldConfig.mimetypes.test(file.mimetype);
        if (!mimetype || !extname) {
            return cb(new Error(`Invalid file type for ${file.fieldname}. Only ${fieldConfig.formats} files are allowed.`));
        }
        return cb(null, true);
    }
});
exports.uploadProfilePhoto = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const allowedMimes = /image\/(jpeg|jpg|png)/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedMimes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Profile photo must be JPG or PNG format.'));
        }
    }
});
exports.uploadCV = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf/;
        const allowedMimes = /application\/pdf/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedMimes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('CV must be PDF format.'));
        }
    }
});
exports.uploadKTP = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 1 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const allowedMimes = /image\/(jpeg|jpg|png)|application\/pdf/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedMimes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('KTP must be PDF, JPG, or PNG format.'));
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
const getFileSizeLimit = (fieldName) => {
    const limits = {
        documentPhoto: '3MB',
        avatar: '3MB',
        documentCv: '2MB',
        documentKtp: '1MB',
        documentSkck: '2MB',
        documentVaccine: '2MB',
        supportingDocs: '3MB',
    };
    return limits[fieldName] || '3MB';
};
exports.getFileSizeLimit = getFileSizeLimit;
