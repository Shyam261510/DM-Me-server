import { Worker, type WorkerOptions } from "bullmq";
import { connection } from "./config";
import { queueNames } from "./config";
import { Processors } from "./processors";

interface WorkerConfig {
  queueName: string;
  processor: (job: any) => Promise<any>;
  concurrency?: number;
}

const processors = new Processors();

const workerConfig: WorkerConfig[] = [
  {
    queueName: queueNames.convertUrlToVideo,
    processor: processors.urlToVideoProcessor,
  },
  {
    queueName: queueNames.convertVideoToAudio,
    processor: processors.videoToAudioProcessor,
  },
  {
    queueName: queueNames.generateTranscribe,
    processor: processors.generateTranscribeProcessor,
  },
  {
    queueName: queueNames.generateNiche,
    processor: processors.generateNicheProcessor,
  },
  {
    queueName: queueNames.addInstagramReelToDB,
    processor: processors.addInstagramReelToDBProcessor,
  },
  {
    queueName: queueNames.generateEmbedding,
    processor: processors.generateEmbeddingProcessor,
  },
  {
    queueName: queueNames.addInstagramReciverId,
    processor: processors.addInstaReciverIdProcessor,
  },
  {
    queueName: queueNames.sendDM,
    processor: processors.sendDMProcessor,
  },
];

export function createWorkers() {
  const workers = workerConfig.map((config) => {
    const workerOptions: WorkerOptions = {
      connection,
      concurrency: config.concurrency || 5,
    };
    const worker = new Worker(
      config.queueName,
      config.processor,
      workerOptions,
    );
    console.log("worker created...");

    // Add event Listners
    worker.on("completed", (job) => {
      console.log(`✅ [${config.queueName}] Job ${job.id} completed`);
    });

    worker.on("failed", (job, error) => {
      console.error(
        `❌ [${config.queueName}] Job ${job?.id} failed:`,
        error.message,
      );
    });
    worker.on("error", (err) => {
      console.error(`🔥 [${config.queueName}] Worker error:`, err);
    });
    worker.on("active", (job) => {
      console.log(`⚙️  [${config.queueName}] Job ${job.id} started`);
    });
    console.log(`🔧 Worker created for queue: ${config.queueName}`);

    return worker;
  });

  return workers;
}
