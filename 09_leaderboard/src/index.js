import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redisClient = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
);

app.post("/:id/view", async (req, res) => {
  try {
    const { id } = req.params;

    const key = `post:${id}:views`;

    const views = await redisClient.incr(key);

    return res.status(200).json({
      success: true,
      postId: id,
      views,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to increment post views",
    });
  }
});

// leaderboard assignment

const LEADERBOARD_KEY = "leaderboard";

app.post("/leaderboard/score", async (req, res) => {
  try {
    const { userId, points } = req.body;

    if (!userId || points === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId and points are required",
      });
    }

    const score = await redisClient.zincrby(LEADERBOARD_KEY, points, userId);

    return res.status(200).json({
      success: true,
      userId,
      score,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update leaderboard score",
    });
  }
});

app.get("/", async (req, res) => {
  try {
    const leaders = await redisClient.zrevrange(
      LEADERBOARD_KEY,
      0,
      9,
      "WITHSCORES",
    );

    const result = [];

    for (let i = 0; i < leaders.length; i += 2) {
      result.push({
        rank: i / 2 + 1,
        userId: leaders[i],
        score: Number(leaders[i + 1]),
      });
    }

    return res.status(200).json({
      success: true,
      leaderboard: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to get leaderboard",
    });
  }
});

app.get("/:userid/rank", async (req, res) => {
  try {
    const { userid } = req.params;

    const rank = await redisClient.zrevrank(LEADERBOARD_KEY, userid);

    if (rank === null) {
      return res.status(404).json({
        success: false,
        message: "User is not present in leaderboard",
      });
    }

    const score = await redisClient.zscore(LEADERBOARD_KEY, userid);

    return res.status(200).json({
      success: true,
      userId: userid,
      rank: rank + 1,
      score,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to get user rank",
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
