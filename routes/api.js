const express = require("express");

const {
  goldPrice,
  news,
  priceTotal,
  signup,
  active,
  signin,
  getcookie,
  userupdate,
  userlist,
  userdelete,
  adminupdate,
  posts,
  postlist,
  logout,
  comdetail,
  comment,
  loadcomment,
  postupdate,
  postdel,
  authcheck,
} = require("../controller/api_con");

const router = express.Router();

router.get("/price", goldPrice);

router.get("/news", news);

router.get("/pricetotal", priceTotal);

router.get("/getcookie", getcookie);

router.get("/logout", logout);

router.post("/signup", signup);

router.post("/active", active);

router.post("/signin", signin);

router.post("/userupdate", userupdate);

router.post("/userlist", userlist);

router.post("/userdelete", userdelete);

router.post("/adminupdate", adminupdate);

router.post("/userpost", posts);

router.post("/postlist", postlist);

router.post("/comdetail", comdetail);

router.post("/comment", comment);

router.post("/loadcomment", loadcomment);

router.post("/postupdate", postupdate);

router.post("/postdel", postdel);

router.post("/authcheck", authcheck);

module.exports = router;
