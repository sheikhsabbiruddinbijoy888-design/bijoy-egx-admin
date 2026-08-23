/**
 * Media & Video URL Parser Utility for EGX Esports Platform
 * Converts YouTube, Vimeo, and direct video files into normalized embed and direct URLs.
 */

export interface ParsedVideoMedia {
  type: 'youtube' | 'video' | 'iframe';
  embedUrl: string;
  directUrl: string;
  videoId?: string;
  isDirectFile: boolean;
}

export function parseSupportVideoUrl(rawUrl?: string): ParsedVideoMedia {
  const defaultFallback: ParsedVideoMedia = {
    type: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1',
    directUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    isDirectFile: false
  };

  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return defaultFallback;
  }

  const url = rawUrl.trim();

  // 1. Direct file extensions or local server uploaded video files
  const isDirectVideoFile =
    url.startsWith('/uploads/') ||
    url.startsWith('blob:') ||
    url.startsWith('data:video') ||
    /\.(mp4|webm|ogg|m4v|mov|avi|mkv)(\?.*)?$/i.test(url);

  if (isDirectVideoFile) {
    return {
      type: 'video',
      embedUrl: url,
      directUrl: url,
      isDirectFile: true
    };
  }

  // 2. YouTube Parsing
  // Handles:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  // - https://youtube-nocookie.com/embed/VIDEO_ID
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
  );

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`,
      directUrl: `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      isDirectFile: false
    };
  }

  // 3. Vimeo Parsing
  const vimeoMatch = url.match(
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|))(\d+)/i
  );
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      type: 'iframe',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
      directUrl: `https://vimeo.com/${vimeoId}`,
      videoId: vimeoId,
      isDirectFile: false
    };
  }

  // 4. If URL already is an embed URL (e.g. facebook embed, dailymotion, custom iframe)
  if (url.includes('/embed/') || url.includes('player.')) {
    return {
      type: 'iframe',
      embedUrl: url,
      directUrl: url,
      isDirectFile: false
    };
  }

  // 5. Default fallback to iframe
  return {
    type: 'iframe',
    embedUrl: url,
    directUrl: url,
    isDirectFile: false
  };
}
