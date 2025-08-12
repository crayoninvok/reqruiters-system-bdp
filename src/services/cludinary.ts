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

// Create multer upload middleware
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
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

// Export cloudinary for direct use
export { cloudinary };