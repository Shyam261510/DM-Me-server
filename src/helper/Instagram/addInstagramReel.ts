import { prisma } from "../../libs/prisma";
import { uploadToImageKit } from "../ImageKit/uploadToImageKit";
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
}: AddInstagramReelTypes) => {
  try {
    // 1️⃣ Validate user
    const user = await prisma.user.findUnique({
      where: { reciverId: igUserId },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found in IG_user_info table",
      };
    }

    // 2️⃣ Check existing reel
    const existingReel = await prisma.reel.findUnique({
      where: { ig_reel_id: igReelId },
    });

    if (existingReel) {
      await prisma.userReel.create({
        data: {
          userId: user.id,
          reelId: existingReel.id,
        },
      });

      return { success: true, message: "Reel added successfully" };
    }

    // 3️⃣ Media processing pipeline

    // 5️⃣ Upload
    const upload = unwrapOrThrow(
      await uploadToImageKit(reelURL, title),
      "Image upload failed",
    );

    // 6️⃣ Persist reel
    const newReel = await prisma.reel.create({
      data: {
        ig_reel_id: igReelId,
        url: upload.url!,
        fileId: upload.fileId!,
        title,
        thumbnail: upload.thumnailImage ?? "",
        audioTranscribe: transcribe ?? "",
        niche: niche ?? "",
        subNiche: subNiche ?? "",
        titleEmbeddings: titleEmbedding ?? [],
        audioTranscribeEmbeddings: transcriptEmbedding ?? [],
        nicheEmbeddings: nicheEmbedding ?? [],
        subNicheEmbeddings: subNicheEmbedding ?? [],
      },
    });

    // 7️⃣ Link user ↔ reel
    await prisma.userReel.create({
      data: {
        userId: user.id,
        reelId: newReel.id,
      },
    });

    console.log("Reel Uploaded Successfully");
    return { success: true, message: "Reel added successfully" };
  } catch (error: any) {
    if (error?.code === "P2002") {
      const target = error?.meta?.target?.join(", ");

      if (target?.includes("userId") && target?.includes("reelId")) {
        return { success: false, message: "Reel already saved by this user" };
      }

      if (target?.includes("ig_reel_id")) {
        return { success: false, message: "Reel already exists" };
      }
    }

    console.error("Error adding Instagram reel:", error);
    return {
      success: false,
      message: error.message ?? "Something went wrong while adding the reel",
    };
  }
};
