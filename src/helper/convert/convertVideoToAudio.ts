import { $ } from "bun";
import fs from "fs";

export async function convertVideoToAudio(videoPath: string) {
  try {
    if (!videoPath) {
      return {
        success: false,
        message: "Video path is required",
      };
    }

    if (!fs.existsSync(videoPath)) {
      return {
        success: false,
        message: "Video file does not exist",
      };
    }

    const audioPath = videoPath.replace(/\.mp4$/i, ".mp3");

    await $`
      ffmpeg -y -i ${videoPath} -vn -acodec libmp3lame ${audioPath}
    `;

    if (!fs.existsSync(audioPath)) {
      return {
        success: false,
        message: "Audio file was not generated",
      };
    }

    console.log("✅ Audio generated at:", audioPath);

    return {
      success: true,
      message: "Audio generated successfully",
      audioPath,
    };
  } catch (error: any) {
    console.error("❌ FFmpeg audio conversion failed:", error);

    return {
      success: false,
      message: error?.message || "Failed to convert video to audio",
    };
  }
}
