import { json } from "zod";
import { prisma } from "../../libs/prisma";

export const getUserInfo = async (userId?: string, email?: string) => {
  try {
    if (!userId && !email) {
      return { success: false, message: "Inputs are missing." };
    }
    let user = userId
      ? await prisma.user.findFirst({
          where: {
            id: userId,
          },
          include: {
            reels: {
              include: {
                reel: true,
              },
            },
            team: {
              include: {
                teamMembers: {
                  include: {
                    user: {
                      include: {
                        reels: {
                          include: {
                            reel: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : await prisma.user.findFirst({
          where: {
            email,
          },
          include: {
            reels: {
              include: {
                reel: true,
              },
            },
            team: {
              include: {
                teamMembers: {
                  include: {
                    user: {
                      include: {
                        reels: {
                          include: {
                            reel: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    return { success: true, user };
  } catch (error: any) {
    console.error("Error fetching user info:", error);

    return { success: false, message: "Internal server error" };
  }
};
