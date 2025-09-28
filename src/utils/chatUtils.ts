import { Platform } from 'react-native';

export type Attachment = {
  id: string;
  type: 'image' | 'document';
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
};

export const pickImage = async (): Promise<Attachment | null> => {
  try {
    if (Platform.OS === 'web') {
      // Web implementation
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      return new Promise((resolve) => {
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                id: Date.now().toString(),
                type: 'image',
                uri: e.target?.result as string,
                name: file.name,
                size: file.size,
                mimeType: file.type,
              });
            };
            reader.readAsDataURL(file);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    } else {
      // For native platforms, we'll use a simple alert for now
      // You can implement the native file picker later
      alert('File picking is not implemented for native platforms yet');
      return null;
    }
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

export const pickDocument = async (): Promise<Attachment | null> => {
  try {
    if (Platform.OS === 'web') {
      // Web implementation
      const input = document.createElement('input');
      input.type = 'file';
      
      return new Promise((resolve) => {
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                id: Date.now().toString(),
                type: 'document',
                uri: e.target?.result as string,
                name: file.name,
                size: file.size,
                mimeType: file.type,
              });
            };
            reader.readAsDataURL(file);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    } else {
      // For native platforms, we'll use a simple alert for now
      // You can implement the native file picker later
      alert('File picking is not implemented for native platforms yet');
      return null;
    }
  } catch (error) {
    console.error('Error picking document:', error);
    return null;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType?: string): string => {
  if (!mimeType) return 'document';
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'videocam';
  if (mimeType.startsWith('audio/')) return 'musical-notes';
  if (mimeType.includes('pdf')) return 'document-text';
  if (mimeType.includes('word')) return 'document-text';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'grid';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'easel';
  
  return 'document';
}; 