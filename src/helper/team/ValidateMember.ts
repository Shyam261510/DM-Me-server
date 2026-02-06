import { prisma } from "../../libs/prisma";

export const validateMember = async (userId: string) => {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId,
      },
      include: {
        user: true,
      },
    });

    if (teamMember) {
      return {
        success: false,
        message: `${teamMember.role === "ADMIN" ? "You" : teamMember.user.username} are already in a team`,
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
