import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function generateSignature(folder: string = 'family-album', transformation?: string) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params: any = {
    timestamp,
    folder,
  };
  
  // Use eager transformation for async processing of large videos
  if (transformation) {
    params.eager = transformation;
    params.eager_async = true;
  }
  
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  
  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
    eager: transformation ? transformation : undefined,
    eager_async: transformation ? true : undefined
  };
}
