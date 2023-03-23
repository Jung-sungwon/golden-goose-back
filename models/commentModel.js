const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  name: String,
  postId: { type: String },
  commentDetail: String,
  email: String,
});

module.exports = mongoose.model("Comment", commentSchema);
