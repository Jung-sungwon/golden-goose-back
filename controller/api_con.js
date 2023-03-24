const goldModel = require("../models/goldModel");
const newsModel = require("../models/newsModel");
const signupModel = require("../models/signupModel");
const postModel = require("../models/postModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const commentModel = require("../models/commentModel");
const cookieParser = require("cookie-parser");

const mailer = require("../mail/mailer");

let privateKey = process.env.SECRET;

exports.goldPrice = (req, res) => {
  let mon = new Date().getMonth() + 1;
  let day = new Date().getDate();
  let year = new Date().getFullYear();

  let day2;
  let mon2;

  (() => {
    if (day < 10) {
      day2 = "0" + new Date().getDate();
    }

    if (mon < 10) {
      mon2 = "0" + (new Date().getMonth() + 1);
    }
  })();

  let time = year + "-" + mon2 + "-" + day2;
  let time2 = year + "-" + mon + "-" + day;
  goldModel.find({ date: time2 || time }).exec((err, data) => {
    if (err) {
      console.log("금 시세를 전달하는 도중에 에러가 발생! : ", err);
    }
    if (data.length === 0) {
      return res.status(200).json([{ price: "데이터를 수집 중입니다." }]);
    }
    return res.status(200).json(data);
  });
};

exports.news = (req, res) => {
  newsModel.find({}).exec((err, data) => {
    if (err) {
      console.log("news데이터를 전송하는 관정에서 에러가 발생하였습니다.", err);
    }
    return res.status(200).json(data);
  });
};

exports.priceTotal = (req, res) => {
  goldModel.find({}).exec((err, datas) => {
    if (err) {
      console.log("priceTotal데이터 전달문제발생", err);
    }
    return res.status(200).json(datas);
  });
};

exports.signup = (req, res) => {
  const req_body = req.body;

  const { email, password, name } = req_body;

  let token = jwt.sign({ email, password, name }, privateKey, {
    expiresIn: "600000ms",
  });

  let info = {
    from: '"golden_goose🦆" <foo@example.com>',
    to: email,
    subject: "golden_goose🦆, 가입인증 안내메일입니다.",
    html: `<div style="width:80%; height:100%; border: none; padding : 10px 5%; border-radius:5px; background:#e7eaf6;"> 
      <h3 style="width:100%; margin:0;"> 인증 메일입니다.<br/> <h4 style="border-bottom:1px dotted black; color:#79c2d0; padding-bottom : 1%">아래 링크를 클릭하여 계정을 활성화 하세요.</h4> </h3> 
      <p style="margin-top:1%;">${`http://localhost:3000/auth/${token}`} </p>
      
      </div>`,
  };

  signupModel.findOne({ email: email }).exec((err, user) => {
    if (err) {
      console.log("가입인증 메일을 전송하는 과정에서 에러가 발생", err);
      return res.status(400).json({ error: "잠시 후 다시 시도해주세요." });
    } else if (user) {
      return res
        .status(400)
        .json({ message: "이미 존재하는 이메일 계정입니다." });
    } else {
      mailer(info);
      return res.status(200).json({ message: "인증메일을 전송하였습니다." });
    }
  });
};

exports.active = (req, res) => {
  const data = req.body;
  console.log("ddddaata : ", data);
  jwt.verify(data.token, process.env.SECRET, (err, decoded) => {
    if (err) {
      console.log("계정 활성화 에러 : ", err);
    }

    const { name, password, email } = decoded;
    console.log("활성화 decoded:", decoded);

    const user = new signupModel({
      name,
      password,
      email,
      _id: mongoose.Types.ObjectId().toString(),
    });

    user
      .save()
      .then(() => {
        console.log("유저 가입 데이터 저장성공");
        return res
          .status(200)
          .json({ message: "계정이 활성화되었습니다. 로그인 해주세요." });
      })
      .catch((e) => {
        console.log("가입 오류 : ", e);
        return res.status(400).json({
          error: "계정이 이미 활성화 되었습니다. 로그인을 시도해주세요.",
        });
      });
  });
};

exports.getcookie = (req, res) => {
  const cookie = req.cookies.token;

  if (cookie === undefined) {
    console.log("쿠키비었음", cookie);
    return res.status(200).json({ message: "cookie_False" });
  } else {
    jwt.verify(cookie, process.env.SECRET, (err, decoded) => {
      if (err) {
        console.log("getcookie ERR : ", err);
      }
      console.log("백엔드 쿠키 : ", decoded);

      const { user_id } = decoded;

      signupModel
        .findOne({ _id: user_id.replace(/"/g, "") })
        .exec((err, user) => {
          if (err) {
            console.log("getcookie find ERR : ", err);
          }

          return res
            .status(200)
            .json({ name: user.name, role: user.role, email: user.email });
        });
    });
  }
};

exports.signin = (req, res) => {
  const data = req.body;

  const { email, password } = data;

  signupModel.findOne({ email: email }).exec((err, user) => {
    let user_id = JSON.stringify(user._id);
    let user_role = JSON.stringify(user.role);

    let token = jwt.sign({ user_id, user_role }, privateKey, {
      expiresIn: "7d",
    });

    if (user.checkPassword(password)) {
      res.cookie("token", token);
      return res
        .status(200)
        .json({ message: `${user.name} 님 환영합니다.`, token });
    } else {
      return res.status(400).json({ error: `id혹은 비밀번호가 틀렸습니다.` });
    }
  });
};

exports.userupdate = (req, res) => {
  const userData = req.body;

  const { name, password, email } = userData;

  signupModel.findOne({ email }).exec((err, user) => {
    if (err) {
      console.log("유저 정보를 수정하는 과정에서 err발생 : ", err);
      return res.status(400).json({ error: "나중에 다시 시도해주세요." });
    } else {
      user.name = name;
      if (password !== undefined) {
        user.hashPassword = user.encryptPassword(password);
      }

      user
        .save()
        .then(() => {
          console.log("유저 정보 업데이트 성공");
        })
        .catch((e) => {
          console.log("유저 정보를 업데이트하는 과정에서 err!", e);
        });
      return res.status(200).json({ message: "정보 수정완료" });
    }
  });

  console.log("userData : ", userData);
};

exports.userlist = (req, res) => {
  signupModel.find({}).exec((err, user) => {
    user.map((i) => {
      i._id = "";
      i.hashPassword = "";
      i.salt = "";
    });

    if (err) {
      console.log("유저 데이터 로딩 오류 : ", err);
      return res
        .status(400)
        .json({ error: "유저 데이터를 가져오지 못했습니다." });
    }

    return res.status(200).json(user);
  });
};

exports.userdelete = (req, res) => {
  const userData = req.body;

  const { email } = userData;

  console.log("유저데이타>> :", userData.email);

  signupModel
    .deleteOne({ email })
    .then(() => {
      return res
        .status(200)
        .json({ message: "유저 데이터가 정상적으로 삭제되었습니다." });
    })
    .catch((e) => {
      console.log("유저데이터 삭제 에러 : ", e);
      return res
        .status(400)
        .json({ error: "유저 데이터를 삭제하지 못했습니다." });
    });
};

exports.adminupdate = (req, res) => {
  const userData = req.body;

  if (userData.i !== "") {
    const { email, role } = userData.i;

    signupModel.findOne({ email }).exec((err, user) => {
      if (err) {
        console.log("admin이 회원정보를 수정하는 과정에서 err : ", err);
        return res.status(400).json({ error: "회원 정보 수정에러" });
      }

      user.role = role;

      user
        .save()
        .then(() => {
          console.log("admin이 사용자 정보를 수정하여 저장함.");
          return res
            .status(200)
            .json({ message: "사용자 정보를 업데이트 하였습니다." });
        })
        .catch((e) => {
          console.log("admin이 사용자 정보를 수정하는 과정에서 에러", e);
          return res.status(400).json({ error: "회원 정보를 저장 실패." });
        });
    });
  }
};

exports.posts = (req, res) => {
  //nanoid()
  const data = req.body;
  const { detail, userData } = data;
  const { name, email, title } = userData;
  console.log("ppp :  ", data);

  const post = new postModel({
    postId: nanoid(),
    name,
    writerEmail: email,
    detail,
    postTitle: title,
  });

  post
    .save()
    .then(() => {
      console.log("게시글 저장완료");

      return res.status(200).json({ message: "게시글이 등록되었습니다." });
    })
    .catch((e) => {
      console.log("게시글 등록오류", e);
      return res.status(400).json({ error: "게시글 등록실패" });
    });
};

exports.postlist = (req, res) => {
  postModel.find({}).exec((err, posts) => {
    if (err) {
      console.log("postlist err : ", e);
      return res
        .status(400)
        .json({ error: "게시글 목록을 가져오지 못했습니다." });
    }
    return res.status(200).json({ message: posts });
  });
};

exports.logout = (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "로그아웃" });
  } catch (e) {
    console.log("로그아웃 에러 : ", e);
    return res.status(400).json({ error: "로그아웃 에러" });
  }
};

exports.comdetail = (req, res) => {
  const postId = req.body;

  postModel.findOne({ postId: postId.postId }).exec((err, data) => {
    if (err) {
      console.log("게시글 찾기 에러 : ", err);
      return res.status(400).json({ error: "게시글을 로드하지 못하였습니다." });
    }

    const { name, postTitle, detail } = data;

    return res.status(200).json({ name, postTitle, detail });
  });
};

exports.comment = (req, res) => {
  const { comData, id, name, email } = req.body;

  const comment = new commentModel({
    commentDetail: comData,
    postId: id,
    email,
    name,
  });

  comment
    .save()
    .then(() => {
      console.log("댓글 저장완료");
    })
    .catch((e) => {
      console.log("댓글 저장실패", e);
    });
};

exports.loadcomment = (req, res) => {
  const data = req.body.id;
  commentModel.find({ postId: data }).exec((err, data) => {
    if (err) {
      console.log("댓글 로드 에러 : ", err);
    }

    return res.status(200).json(data);
  });
};

exports.postupdate = (req, res) => {
  const data = req.body;

  const { postId, detail } = data;

  postModel.findOne({ postId: postId }).exec((err, data) => {
    data.detail = detail;
    data
      .save()
      .then(() => {
        return res.status(200).json({ message: "수정 완료" });
      })
      .catch((e) => {
        console.log("게시글 수정 에러 : ", e);
        return res.status(400).json({ error: "수정 실패" });
      });
  });
};

exports.postdel = (req, res) => {
  const data = req.body.id;

  postModel.deleteOne({ postId: data }).exec((err) => {
    console.log("게시글 삭제 에러 : ,", err);
  });

  commentModel.deleteMany({ postId: data }).exec((err) => {
    console.log("게시글의 모든 댓글 삭제 에러 : ", err);
  });
};

exports.authcheck = (req, res) => {
  const cookie = req.cookies.token;

  const id = req.body.postId;

  postModel.findOne({ postId: id }).exec((err, data) => {
    const userId = data.writerEmail;

    jwt.verify(cookie, process.env.SECRET, (err, decoded) => {
      if (decoded.user_role === `"admin"`) {
        return res.status(200).json(true);
      } else {
        signupModel
          .findOne({
            _id: mongoose.Types.ObjectId(decoded.user_id.replaceAll('"', "")),
          })
          .exec((err, user) => {
            let judgment = userId === user.email;
            return res.status(200).json(judgment);
          });
      }
    });
  });
};
