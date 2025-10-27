import express from "express";
const app = express();

const port = parseInt(process.env.PORT || "3000", 10);
if (isNaN(port) || port < 0 || port > 65535) {
  throw new Error(`Invalid port: ${process.env.PORT}`);
}

app.get("/", (req, res) => {
  req.on("close", () => {
    clearTimeout(timeout);
  });

  const baseLatency = 40 + Math.random() * 60;
  const exceptionalLatency =
    Math.random() < 0.03 ? 300 + Math.random() * 500 : 0;
  let timeout = setTimeout(() => {
    res.json({
      message: `hello from service: ${process.env.SERVICE_NAME || "A"}`,
    });
  }, baseLatency + exceptionalLatency);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Service running on port ${port}`);
});
