import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const convertURlToVideo = async (url: string, fileName: string) => {
  try {
    if (!url || !fileName) {
      return {
        success: false,
        message: "URL and fileName are required",
      };
    }

    const folderPath = path.join(process.cwd(), "downloads", "reels");
    const filePath = path.join(folderPath, fileName);

    // Ensure folder exists
    await mkdir(folderPath, { recursive: true });

    const response = await fetch(url);
    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch reel URL (status: ${response.status})`,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(filePath, buffer);

    console.log("✅ Reel saved at:", filePath);

    return {
      success: true,
      message: "Reel saved successfully",
      filePath,
    };
  } catch (error: any) {
    console.error("❌ Error downloading reel:", error);

    return {
      success: false,
      message: "Failed to download reel",
    };
  }
};
