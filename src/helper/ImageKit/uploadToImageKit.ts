import { ImageKit } from "@imagekit/nodejs/client.js";
import { deleteFile } from "../file/deleteFile";
import fs from "fs";

export const uploadToImageKit = async (audioPath: string, fileName: string) => {
  console.log("[UploadToImageKit] Input:", { audioPath, fileName });

  try {
    // 1️⃣ Validate input
    if (!audioPath || !fileName) {
      console.warn("[UploadToImageKit] Missing audioPath or fileName");
      return {
        success: false,
        message: "Missing argument audioPath or fileName",
      };
    }

    // 2️⃣ Initialize ImageKit client

    const imagekit = new ImageKit({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    });

    // 3️⃣ Get video path from audio path
    // Example: reel.mp3 → reel.mp4
    const videoPath = audioPath.replace(/\.mp3$/i, ".mp4");
    console.log("[UploadToImageKit] Derived video path:", videoPath);

    // Check if file exists before upload
    if (!fs.existsSync(videoPath)) {
      console.error("[UploadToImageKit] Video file not found:", videoPath);
      return {
        success: false,
        message: "Video file not found",
      };
    }

    // 4️⃣ Upload video to ImageKit
    console.log("[UploadToImageKit] Uploading file to ImageKit...");
    const res = await imagekit.files.upload({
      file: fs.createReadStream(videoPath),
      fileName: fileName.slice(0, 20),
      folder: "/DM_Me",
    });

    console.log("[UploadToImageKit] Upload successful:", {
      url: res.url,
      fileId: res.fileId,
    });

    // 5️⃣ Delete local files after upload (cleanup)
    console.log("[UploadToImageKit] Deleting local files...");

    try {
      const videoDeleteResponse = await deleteFile(videoPath);
      if (videoDeleteResponse.success) {
        console.log("[UploadToImageKit] Video deleted:", videoPath);
      } else {
        console.warn("[UploadToImageKit] Video deletion failed:", videoPath);
      }
    } catch (err) {
      console.warn("[UploadToImageKit] Video delete error:", err);
    }

    try {
      const audioDeleteResponse = await deleteFile(audioPath);
      if (audioDeleteResponse.success) {
        console.log("[UploadToImageKit] Audio deleted:", audioPath);
      } else {
        console.warn("[UploadToImageKit] Audio deletion failed:", audioPath);
      }
    } catch (err) {
      console.warn("[UploadToImageKit] Audio delete error:", err);
    }

    console.log("[UploadToImageKit] Job completed successfully");

    // 6️⃣ Return response
    return {
      success: true,
      url: res.url,
      fileId: res.fileId,
      thumnailImage: res.thumbnailUrl,
    };
  } catch (error: any) {
    console.error("[UploadToImageKit] Upload failed:", error?.message || error);
    return {
      success: false,
      message: "Failed to upload file to ImageKit",
    };
  }
};
