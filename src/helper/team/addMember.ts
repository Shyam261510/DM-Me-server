import { Role } from "../../generated/prisma/enums";
import { prisma } from "../../libs/prisma";
import { validateSchema } from "../validation/ValidateSchema";
import { validateMember } from "./ValidateMember";
import z from "zod";

/**
 * Input type for adding a member to a team
 */
interface AddMemberTypes {
  userId: string;
  teamId: string;
  role: string;
  isAlreadyValidated: boolean; // Whether member validation is already done
}

/**
 * Zod schema for runtime validation
 */
const AddMemberSchema = z.object({
  userId: z.string().min(1, { message: "userId is required" }),
  teamId: z.string().min(1, { message: "teamId is required" }),
  role: z.enum(["ADMIN", "MEMBER"], {
    message: "role is required",
  }),
  isAlreadyValidated: z.boolean({
    message: "isAlreadyValidated is required",
  }),
});

/**
 * Adds a user as a member to a team
 */
export const addMember = async ({
  userId,
  teamId,
  role,
  isAlreadyValidated,
}: AddMemberTypes) => {
  try {
    // 1️⃣ Validate request body using Zod
    const body = { userId, teamId, role, isAlreadyValidated };
    const validateBody = validateSchema(AddMemberSchema, body);

    if (!validateBody.success) {
      return { success: false, message: validateBody.message };
    }

    // 2️⃣ If validation is already done, directly add member
    if (!isAlreadyValidated) {
      await prisma.teamMember.create({
        data: {
          userId,
          teamId,
          role: role === "ADMIN" ? Role.ADMIN : Role.MEMBER,
        },
      });

      return { success: true, message: "Member added successfully" };
    }

    // 3️⃣ Validate whether user already belongs to a team
    const validateResponse = await validateMember(userId);
    if (!validateResponse.success) {
      return validateResponse;
    }

    // 4️⃣ Create team member entry
    await prisma.teamMember.create({
      data: {
        userId,
        teamId,
        role: role === "ADMIN" ? Role.ADMIN : Role.MEMBER,
      },
    });

    return { success: true, message: "Member added successfully" };
  } catch (error: any) {
    // 5️⃣ Handle duplicate membership
    if (error?.code === "P2002") {
      return {
        success: false,
        message: "User is already a member of this team",
      };
    }

    // 6️⃣ Handle invalid foreign keys
    if (error?.code === "P2003") {
      return {
        success: false,
        message: "Invalid user ID or team ID",
      };
    }

    // 7️⃣ Fallback error handler
    console.error("Error adding team member:", error);
    return {
      success: false,
      message: "Something went wrong while adding the member",
    };
  }
};
