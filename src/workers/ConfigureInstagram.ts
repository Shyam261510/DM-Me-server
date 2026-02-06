import { getUserInfo } from "../helper/auth/getUserInfo";
import { prisma } from "../libs/prisma";

export const configureInstagram = async (userId: string, igUserId: string) => {
  try {
    // 1️⃣ Basic validation
    if (!userId || !igUserId) {
      return {
        success: false,
        message: !userId
          ? "User Id is required"
          : "Instagram User Id is required",
      };
    }

    // 2️⃣ Verify user exists
    const userResponse = await getUserInfo(userId);

    if (!userResponse.success) {
      return {
        success: false,
        message: userResponse.message,
        statusCode: 404,
      };
    }

    // 3️⃣ Check if Instagram account already configured
    const existingIgAccount = await prisma.iGUserInfo.findUnique({
      where: { userId },
    });

    if (existingIgAccount) {
      return {
        success: true,
        igAccount: existingIgAccount,
      };
    }

    // 4️⃣ Create Instagram account mapping
    const newIgAccount = await prisma.iGUserInfo.create({
      data: {
        userId,
        ig_user_id: igUserId,
      },
    });

    return {
      success: true,
      igAccount: newIgAccount,
    };
  } catch (error: any) {
    console.error("Configure Instagram error:", error);

    // Prisma unique constraint (if any)
    if (error.code === "P2002") {
      return {
        success: false,
        message: "Instagram account already linked",
      };
    }

    return {
      success: false,
      message: "Failed to configure Instagram account",
    };
  }
};
