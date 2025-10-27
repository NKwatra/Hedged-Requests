import express from "express";
import { fetchWithHedging, fetchStandard, fetchTied } from "./utils";
const app = express();

const port = parseInt(process.env.PORT || "3000");
const serviceA = process.env.SERVICE_A || "http://localhost:8081";
const serviceA2 = process.env.SERVICE_A2 || "http://localhost:8082";
const serviceB = process.env.SERVICE_B || "http://localhost:8083";
const serviceB2 = process.env.SERVICE_B2 || "http://localhost:8084";
const serviceC = process.env.SERVICE_C || "http://localhost:8085";
const serviceC2 = process.env.SERVICE_C2 || "http://localhost:8086";

app.get("/", async (req, res) => {
  const mode = process.env.MODE || "standard";
  let requests: Array<Promise<string>> = [];
  switch (mode) {
    case "hedged":
      requests = [
        fetchWithHedging({
          primaryUrl: serviceA,
          secondaryUrl: serviceA2,
          hedgeThreshold: 94,
        }),
        fetchWithHedging({
          primaryUrl: serviceB,
          secondaryUrl: serviceB2,
          hedgeThreshold: 94,
        }),
        fetchWithHedging({
          primaryUrl: serviceC,
          secondaryUrl: serviceC2,
          hedgeThreshold: 94,
        }),
      ];
      break;
    case "tied":
      requests = [
        fetchTied({
          primaryUrl: serviceA,
          secondaryUrl: serviceA2,
        }),
        fetchTied({
          primaryUrl: serviceB,
          secondaryUrl: serviceB2,
        }),
        fetchTied({
          primaryUrl: serviceC,
          secondaryUrl: serviceC2,
        }),
      ];
      break;
    default:
      requests = [
        fetchStandard(serviceA),
        fetchStandard(serviceB),
        fetchStandard(serviceC),
      ];
      break;
  }

  const r = await Promise.all(requests);
  res.json({
    A: r[0] || "No Response from A",
    B: r[1] || "No Response from B",
    C: r[2] || "No Response from C",
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
