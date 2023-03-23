const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  name: String,
  detail: String,
  postId: { type: String, unique: true },
  postTitle: String,
  writerEmail: String,
});

module.exports = mongoose.model("Post", postSchema);
