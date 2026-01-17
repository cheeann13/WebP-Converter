
export async function convertToWebP(
  file: File, 
  quality: number = 0.8
): Promise<{ blob: Blob; fileName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              resolve({
                blob,
                fileName: `${nameWithoutExt}.webp`
              });
            } else {
              reject(new Error('Conversion failed'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
