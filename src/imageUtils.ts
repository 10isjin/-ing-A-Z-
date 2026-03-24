/**
 * Converts a Google Drive sharing link to a direct image link.
 * @param url The Google Drive URL
 * @returns A direct link to the image file
 */
export const getDirectImageUrl = (url: string | undefined): string => {
  if (!url) return '';

  const trimmedUrl = url.trim();

  // Handle Google Drive links
  // Supports various formats: /d/ID, id=ID, file/d/ID, etc.
  const driveIdMatch = trimmedUrl.match(/(?:id=|\/d\/|file\/d\/|open\?id=|docs\.google\.com\/.*?\/d\/)([\w-]{25,})[^\w-]?/);
  
  if (driveIdMatch && driveIdMatch[1]) {
    const fileId = driveIdMatch[1];
    // lh3.googleusercontent.com is generally more stable for direct embedding
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // Handle YouTube links (extract thumbnail)
  const youtubeIdMatch = trimmedUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (youtubeIdMatch && youtubeIdMatch[1]) {
    const videoId = youtubeIdMatch[1];
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  return trimmedUrl;
};

export const getGoogleDocEmbedUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  const trimmedUrl = url.trim();

  const driveIdMatch = trimmedUrl.match(/(?:id=|\/d\/|file\/d\/|open\?id=|docs\.google\.com\/.*?\/d\/)([\w-]{25,})[^\w-]?/);
  if (!driveIdMatch || !driveIdMatch[1]) return null;
  
  const fileId = driveIdMatch[1];

  if (trimmedUrl.includes('presentation')) {
    return `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000`;
  } else if (trimmedUrl.includes('spreadsheets')) {
    return `https://docs.google.com/spreadsheets/d/${fileId}/pubhtml?widget=true&headers=false`;
  } else if (trimmedUrl.includes('document')) {
    return `https://docs.google.com/document/d/${fileId}/pub?embedded=true`;
  } else if (trimmedUrl.includes('forms')) {
    return `https://docs.google.com/forms/d/${fileId}/viewform?embedded=true`;
  }

  return null;
};

export const isGoogleDoc = (url: string | undefined): boolean => {
  if (!url) return false;
  const trimmedUrl = url.trim();
  return (
    trimmedUrl.includes('docs.google.com/presentation') ||
    trimmedUrl.includes('docs.google.com/spreadsheets') ||
    trimmedUrl.includes('docs.google.com/document') ||
    trimmedUrl.includes('docs.google.com/forms')
  );
};

export const getYoutubeId = (url: string | undefined): string | null => {
  if (!url) return null;
  const trimmedUrl = url.trim();
  
  // Standard YouTube URL formats
  const standardMatch = trimmedUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (standardMatch && standardMatch[1]) return standardMatch[1];
  
  // YouTube Thumbnail URL format (img.youtube.com/vi/ID/...)
  const thumbnailMatch = trimmedUrl.match(/img\.youtube\.com\/vi\/([^"&?\/\s]{11})/);
  if (thumbnailMatch && thumbnailMatch[1]) return thumbnailMatch[1];
  
  return null;
};
