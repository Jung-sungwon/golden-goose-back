const axios = require("axios");
const _ = require("lodash");
const { google } = require("googleapis");
const mongoose = require("mongoose");
const goldPrice = require("./models/goldModel");
const {
  client_email,
  private_key,
} = require("./goldproject-378412-847398aba5e7.json");

const cheerio = require("cheerio");
require("dotenv").config();

//-- DB연결
main()
  .then(() => {
    console.log("mongoDB 연결성공");
  })
  .catch((err) => console.log("데이터베이스 연결에 실패하였습니다.", err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}
//----

const getGold = async () => {
  try {
    return await axios.get(
      "https://finance.naver.com/marketindex/goldDetail.nhn"
    );
  } catch (err) {
    console.log(err);
  }
};

//날짜
let mon = new Date().getMonth() + 1;
let day = new Date().getDate();
let year = new Date().getFullYear();

let time = year + "-" + mon + "-" + day;

async function connectSpread() {
  let goldData = 0;
  const html = await getGold();
  const $ = cheerio.load(html.data);
  const dataList = $(
    "#content > div.section_calculator > table > tbody > tr > td:nth-child(1) > em"
  ).text();
  goldData = dataList;

  // 스프레드시트와 연동하기
  const authorize = new google.auth.JWT(client_email, null, private_key, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);

  // google spread sheet api 가져오기
  const googleSheet = google.sheets({
    version: "v4",
    auth: authorize,
  });

  //스프레드 시트에 날짜와 금시세 데이터 추가
  const response = await googleSheet.spreadsheets.values.append({
    spreadsheetId: process.env.SPREAD_ID,
    range: "A:Z",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS", // OVERWRITE or INSERT_ROWS 선택
    resource: { values: [[time, goldData]] },
  });

  // 실제 스프레드시트 내용 가져오기
  const context = await googleSheet.spreadsheets.values.get({
    spreadsheetId: process.env.SPREAD_ID,
    range: "A2:Z",
  });
  let sheetData = context.data.values;

  //스프레드 시트의 데이터를 오브젝트로 변환
  let obj = [];
  sheetData.forEach((item, idx) => {
    //parseInt는 쉼표를 기준으로 뒷 숫자를 표현하지 않기 때문에 쉼표를 없앴음
    obj.push({ date: item[0], price: parseInt(item[1].replace(/,/g, "")) });
  });

  //금시세를 기준으로 오름차순으로 배열을 만든 후에 중복값 제거를 하면됨.
  //일단 가격을 기준으로 중복을 제거했으니까, 날짜를 기준으로 다시 정렬하면 됨.-선 그래프를 만들기 위한 밑작업.
  const reverse = _.sortBy(obj, "price").reverse();
  const duplicationDataRemove = _.unionBy(reverse, "date");

  // dateSort는 이제 각 날짜별로 가장 높은 값을 날짜별로 정렬한 데이터가 담겨있음. 이걸 바탕으로 선차트를 생성하면 됨.
  const dateSort = duplicationDataRemove.sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  //데이터를 DB에 저장 한 후 연결 끊기
  async function DBcancel() {
    //아래 코드로 기존에 저장되어있던 데이터들을 제거함.
    await goldPrice.deleteMany({});

    for (const item of dateSort) {
      const priceData = new goldPrice(item);
      await priceData
        .save()
        .then(() => {
          console.log("데이터 저장 완료!");
        })
        .catch((e) => {
          console.log("데이터 저장 오류 : ", e);
        });
    }

    goldPrice.find({}, () => {
      console.log("DB연결이 종료되었습니다.");
      mongoose.disconnect();
    });
  }
  DBcancel();
}
connectSpread();
