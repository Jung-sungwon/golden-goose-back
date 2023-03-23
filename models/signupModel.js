const mongoose = require("mongoose");
const { createHash } = require("node:crypto");

const signupSchema = new mongoose.Schema({
  name: { type: String },
  hashPassword: { type: String },
  role: { type: String, default: "subscriber" },
  email: { type: String, unique: true },
  salt: { type: String },
  _id: { type: String },
});

signupSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashPassword = this.encryptPassword(this._password);
  })
  .get(function () {
    return this._password;
  });

signupSchema.methods = {
  makeSalt: function () {
    let ran = Math.floor(new Date().getTime() * (Math.random() * 100));
    return ran.toString();
  },
  encryptPassword: function (password) {
    const hash = createHash("sha256")
      .update(password + this.salt)
      .digest("hex");
    return hash;
  },
  checkPassword: function (nomalPassword) {
    return this.encryptPassword(nomalPassword) === this.hashPassword;
  },
};

module.exports = mongoose.model("User", signupSchema);
