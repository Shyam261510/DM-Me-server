import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Bucket } from "../libs/Bucket";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { handelAsyc } from "./validation/handelAsync";

export const getReelUrl = async (fileName: string) => {
  const res = await handelAsyc(async () => {
    const url = await getSignedUrl(
      Bucket,
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileName,
      }),
      { expiresIn: 3600 }, // URL valid for 1 hour
    );
    return url;
  }, "Issue in getting reel url");
  return res;
};
