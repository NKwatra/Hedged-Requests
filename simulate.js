const http = require("k6/http");
const { sleep } = require("k6");

exports.options = {
  stages: [
    { duration: "8s", target: 100 },
    { duration: "8s", target: 100 },
    { duration: "4s", target: 0 },
  ],
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

exports.default = function () {
  http.get("http://localhost:3000");
  sleep(0.1);
};
