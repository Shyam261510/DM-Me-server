import { success } from "zod";
import { User } from "../../generated/prisma/client";
import { prisma } from "../../libs/prisma";
import { getUserInfo } from "../auth/getUserInfo";
import { handelAsyc } from "../validation/handelAsync";

export const validateMember = async (userId: string, groupId: string) => {
  if (!userId || !groupId) {
    return {
      success: false,
      message: "Invalid Inputs",
    };
  }

  const response = await handelAsyc(async () => {
    const userResponse = await getUserInfo(userId);

    if (!userResponse.success) {
      throw new Error(userResponse.message);
    }

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
      },
      include: {
        groupMembers: true,
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const isMemberExits = group?.groupMembers.some(
      (member) => member.userId === userId,
    );

    if (isMemberExits) {
      throw new Error(
        `Member ${(userResponse.user as User).username} is already exits in the group`,
      );
    }

    return { message: "User is not in the team" };
  }, `Error validating team member`);

  if (!response.success) {
    return { success: false, message: response.message };
  }
  return { success: true, message: response.data?.message };
};
