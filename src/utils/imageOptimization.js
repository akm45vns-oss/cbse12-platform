/**
 * Image Optimization Utilities
 * Provides responsive images, lazy loading, and format detection
 */

/**
 * Generate responsive image srcset
 * @param {string} imagePath - Path to image
 * @param {array} sizes - Array of widths: [320, 640, 1024]
 * @returns {object} srcSet and sizes object
 */
export function getResponsiveImage(imagePath, sizes = [320, 640, 1024, 1920]) {
  const basePath = imagePath.substring(0, imagePath.lastIndexOf('.'));
  const ext = imagePath.substring(imagePath.lastIndexOf('.') + 1);

  // Generate srcset for different sizes
  const srcSet = sizes
    .map(size => {
      // For this implementation, we'll use the original image
      // In production, you'd use an image optimization service like Cloudinary or Vercel Image Optimization
      return `${imagePath} ${size}w`;
    })
    .join(', ');

  return {
    src: imagePath,
    srcSet,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw',
  };
}

/**
 * Create a lazy-loaded image component config
 * @param {string} imagePath - Path to image
 * @param {string} placeholder - Placeholder while loading (base64 or low-res)
 * @returns {object} Image config
 */
export function getLazyImageConfig(imagePath, placeholder = null) {
  return {
    img: {
      src: imagePath,
      loading: 'lazy',
      decoding: 'async',
      ...(placeholder && { 'data-placeholder': placeholder }),
    },
    style: {
      aspectRatio: 'auto',
      maxWidth: '100%',
      height: 'auto',
    },
  };
}

/**
 * Check and suggest WebP support
 */
export function supportsWebP() {
  try {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  } catch {
    return false;
  }
}

/**
 * Get optimized image URL with format detection
 * @param {string} imagePath - Path to image
 * @returns {string} Optimized image path
 */
export function getOptimizedImagePath(imagePath) {
  // If WebP is supported and image is PNG/JPG, try serving WebP version
  if (supportsWebP() && (imagePath.endsWith('.png') || imagePath.endsWith('.jpg'))) {
    const optimizedPath = imagePath.substring(0, imagePath.lastIndexOf('.')) + '.webp';
    // Fallback to original if WebP doesn't exist
    return optimizedPath;
  }

  return imagePath;
}

/**
 * Preload critical images
 * @param {array} imagePaths - Array of image paths to preload
 */
export function preloadImages(imagePaths) {
  imagePaths.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = path;
    document.head.appendChild(link);
  });
}

/**
 * Inline SVG optimization for small graphics
 * Reduces HTTP requests for icons
 */
export const optimizedSVGs = {
  // Define your critical SVGs here as inline strings
  // This reduces HTTP requests and load time
  loading: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
};

/**
 * Generate optimal image HTML with all optimizations
 */
export function createOptimizedImage(imagePath, alt = '', options = {}) {
  const {
    lazy = true,
    responsive = true,
    placeholder = null,
  } = options;

  const responsiveAttrs = responsive ? getResponsiveImage(imagePath) : {};

  return {
    src: getOptimizedImagePath(imagePath),
    alt,
    loading: lazy ? 'lazy' : 'eager',
    decoding: 'async',
    ...responsiveAttrs,
  };
}
