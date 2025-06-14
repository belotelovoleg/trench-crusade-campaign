// campaignCropImage.ts
// Обрізає зображення за допомогою canvas для react-easy-crop
// Modified version that supports rectangular (16:9) images for campaigns
export default function getCampaignCroppedImg(imageSrc: string, crop: any, width = 600): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      // Calculate height based on 16:9 aspect ratio
      const height = Math.round(width / (16 / 9));
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No ctx');
      
      // crop = { x, y, width, height }
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        width,
        height
      );
      canvas.toBlob((blob) => {
        if (!blob) return reject('No blob');
        resolve(blob);
      }, 'image/jpeg', 0.95);
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}
