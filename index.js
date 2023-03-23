const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const api = require("./routes/api");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.urlencoded());
app.use(express.json());
app.use(cors({ origin: process.env.FRONT_URL, credentials: true }));
app.use(cookieParser());

const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api", api);

app.listen(port, () => {
  console.log(`${port}번 포트에서 서버 실행중...`);
});

main()
  .then(() => {
    console.log("mongoDB 연결성공");
  })
  .catch((err) => console.log("데이터베이스 연결에 실패하였습니다.", err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}
