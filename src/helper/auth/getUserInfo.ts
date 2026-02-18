import { prisma } from "../../libs/prisma";
import { handelAsyc } from "../validation/handelAsync";

export const getUserInfo = async (userId?: string, email?: string) => {
  if (!userId && !email) {
    return { success: false, message: "Inputs are missing." };
  }

  const res = await handelAsyc(
    async () => {
      let user = await prisma.user.findFirst({
        where: {
          id: userId ?? email,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    },
    `Fetching user info failed for ${userId ? `UserId ${userId}` : `email ${email}`}`,
  );

  if (!res.success) {
    return { success: false, message: res.message };
  }

  return { success: true, user: res.data };
};
