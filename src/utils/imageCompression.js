/**
 * Image Compression Utility
 * Compresses images before upload to save bandwidth and storage
 */

/**
 * Compress image file
 * @param {File} file - Image file to compress
 * @param {number} quality - Compression quality (0.1 - 1.0), default 0.7
 * @param {number} maxWidth - Max width in pixels, default 1200
 * @returns {Promise<Blob>} Compressed image blob
 */
export async function compressImage(file, quality = 0.7, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Reduce dimensions if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const sizeKB = (blob.size / 1024).toFixed(2);
            console.log(`✅ Image compressed: ${sizeKB}KB (quality: ${quality})`);
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image to ImgBB (free image hosting)
 * @param {Blob} imageBlob - Compressed image blob
 * @param {string} apiKey - ImgBB API key (optional, uses env variable if not provided)
 * @returns {Promise<string>} Image URL
 */
export async function uploadToImgBB(imageBlob, apiKey) {
  // Use environment variable if no API key provided
  const key = apiKey || import.meta.env.VITE_IMGBB_API_KEY;
  
  if (!key) {
    console.warn("⚠️ ImgBB API key not configured. Using local storage fallback.");
    return blobToDataURL(imageBlob);
  }

  const formData = new FormData();
  formData.append("image", imageBlob);
  formData.append("key", key);

  try {
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ImgBB error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      console.log(`✅ Image uploaded to ImgBB: ${data.data.url}`);
      return data.data.url;
    } else {
      throw new Error(data.error?.message || "Upload failed");
    }
  } catch (error) {
    console.error("❌ ImgBB upload failed:", error);
    console.log("💾 Falling back to local storage...");
    return blobToDataURL(imageBlob);
  }
}

/**
 * Convert blob to data URL (fallback for local storage)
 * @param {Blob} blob - Image blob
 * @returns {Promise<string>} Data URL
 */
function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

/**
 * Process image file: compress + upload
 * @param {File} file - Image file
 * @param {string} apiKey - Optional ImgBB API key (uses env variable by default)
 * @returns {Promise<string>} Final image URL
 */
export async function processImage(file, apiKey = null) {
  try {
    // Validate file
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are supported");
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB max
      throw new Error("File too large (max 50MB)");
    }

    // Compress
    const compressed = await compressImage(file, 0.75, 1200);

    // Upload (uses env variable if no apiKey provided)
    const url = await uploadToImgBB(compressed, apiKey);

    return url;
  } catch (error) {
    console.error("❌ Image processing failed:", error.message);
    throw error;
  }
}

/**
 * Get ImgBB API key from localStorage
 * @returns {string|null} Stored API key or null
 */
export function getImgBBKey() {
  return localStorage.getItem("akmedu_imgbb_key");
}

/**
 * Set ImgBB API key in localStorage
 * @param {string} key - ImgBB API key
 */
export function setImgBBKey(key) {
  localStorage.setItem("akmedu_imgbb_key", key);
  console.log("✅ ImgBB API key saved");
}

/**
 * Clear ImgBB API key
 */
export function clearImgBBKey() {
  localStorage.removeItem("akmedu_imgbb_key");
  console.log("🗑️ ImgBB API key cleared");
}
