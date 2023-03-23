const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
  name: String,
  link: String,
});

module.exports = mongoose.model("GoldNew", newsSchema);
