import { handelAsyc } from "../validation/handelAsync";
import { prisma } from "../../libs/prisma";

interface GetGroupInfoTypes {
  condition: Object;
  include: Object;
}

export const GetGroupInfo = async ({
  condition,
  include = {},
}: GetGroupInfoTypes) => {
  const response = await handelAsyc(async () => {
    const groupResponse = await prisma.group.findFirst({
      where: condition,
      include,
    });
    return groupResponse;
  }, "Error In Getting Group Info");
  return response;
};
