import { Queue } from "bullmq";
import { connection, defaultJobOptions, queueNames } from "./config";
import { AddInstagramReelTypes } from "../helper/Instagram/addInstagramReel";

export interface ConvertURLToVideoJob extends AddInstagramReelTypes {
  fileName: string;
}
export interface CompreesVideoJob extends AddInstagramReelTypes {
  videoPath: string;
}
export interface ConvertVideoToAudioJob extends AddInstagramReelTypes {
  videoPath: string;
}
export interface GenerateTranscribeJob extends AddInstagramReelTypes {
  audioPath: string;
}
export interface GenerateNicheJob extends AddInstagramReelTypes {
  transcript: string;
  audioPath: string;
}
export interface GenerateEmbeddingJob extends AddInstagramReelTypes {
  transcribe: string;
  niche: string;
  subNiche: string;
  audioPath: string;
}

export interface AddInstagramReciverIdJob {
  userId: string;
  reciverId: string;
}

export interface SendDMJob {
  reciverId: string;
  message: string;
}
export interface AddInstagramReelJob extends AddInstagramReelTypes {
  audioPath: string;
}

export const queues = {
  convertURLToVideoQueue: new Queue<ConvertURLToVideoJob>(
    queueNames.convertUrlToVideo,
    {
      connection,
      defaultJobOptions,
    },
  ),
  compressVideoQueue: new Queue<CompreesVideoJob>(queueNames.compressVideo, {
    connection,
    defaultJobOptions,
  }),
  convertVideoToAudioQueue: new Queue<ConvertVideoToAudioJob>(
    queueNames.convertVideoToAudio,
    {
      connection,
      defaultJobOptions,
    },
  ),
  generateTranscribeQueue: new Queue<GenerateTranscribeJob>(
    queueNames.generateTranscribe,
    {
      connection,
      defaultJobOptions,
    },
  ),
  generateNicheQueue: new Queue<GenerateNicheJob>(queueNames.generateNiche, {
    connection,
    defaultJobOptions,
  }),

  addInstagramReelToDBQueue: new Queue<AddInstagramReelJob>(
    queueNames.addInstagramReelToDB,
    {
      connection,
      defaultJobOptions,
    },
  ),
  generateEmbeddingQueue: new Queue<GenerateEmbeddingJob>(
    queueNames.generateEmbedding,
    {
      connection,
      defaultJobOptions,
    },
  ),
  addInstaReciverIdQueue: new Queue<AddInstagramReciverIdJob>(
    queueNames.addInstagramReciverId,
    {
      connection,
      defaultJobOptions,
    },
  ),
  sendDMQueue: new Queue<SendDMJob>(queueNames.sendDM, {
    connection,
    defaultJobOptions,
  }),
} as const;

export type QueueName = typeof queues;
