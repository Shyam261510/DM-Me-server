import { createWorkers } from "./queue/workers";

console.log("🚀 Starting all BullMQ workers...");

const workers = createWorkers();

const shutdown = async () => {
  console.log("\n👋 Shutting down all workers...");
  await Promise.all(workers.map((worker) => worker.close()));
  console.log("✅ All workers closed");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log(`✅ ${workers.length} workers are ready and listening for jobs`);
