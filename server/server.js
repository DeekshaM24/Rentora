const path = require("node:path");
const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 3000;
const projectRoot = path.resolve(__dirname, "..");

app.disable("x-powered-by");
app.use(express.static(projectRoot));

app.listen(port, () => {
  console.log(`Rentora is running at http://localhost:${port}`);
});