import { User } from '@prisma/client'; // Import your User model type

declare global {
  namespace Express {
    interface Request {
      user?: User; // Add the 'user' property on the Request object
    }
  }
}
