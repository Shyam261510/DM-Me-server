import { $ } from "bun";
import fs from "fs";
import { deleteFile } from "../file/deleteFile";

export const compressedVideo = async (videoPath: string) => {
  console.log("[CompressVideo] Job started");
  console.log("[CompressVideo] Input:", { videoPath });

  try {
    // 1️⃣ Validate input
    if (!videoPath) {
      console.warn("[CompressVideo] Video path is required");
      return { success: false, message: "Video path is required" };
    }

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      console.error("[CompressVideo] Video file does not exist:", videoPath);
      return {
        success: false,
        message: "Video file does not exist",
      };
    }

    const newVideoPath = videoPath.replace(/\.mp4$/i, "_compressed.mp4");
    console.log("[CompressVideo] Output path:", newVideoPath);

    // 2️⃣ Run FFmpeg compression
    try {
      console.log("[CompressVideo] Starting FFmpeg compression...");

      await $`
ffmpeg -y -i ${videoPath} \
-c:v libx264 \
-preset veryfast \
-crf 28 \
-c:a aac \
-b:a 96k \
${newVideoPath}
`;

      console.log("[CompressVideo] FFmpeg process completed");

      // Verify output file
      if (!fs.existsSync(newVideoPath)) {
        console.error(
          "[CompressVideo] Compressed file not found after FFmpeg:",
          newVideoPath,
        );
        return {
          success: false,
          message: "Compressed video file not created",
        };
      }
    } catch (ffmpegError: any) {
      console.error("[CompressVideo] FFmpeg compression failed:", ffmpegError);
      return {
        success: false,
        message: "Video compression failed",
      };
    }

    console.log(
      "✅ [CompressVideo] Video compressed successfully:",
      newVideoPath,
    );

    // 3️⃣ Delete original file (non-critical cleanup)
    console.log("[CompressVideo] Deleting original file:", videoPath);

    try {
      const videoDeleteResponse = await deleteFile(videoPath);

      if (videoDeleteResponse.success) {
        console.log("[CompressVideo] Original video deleted");
      } else {
        console.warn("[CompressVideo] Original video deletion failed");
      }
    } catch (deleteError) {
      console.warn(
        "[CompressVideo] Error deleting original video:",
        deleteError,
      );
      // Cleanup failure should not break pipeline
    }

    console.log("[CompressVideo] Job completed successfully");

    // 4️⃣ Return success
    return {
      success: true,
      message: "Video compressed without changing resolution",
      videoPath: newVideoPath,
    };
  } catch (error: any) {
    // Final fallback
    console.error("[CompressVideo] Unexpected error:", error);
    return {
      success: false,
      message: error.message || "Something went wrong during video compression",
    };
  }
};
