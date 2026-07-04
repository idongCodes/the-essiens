import { getOptimizedCloudinaryUrl } from '@/lib/imageUtils';

describe('getOptimizedCloudinaryUrl', () => {
  it('should return the original url if it is not a Cloudinary url', () => {
    const url = 'https://example.com/image.jpg';
    expect(getOptimizedCloudinaryUrl(url)).toBe(url);
  });

  it('should return the original url if it is empty', () => {
    expect(getOptimizedCloudinaryUrl('')).toBe('');
  });

  it('should correctly format a Cloudinary url with width and crop', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v123/folder/image.jpg';
    const result = getOptimizedCloudinaryUrl(url, { width: 400, crop: 'limit' });
    expect(result).toBe('https://res.cloudinary.com/demo/image/upload/q_auto,f_auto,w_400,c_limit/v123/folder/image.jpg');
  });

  it('should apply defaults correctly if no width or height is provided', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v123/folder/image.jpg';
    const result = getOptimizedCloudinaryUrl(url);
    expect(result).toBe('https://res.cloudinary.com/demo/image/upload/q_auto,f_auto/v123/folder/image.jpg');
  });
});
