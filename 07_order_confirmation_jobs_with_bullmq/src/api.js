import express from "express";
import Redis from "ioredis";
import { emailQueue } from "./queue.js";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.post("/welcome-email", (req, res) => {
  const job = emailQueue.add(
    "send-welcome-email",
    {
      to: req.body.to,
      name: req.body.name || "Learner",
    },
    {
      attempts: 3,
      backoff: {
        type: exponential,
        delay: 1000,
      },
    },
  );
  res.json({ message: "Welcome email job added to the queue!", jobId: job.id });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
