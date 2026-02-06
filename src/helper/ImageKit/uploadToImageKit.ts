import { ImageKit } from "@imagekit/nodejs/client.js";

export const uploadToImageKit = async (url: string, fileName: string) => {
  try {
    if (!url || !fileName) {
      return {
        success: false,
        message: "Missing argument url or fileName",
      };
    }

    const imagekit = new ImageKit({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    });

    const res = await imagekit.files.upload({
      file: url,
      fileName: fileName.slice(0, 500),
      folder: "/DM_Me",
    });

    return {
      success: true,
      url: res.url,
      fileId: res.fileId,
      thumnailImage: res.thumbnailUrl,
    };
  } catch (error: any) {
    console.error("ImageKit upload failed:", error);

    return {
      success: false,
      message: "Failed to upload image to ImageKit",
    };
  }
};
