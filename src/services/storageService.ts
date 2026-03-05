/**
 * Service for handling image download and Convex storage uploads
 * Handles authenticated image URLs (e.g., from Cloudflare R2)
 */

/**
 * Download an image from an authenticated URL and upload it to Convex storage
 * @param imageUrl - The image URL (may be authenticated/signed)
 * @param uploadFileCallable - The Convex uploadFile mutation function
 * @param projectId - The project ID for Convex
 * @returns Object with Convex storage URL and ID
 */
export async function downloadAndUploadToConvex(
  imageUrl: string,
  uploadFileCallable: (args: any) => Promise<any>,
  projectId: string
): Promise<{ url: string; storageId?: string }> {
  try {
    // Fetch the image with proper headers to handle authenticated URLs
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Convert blob to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Upload to Convex storage using the uploadFile mutation
    const result = await uploadFileCallable({
      projectId,
      fileBlob: base64,
      fileName: `image_${Date.now()}.png`,
    });

    return {
      url: result.url,
      storageId: result.storageId,
    };
  } catch (error) {
    console.error('Failed to download and upload image:', error);
    // Fallback to original URL if upload fails
    return { url: imageUrl };
  }
}

/**
 * Download multiple images and upload them to Convex storage
 * @param imageUrls - Array of image URLs
 * @param uploadFileCallable - The Convex uploadFile mutation function
 * @param projectId - The project ID for Convex
 * @returns Array of objects with Convex storage URLs
 */
export async function downloadAndUploadMultiple(
  imageUrls: string[],
  uploadFileCallable: (args: any) => Promise<any>,
  projectId: string
): Promise<{ url: string; storageId?: string }[]> {
  return Promise.all(
    imageUrls.map(url => downloadAndUploadToConvex(url, uploadFileCallable, projectId))
  );
}
