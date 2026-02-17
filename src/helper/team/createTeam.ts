import { prisma } from "../../libs/prisma";
import { addMember } from "./addMember";
import { validateMember } from "./ValidateMember";

interface CreateTeamResponse {
  success: boolean;
  message: string;
  teamId?: string;
}

export const createTeam = async (
  userId: string,
): Promise<CreateTeamResponse> => {
  try {
    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    // 1️⃣ Check if user already belongs to a team

    const validateResponse = await validateMember(userId);
    if (!validateResponse.success) {
      return { success: false, message: validateResponse.message };
    }

    // 2️⃣ Create a new team
    const newTeam = await prisma.team.create({
      data: {},
    });

    return {
      success: true,
      message: "Team created successfully",
      teamId: newTeam.id,
    };
  } catch (error: any) {
    // Handle Prisma unique constraint errors if any
    if (error?.code === "P2002") {
      return {
        success: false,
        message: "You are already in a team",
      };
    }

    console.error("Error creating team:", error);
    return {
      success: false,
      message: "Something went wrong while creating the team",
    };
  }
};
