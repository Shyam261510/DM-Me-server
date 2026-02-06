export const connection = {
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD!,
  url: process.env.REDIS_URL!,
};

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

export const queueNames = {
  convertUrlToVideo: "convert-url-to-video",
  convertVideoToAudio: "convert-video-to-audio",
  generateTranscribe: "generate-transcribe",
  generateNiche: "generate-niche",
  addInstagramReelToDB: "add-instagram-reel-to-db",
  generateEmbedding: "generate-embedding",
  addInstagramReciverId: "add-instagram-reciver-id",
  sendDM: "send-dm",
};
