import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const avatarStorageService = {
  /**
   * Uploads an avatar image to Firebase Storage
   * @param uid User ID
   * @param file Image file to upload
   * @returns Promise resolving to the download URL
   */
  async uploadAvatar(uid: string, file: File): Promise<string> {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG or WebP images are allowed.');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit.');
    }

    try {
      // Create a reference to the file location
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `avatars/${uid}/${fileName}`);

      // Upload the file with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: uid,
          uploadedAt: new Date().toISOString(),
        },
      };

      await uploadBytes(storageRef, file, metadata);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('CORS') || error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        throw error;
      }
      throw new Error('Failed to upload avatar. Please try again.');
    }
  }
};

