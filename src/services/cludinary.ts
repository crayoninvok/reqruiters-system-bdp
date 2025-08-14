import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Request interface to include user property (using Prisma User type)
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req: AuthenticatedRequest, file: Express.Multer.File) => {
      // Handle avatar uploads (for user profiles)
      if (file.fieldname === 'avatar') {
        const userRole = req.user?.role;
        if (userRole === 'HR') {
          return 'hr_avatar';
        } else if (userRole === 'ADMIN') {
          return 'admin_avatar';
        } else {
          return 'user_avatar'; 
        }
      }
      
      // Handle recruitment form document photo (profile photo)
      if (file.fieldname === 'documentPhoto') {
        return 'rec_avatar';
      }
      
      // Handle all other recruitment documents
      if (file.fieldname === 'documentCv' || 
          file.fieldname === 'documentKtp' || 
          file.fieldname === 'documentSkck' || 
          file.fieldname === 'documentVaccine' || 
          file.fieldname === 'supportingDocs') {
        return 'rec_docs';
      }
      
      // Fallback for any other uploads
      return 'general_uploads';
    },
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'], 
    public_id: (req: AuthenticatedRequest, file: Express.Multer.File) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `${file.fieldname}-${uniqueSuffix}`;
    },
    resource_type: 'auto', // Auto-detect resource type (image, video, etc.)
    // ADD THESE CRUCIAL SETTINGS:
    access_mode: 'public', // Ensure public access
    type: 'upload', // Use 'upload' type (not 'private')
    use_filename: false, // Use generated public_id instead of filename
    unique_filename: true, // Ensure unique filenames
  } as any,
});

// Create multer upload middleware with custom file size validation
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // Set to largest file size (3MB)
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Define allowed file types for each field
    const allowedTypesMap = {
      documentPhoto: { types: /jpeg|jpg|png/, mimetypes: /image\/(jpeg|jpg|png)/ },
      documentCv: { types: /pdf/, mimetypes: /application\/pdf/ },
      documentKtp: { types: /jpeg|jpg|png|pdf/, mimetypes: /image\/(jpeg|jpg|png)|application\/pdf/ },
      documentSkck: { types: /pdf/, mimetypes: /application\/pdf/ },
      documentVaccine: { types: /jpeg|jpg|png|pdf/, mimetypes: /image\/(jpeg|jpg|png)|application\/pdf/ },
      supportingDocs: { types: /pdf/, mimetypes: /application\/pdf/ },
      avatar: { types: /jpeg|jpg|png|gif/, mimetypes: /image\/(jpeg|jpg|png|gif)/ }
    };

    const fieldConfig = allowedTypesMap[file.fieldname as keyof typeof allowedTypesMap];
    
    if (!fieldConfig) {
      // Default fallback
      const allowedTypes = /jpeg|jpg|png|gif|pdf/;
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
      }
    }

    // Check file extension
    const extname = fieldConfig.types.test(file.originalname.toLowerCase());
    // Check mimetype
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

// Create specific upload middlewares for different file types with exact size limits
export const uploadRecruitmentDocs = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // Set to max size (3MB)
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Custom size limits based on file type/field (in bytes)
    const maxSizes = {
      documentPhoto: 3 * 1024 * 1024,      // 3MB for profile photos
      documentCv: 2 * 1024 * 1024,         // 2MB for CV/Resume
      documentKtp: 1 * 1024 * 1024,        // 1MB for ID cards
      documentSkck: 2 * 1024 * 1024,       // 2MB for police records
      documentVaccine: 2 * 1024 * 1024,    // 2MB for vaccine certificates
      supportingDocs: 3 * 1024 * 1024,     // 3MB for supporting documents
      avatar: 3 * 1024 * 1024,             // 3MB for avatars
    };

    const fieldMaxSize = maxSizes[file.fieldname as keyof typeof maxSizes] || 3 * 1024 * 1024;

    // Note: We can't check file.size here as it's not available in fileFilter
    // Size validation happens after this in multer's limits, but we set it to the max possible
    
    // Define allowed file types for each field
    const allowedTypesMap = {
      documentPhoto: { types: /jpeg|jpg|png/, mimetypes: /image\/(jpeg|jpg|png)/, formats: 'JPG, PNG' },
      documentCv: { types: /pdf/, mimetypes: /application\/pdf/, formats: 'PDF' },
      documentKtp: { types: /jpeg|jpg|png|pdf/, mimetypes: /image\/(jpeg|jpg|png)|application\/pdf/, formats: 'PDF, JPG, PNG' },
      documentSkck: { types: /pdf/, mimetypes: /application\/pdf/, formats: 'PDF' },
      documentVaccine: { types: /jpeg|jpg|png|pdf/, mimetypes: /image\/(jpeg|jpg|png)|application\/pdf/, formats: 'PDF, JPG, PNG' },
      supportingDocs: { types: /pdf/, mimetypes: /application\/pdf/, formats: 'PDF' },
    };

    const fieldConfig = allowedTypesMap[file.fieldname as keyof typeof allowedTypesMap];
    
    if (!fieldConfig) {
      return cb(new Error('Invalid field name for file upload.'));
    }

    // Check file extension and mimetype
    const extname = fieldConfig.types.test(file.originalname.toLowerCase());
    const mimetype = fieldConfig.mimetypes.test(file.mimetype);

    if (!mimetype || !extname) {
      return cb(new Error(`Invalid file type for ${file.fieldname}. Only ${fieldConfig.formats} files are allowed.`));
    }

    return cb(null, true);
  }
});

// Alternative: Create individual middlewares for each document type
export const uploadProfilePhoto = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB for profile photos
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png/;
    const allowedMimes = /image\/(jpeg|jpg|png)/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedMimes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Profile photo must be JPG or PNG format.'));
    }
  }
});

export const uploadCV = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for CV
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /pdf/;
    const allowedMimes = /application\/pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedMimes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('CV must be PDF format.'));
    }
  }
});

export const uploadKTP = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB for KTP
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const allowedMimes = /image\/(jpeg|jpg|png)|application\/pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedMimes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('KTP must be PDF, JPG, or PNG format.'));
    }
  }
});

// Helper function to generate public download URL
export const getPublicDownloadUrl = (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'raw') => {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'upload',
    flags: 'attachment', // Forces download instead of display
    secure: true // Use HTTPS
  });
};

// Helper function to generate signed download URL (more secure)
export const getSignedDownloadUrl = (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'raw') => {
  const timestamp = Math.round(new Date().getTime() / 1000) + 3600; // Expires in 1 hour
  
  return cloudinary.utils.private_download_url(publicId, resourceType, {
    expires_at: timestamp,
    attachment: true // Force download
  });
};

// Helper function to fix existing URLs for public access
export const convertToPublicUrl = (cloudinaryUrl: string): string => {
  if (!cloudinaryUrl.includes('res.cloudinary.com')) {
    return cloudinaryUrl;
  }

  // Add attachment flag for download
  if (cloudinaryUrl.includes('/upload/') && !cloudinaryUrl.includes('fl_attachment')) {
    return cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
  }
  
  return cloudinaryUrl;
};

// Utility function to get human-readable file size limits
export const getFileSizeLimit = (fieldName: string): string => {
  const limits = {
    documentPhoto: '3MB',
    avatar: '3MB', 
    documentCv: '2MB',
    documentKtp: '1MB',
    documentSkck: '2MB',
    documentVaccine: '2MB',
    supportingDocs: '3MB',
  };
  
  return limits[fieldName as keyof typeof limits] || '3MB';
};

// Export cloudinary for direct use
export { cloudinary };