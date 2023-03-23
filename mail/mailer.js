const nodemailer = require("nodemailer");

module.exports = function main(info) {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  transporter
    .sendMail(info)
    .then(() => {
      console.log("메일을 성공적으로 전송하였습니다.");
    })
    .catch((e) => {
      console.log("메일 전송에러 : ", e);
    });

  nodemailer.getTestMessageUrl(info);
};
