const mongoose = require("mongoose");

const goldPriceSchema = new mongoose.Schema({
  date: String,
  price: Number,
});

module.exports = mongoose.model("GoldPrice", goldPriceSchema);
