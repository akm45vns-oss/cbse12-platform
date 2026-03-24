import { useState } from "react";
import { processImage } from "../../utils/imageCompression";

export function ImageUploader({ onImageUpload }) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleImageSelect = async (file) => {
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Process & upload (automatically uses env variable API key)
      const imgUrl = await processImage(file);
      console.log("✅ Image uploaded:", imgUrl);
      onImageUpload(imgUrl);
      setUploadedUrl(imgUrl);
      setPreview(null); // Clear local preview after upload
    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            background: "#f0f9fc",
            border: "1.5px solid #dbeafe",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: "#0369a1",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#dbeafe";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f0f9fc";
          }}
        >
          🖼️ Add Image
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageSelect(e.target.files?.[0])}
            disabled={isUploading}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {preview && !uploadedUrl && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>📸 Preview:</div>
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: "200px",
              maxHeight: "150px",
              borderRadius: 8,
              border: "1.5px solid #dbeafe",
            }}
          />
        </div>
      )}

      {uploadedUrl && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "#16a34a", marginBottom: 6, fontWeight: 600 }}>
            ✅ Image uploaded successfully!
          </div>
          <img
            src={uploadedUrl}
            alt="Uploaded"
            style={{
              maxWidth: "200px",
              maxHeight: "150px",
              borderRadius: 8,
              border: "2px solid #16a34a",
            }}
          />
          <button
            onClick={() => {
              setUploadedUrl(null);
              setPreview(null);
            }}
            style={{
              marginTop: 8,
              padding: "4px 10px",
              background: "#fee5e5",
              border: "1px solid #fca5a5",
              borderRadius: 6,
              color: "#dc2626",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ✕ Remove Image
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: "#fee5e5",
            border: "1px solid #fca5a5",
            borderRadius: 6,
            fontSize: 12,
            color: "#dc2626",
          }}
        >
          ❌ {error}
        </div>
      )}

      {isUploading && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#0891b2",
            fontWeight: 600,
          }}
        >
          ⏳ Uploading & compressing...
        </div>
      )}
    </>
  );
}
