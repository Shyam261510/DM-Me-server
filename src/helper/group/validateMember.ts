import { prisma } from "../../libs/prisma";
import { getUserInfo } from "../auth/getUserInfo";

export const validateMember = async (userId: string) => {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    const userResponse = await getUserInfo(userId);
    if (!userResponse.success) {
      return { success: false, message: userResponse.message };
    }

    const groupMember = await prisma.groupMember.findFirst({
      where: {
        userId,
      },
      include: {
        user: true,
      },
    });

    if (groupMember) {
      return {
        success: false,
        message: `${groupMember.role === "ADMIN" ? "You" : groupMember.user.username} are already in a team`,
      };
    }

    return { success: true, message: "User is not in a team" };
  } catch (error: any) {
    console.error("Error validating team member:", error);
    return {
      success: false,
      message: "Something went wrong while validating the member",
    };
  }
};
