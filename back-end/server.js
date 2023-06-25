const express = require("express");

const path = require("path");
const dotenv = require("dotenv");
const router = require(path.join(__dirname, "./router"));

const PORT = process.env.PORT;

dotenv.config({ path: "./config.env" });

const app = express();



app.use("/", router);

app.listen(PORT, () => {
  console.log(`server started at ${PORT}`);
});
