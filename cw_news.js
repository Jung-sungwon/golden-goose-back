const _ = require("lodash");
const { google } = require("googleapis");
const mongoose = require("mongoose");
const {
  client_email,
  private_key,
} = require("./goldproject-378412-847398aba5e7.json");
const puppeteer = require("puppeteer");
require("dotenv").config();
const newsModel = require("./models/newsModel");

//DB연결
main()
  .then(() => {
    console.log("mongoDB 연결성공");
  })
  .catch((err) => console.log("데이터베이스 연결에 실패하였습니다.", err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

const objData = [];
let dum;

(async () => {
  //인포맥스 크롤링
  await (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // 작업 수행
    await page.goto(
      "https://news.einfomax.co.kr/news/articleList.html?sc_area=A&view_type=sm&sc_word=%EA%B8%88+%EA%B0%80%EA%B2%A9"
    );
    const article = await page.$$(
      "#user-container > div.float-center.max-width-1080 > div.user-content.list-wrap > section > article > div.article-list > section > div > div.list-titles > a  "
    );

    let evalData = await Promise.all(
      article.map((e) => {
        return page.evaluate((i) => i.textContent, e);
      })
    );

    let evalLink = await Promise.all(
      article.map((e) => {
        return page.evaluate((i) => i.href, e);
      })
    );

    const titleData = evalData.filter((item, index) => index < 2);
    const linkData = evalLink.filter((item, index) => index < 2);

    titleData.forEach((item, i) => {
      objData.push({ name: titleData[i], link: linkData[i] });
    });
    console.log(
      "evalLink : ",
      evalLink.filter((item, index) => index < 2)
    );

    await page.goto(
      "https://www.yonhapnewstv.co.kr/yn/v1/search;jsessionid=7150831E5BFC1DA6B8AA4792EFE40844?q=%EA%B8%88%EB%A6%AC&v1=2021"
    );

    const unionArticle = await page.$$(
      "#content > div.inner > div.cont-row > div.cont-item01 > div > div:nth-child(1) > ul > li > div > div > a "
    );

    let unionArticleName = await Promise.all(
      unionArticle.map((e) => {
        return page.evaluate((i) => i.textContent, e);
      })
    );

    let unionArticleLink = await Promise.all(
      unionArticle.map((e) => {
        return page.evaluate((i) => i.href, e);
      })
    );

    let unionArticleNameFilter = unionArticleName.filter(
      (item, index) => index < 2
    );
    let unionArticleLinkFilter = unionArticleLink.filter(
      (item, index) => index < 2
    );

    unionArticleName.forEach((item, i) => {
      objData.push({
        name: unionArticleNameFilter[i],
        link: unionArticleLinkFilter[i],
      });
    });

    await browser.close();
  })();

  //스프레드시트 연동

  await (async function connectSpread() {
    // 스프레드시트와 연동하기
    const authorize = new google.auth.JWT(client_email, null, private_key, [
      "https://www.googleapis.com/auth/spreadsheets",
    ]);

    // google spread sheet api 가져오기
    const googleSheet = google.sheets({
      version: "v4",
      auth: authorize,
    });

    //스프레드 시트에 날짜와 금시세 뉴스 추가
    objData.forEach(async (i) => {
      const response = await googleSheet.spreadsheets.values.append({
        spreadsheetId: process.env.SPREAD_ID_NEWS,
        range: "A:Z",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS", // OVERWRITE or INSERT_ROWS 선택
        resource: {
          values: [[i.name, i.link]],
        },
      });
    });

    // 실제 스프레드시트 내용 가져오기
    const context = await googleSheet.spreadsheets.values.get({
      spreadsheetId: process.env.SPREAD_ID_NEWS,
      range: "A2:Z",
    });
    let sheetData = context.data.values;

    const sheetObj = [];

    sheetData.forEach((i) => {
      sheetObj.push({ name: i[0], link: i[1] });
    });

    const duplicationDataRemove = _.unionBy(sheetObj, "name");

    const duplicationDataRemoveReverse = duplicationDataRemove.reverse();

    //데이터를 DB에 저장 한 후 연결 끊기
    async function DBcancel() {
      //아래 코드로 기존에 저장되어있던 데이터들을 제거함.
      await newsModel.deleteMany({});

      for (const item of duplicationDataRemoveReverse) {
        const newsData = new newsModel(item);
        await newsData
          .save()
          .then(() => {
            console.log("데이터 저장 완료!");
          })
          .catch((e) => {
            console.log("데이터 저장 오류 : ", e);
          });
      }

      newsModel.find({}, () => {
        console.log("DB연결이 종료되었습니다.");
        mongoose.disconnect();
      });
    }
    DBcancel();
  })();
})();
