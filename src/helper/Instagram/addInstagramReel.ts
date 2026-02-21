import { prisma } from "../../libs/prisma";
import { uploadToBucket } from "../cloudflare/uploadToBucket";
import { unwrapOrThrow } from "../unwrapOrThrow";

export interface AddInstagramReelTypes {
  igReelId: string;
  igUserId: string;
  reelURL: string;
  title: string;
  niche?: string;
  subNiche?: string;
  transcribe?: string;
  titleEmbedding?: number[];
  transcriptEmbedding?: number[];
  nicheEmbedding?: number[];
  subNicheEmbedding?: number[];
  audioPath?: string;
}

export const addInstagramReel = async ({
  igReelId,
  igUserId,
  reelURL,
  title,
  niche,
  subNiche,
  transcribe,
  titleEmbedding,
  transcriptEmbedding,
  nicheEmbedding,
  subNicheEmbedding,
  audioPath,
}: AddInstagramReelTypes) => {
  try {
    // 1️⃣ Validate user
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { reciverId: igUserId },
      });
    } catch (err) {
      console.error("User fetch error:", err);
      return { success: false, message: "Database error while fetching user" };
    }

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // 2️⃣ Upload media
    let upload;
    // use audio path to convert the get the video path because the video and audio file name is same
    // but differ in extension .mp4 and .mp3
    try {
      upload = unwrapOrThrow(
        await uploadToBucket(audioPath!, title.slice(0, 20)),
        "Upload failed",
      );
    } catch (err) {
      console.error("ImageKit upload error:", err);
      return {
        success: false,
        message: "Failed to upload reel media",
      };
    }

    // 3️⃣ DB Transaction (atomic)
    try {
      await prisma.$transaction(async (tx) => {
        const newReel = await tx.reel.create({
          data: {
            ig_reel_id: igReelId,
            title,
            fileName: title.slice(0, 20),
            audioTranscribe: transcribe ?? "",
            niche: niche ?? "",
            subNiche: subNiche ?? "",
            titleEmbeddings: titleEmbedding ?? [],
            audioTranscribeEmbeddings: transcriptEmbedding ?? [],
            nicheEmbeddings: nicheEmbedding ?? [],
            subNicheEmbeddings: subNicheEmbedding ?? [],
          },
        });

        await tx.userReel.create({
          data: {
            userId: user.id,
            reelId: newReel.id,
          },
        });
      });
    } catch (error: any) {
      // Prisma unique errors
      if (error?.code === "P2002") {
        const target = error?.meta?.target?.join(", ");

        if (target?.includes("userId") && target?.includes("reelId")) {
          return {
            success: false,
            message: "Reel already saved by this user",
          };
        }

        if (target?.includes("ig_reel_id")) {
          return {
            success: false,
            message: "Reel already exists",
          };
        }
      }

      console.error("DB transaction error:", error);
      return {
        success: false,
        message: "Database error while saving reel",
      };
    }

    console.log("Reel Uploaded Successfully");
    return { success: true, message: "Reel added successfully" };
  } catch (error: any) {
    // Final fallback (unexpected errors)
    console.error("Unexpected error:", error);
    return {
      success: false,
      message: error.message || "Something went wrong",
    };
  }
};
