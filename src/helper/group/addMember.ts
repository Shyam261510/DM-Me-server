import { Role } from "../../generated/prisma/enums";
import { prisma } from "../../libs/prisma";
import { handelAsyc } from "../validation/handelAsync";
import { validateSchema } from "../validation/ValidateSchema";
import { validateMember } from "./validateMember";
import z from "zod";

/**
 * Input type for adding a member to a team
 */
interface AddMemberTypes {
  userId: string;
  groupId: string;
  role: string;
  isAlreadyValidated: boolean; // Whether member validation is already done
}

/**
 * Zod schema for runtime validation
 */
const AddMemberSchema = z.object({
  userId: z.string().min(1, { message: "userId is required" }),
  groupId: z.string().min(1, { message: "groupId is required" }),
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
  groupId,
  role,
  isAlreadyValidated,
}: AddMemberTypes) => {
  // 1️⃣ Validate request body using Zod
  const body = { userId, groupId, role, isAlreadyValidated };
  const validateBody = validateSchema(AddMemberSchema, body);

  if (!validateBody.success) {
    return { success: false, message: validateBody.message };
  }

  const response = await handelAsyc(async () => {
    // 2️⃣ If validation is already done, directly add member
    if (isAlreadyValidated) {
      await prisma.groupMember.create({
        data: {
          userId,
          groupId,
          role: Role.ADMIN,
        },
      });

      return { message: "Member added successfully" };
    }

    // 3️⃣ Validate whether user already belongs to a team
    const validateResponse = await validateMember(userId, groupId);
    if (!validateResponse.success) {
      throw new Error(validateResponse.message);
    }

    // 4️⃣ Create team member entry
    await prisma.groupMember.create({
      data: {
        userId,
        groupId,
        role: role === "ADMIN" ? Role.ADMIN : Role.MEMBER,
      },
    });

    return {
      message: "Member added successfully",
    };
  }, `Error in add Member in the Group for userId ${userId}`);

  if (!response.success) {
    return { success: false, message: response.message };
  }

  return {
    success: true,
    message: response.data?.message,
  };
};
