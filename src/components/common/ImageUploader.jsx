import { useState } from "react";
import { processImage } from "../../utils/imageCompression";

export function ImageUploader({ onImageUpload, maxSize = "10MB" }) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleImageSelect = async (file) => {
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Process & upload (automatically uses env variable API key)
      const imgUrl = await processImage(file);
      onImageUpload(imgUrl);
      setPreview(null);
    } catch (err) {
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
            background: "#fff0f5",
            border: "1.5px solid #fce7f3",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: "#be185d",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fce7f3";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff0f5";
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

      {preview && (
        <div style={{ marginTop: 10 }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: "200px",
              maxHeight: "150px",
              borderRadius: 8,
              border: "1.5px solid #fce7f3",
            }}
          />
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
            color: "#ec4899",
            fontWeight: 600,
          }}
        >
          ⏳ Uploading & compressing...
        </div>
      )}
    </>
  );
}
