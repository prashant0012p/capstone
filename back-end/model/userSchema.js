const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const userSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    requried: true,
  },
  Phone: {
    type: Number,
    required: true,
  },
  Password: {
    type: String,
    required: true,
  },
  CPassword: {
    type: String,
    requried: true,
  },
  cart: {
    type: Object,
    
  },
  tokens: [
    {
      token: { type: String, requried: true },
    },
  ],
});

userSchema.pre("save", async function (next) {
  if (this.isModified("Password")) {
    this.Password = await bcrypt.hash(this.Password, 12);
    this.CPassword = await bcrypt.hash(this.CPassword, 12);
  }

  next();
});

userSchema.methods.generateAuthToken = async function () {
  try {
    let tok = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);

    this.tokens = this.tokens.concat({ token: tok });

    this.save();

    return tok;
  } catch (err) {}
};

const User = mongoose.model("userDetail", userSchema);

module.exports = User;
