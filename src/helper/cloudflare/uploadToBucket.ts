import { Bucket } from "../../libs/Bucket";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { deleteFile } from "../file/deleteFile";
import fs from "fs";
import { handelAsyc } from "../validation/handelAsync";

export const uploadToBucket = async (audioPath: string, fileName: string) => {
  const startTime = Date.now();
  const jobId = `UPLOAD_${Date.now()}`;

  console.log(`\n========== [${jobId}] Upload Job Started ==========`);

  // 1️⃣ Validate input
  if (!audioPath || !fileName) {
    console.warn(`[${jobId}] ❌ Missing input`, { audioPath, fileName });
    return {
      success: false,
      message: "Missing argument audioPath or fileName",
    };
  }

  console.log(`[${jobId}] Input received`);
  console.log(`[${jobId}] Audio path:`, audioPath);
  console.log(`[${jobId}] Target file name:`, fileName);

  // 2️⃣ Derive video path
  const videoPath = audioPath.replace(/\.mp3$/i, ".mp4");
  console.log(`[${jobId}] Derived video path:`, videoPath);

  // 3️⃣ Check file exists
  if (!fs.existsSync(videoPath)) {
    console.error(`[${jobId}] ❌ Video file not found`, videoPath);
    return {
      success: false,
      message: "Video file not found",
    };
  }

  // Log file size
  const stats = fs.statSync(videoPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`[${jobId}] Video size: ${sizeMB} MB`);

  const res = await handelAsyc(async () => {
    console.log(`[${jobId}] ⏫ Starting upload to R2...`);

    const fileBuffer = fs.readFileSync(videoPath);

    await Bucket.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: fileName,
        Body: fileBuffer,
        ContentType: "video/mp4",
      }),
    );

    console.log(`[${jobId}] ✅ Upload successful`);
    console.log(
      `[${jobId}] File URL: https://${process.env.BUCKET_NAME}.${process.env.ACCOUNT_ID}.r2.cloudflarestorage.com/${fileName}`,
    );

    // 4️⃣ Cleanup local files
    console.log(`[${jobId}] 🧹 Starting cleanup...`);

    try {
      const videoDeleteResponse = await deleteFile(videoPath);
      console.log(
        `[${jobId}] Video delete:`,
        videoDeleteResponse.success ? "Deleted" : "Failed",
      );
    } catch (err) {
      console.warn(`[${jobId}] Video delete error:`, err);
    }

    try {
      const audioDeleteResponse = await deleteFile(audioPath);
      console.log(
        `[${jobId}] Audio delete:`,
        audioDeleteResponse.success ? "Deleted" : "Failed",
      );
    } catch (err) {
      console.warn(`[${jobId}] Audio delete error:`, err);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${jobId}] 🎉 Job completed in ${duration}s`);
    console.log(`========== [${jobId}] Upload Job Finished ==========\n`);

    return { message: "Reel uploaded successfully" };
  }, `[${jobId}] Error uploading reel to bucket`);

  if (!res.success) {
    console.error(`[${jobId}] ❌ Upload failed:`, res.message);
    return {
      success: false,
      message: res.message,
    };
  }

  return { success: true, message: res.data?.message };
};
