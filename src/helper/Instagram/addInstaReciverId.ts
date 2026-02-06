import { prisma } from "../../libs/prisma";
import { getUserInfo } from "../auth/getUserInfo";

export const addInstaReciverId = async (userId: string, reciverId: string) => {
  if (!reciverId || !userId) {
    return { success: false, message: "ReciverID and UserId is required" };
  }
  // checking user is exits or not

  const user = await getUserInfo(userId);

  if (!user.success) {
    return { success: false, message: "User not found" };
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      reciverId,
    },
  });

  return { success: true, message: "ReciverId added successfully" };
};
