import { verifyWebhookRouter } from "./webhooks/verify_webhook";
import { WebHookEventRouter } from "./webhooks/WebhookEvent";
import { UserInfoAuthRouter } from "./auth/userInfo.auth.route";
import { SignInRouter } from "./auth/signin.auth.route";
import { AddInstagramReelRouter } from "./Instagram/addInstagramReelRouter";

import { CreateGroupRouter } from "./group/createGroupRouter";
import { GetGroupRouter } from "./group/getGroupInfoRouter";
import { GetReelRouter } from "./reels/GetReelRouter";
import { GetGroupReelsRouter } from "./group/getGroupReels";
import { SendInvitionRouter } from "./email/sendInvitationRouter";
import { GroupRouter } from "./group/groupRouter";
import { JoinGroupRouter } from "./group/JoinGroupRouter";
export {
  verifyWebhookRouter,
  WebHookEventRouter,
  UserInfoAuthRouter,
  SignInRouter,
  AddInstagramReelRouter,
  CreateGroupRouter,
  GetReelRouter,
  GetGroupRouter,
  GetGroupReelsRouter,
  SendInvitionRouter,
  GroupRouter,
  JoinGroupRouter,
};
