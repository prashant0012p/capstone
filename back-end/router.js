const express = require("express");

const cors = require("cors");

const router = express.Router();

const shortid = require("shortid");

const { MongoClient } = require("mongodb");

const mongoose = require("mongoose");

const cookieParser = require("cookie-parser");

const dotenv = require("dotenv");

const Razorpay = require("razorpay");

dotenv.config({ path: "./config.env" });

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const authenticate = require("./middleware/authenticate");

const Cart = require("./model/cartSchema");

router.use(cookieParser());
router.use(express.json());

//mongoose
require("./db/connection");

router.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000"],
  })
);

async function FindHostDetail() {
  const uri =
    "mongodb+srv://Prashant:Prashant0012@cluster0.bai5pod.mongodb.net/?retryWrites=true&w=majority";
  const Client = new MongoClient(uri);
  await Client.connect();
  const result = Client.db("bookapi")
    .collection("booklists")
    .find()
    .sort({ _id: -1 })
    .toArray();

  return result;
}

//get json format data
router.use(express.json());

// model
const User = require("./model/userSchema");
//model
const EmptyCart = require("./model/EmptyCartSchema");

const razorpay = new Razorpay({
  key_id: process.env.RAZOR_PAY_API_KEY,
  key_secret: process.env.RAZOR_PAY_SECRET,
});

router.post("/razorpay", async (req, res) => {
  const payment_capture = 1;
  const currency = "INR";

  const options = {
    amount: 50000, // amount in the smallest currency unit
    currency,
    receipt: "shortid.generate()",
    payment_capture,
  };
  try {
    const response = await razorpay.orders.create(options);
    res.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
      receipt: response.receipt,
    });
  } catch (e) {
    console.log(e);
  }
});

router.get("/placeorderres", authenticate, (req, res) => {
  // console.log("This is placeorder section")
  // console.log(req.rootUser)
  res.send(req.rootUser);
});
router.post("/placeorder", async (req, res) => {
  let { userEmail, cart, response } = req.body;

  console.log(userEmail);

  // console.log(response);
  // console.log(userLogin, "from place order");
  cart.forEach(async (cartItem) => {
    await Cart.updateOne(
      { email: userEmail },
      {
        $push: {
          items: cartItem,
        },
      }
    )
      .then((value) => console.log(value))
      .catch((err) => console.log(err));
  });
  res.json({ message: "success" });
  // console.log("end");
});

//auth
router.get("/", authenticate, (req, res) => {
  res.send(req.rootUser.Email);
});

//cart auth
router.get("/cart", authenticate, (req, res) => {
  res.send(req.rootUser);
});

//addcart to monnogdb userChema
router.post("/addCart", async (req, res) => {
  const cartObj = req.body.cartObj;
  console.log(cartObj);
  if (!cartObj) {
    return res.status(422).json({ error: "plz filled the field properly" });
  }
  try {
    let user = await User.findOneAndUpdate(
      { Email: "prashant@gmail.com" },
      { cart: cartObj },
      { new: true }
    );
  } catch (err) {
    console.log(err);
  }
});

//register
router.post("/register", async (req, res) => {
  const { name, email, phone, password, cpassword } = req.body;

  console.log(name, email, phone, password, cpassword);

  if (!name || !email || !phone || !password || !cpassword) {
    return res.status(422).json({ error: "plz filled the field properly" });
  }

  try {
    const userExist = await User.findOne({ Email: email });

    if (userExist) {
      return res.status(422).json({ error: "Email already Exist" });
    } else if (password !== cpassword) {
      return res.status(422).json({ error: "password are not matching" });
    } else {
      const user = new User({
        Name: name,
        Email: email,
        Phone: phone,
        Password: password,
        CPassword: cpassword,
      });

      await user.save();

      const emptyCartCreate = new EmptyCart({ email: email });
      const createdCartResult = await emptyCartCreate.save();

      res.status(201).json({ message: "user registered successfuly" });
    }
  } catch (err) {
    console.log(err);
  }
});

//sigin
router.post("/signin", async (req, res) => {
  try {
    let token;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "plz filled the data" });
    }

    const userLogin = await User.findOne({ Email: email });

    if (userLogin) {
      const isMatched = await bcrypt.compare(password, userLogin.Password);

      console.log(userLogin);
      console.log(isMatched + "matched");

      if (!isMatched) {
        res.status(400).json({ error: "Invalid Credientials" });
      } else {
        token = await userLogin.generateAuthToken();

        res.cookie("jwtauth", token, {
          expires: new Date(Date.now() + 25892000000),
          httpOnly: false,
        });

        res.status(200).send({ messsage: "login successfully" });
      }
    } else {
      res.status(400).json({ error: "Invalid Credientials" });
    }
  } catch (err) {
    console.log(err);
  }
});

//get book
router.get("/book", async (req, res) => {
  let data = await FindHostDetail();

  res.send(data);
});

//logout
router.get("/logout", authenticate, async (req, res) => {
  req.rootUser.tokens = [];

  console.log(req.rootUser.tokens);

  console.log("this is logout page");

  res.clearCookie("jwtauth");

  await req.rootUser.save();

  res.status(200).send("User Logout");
});

router.get("/orderHistory", authenticate, async (req, res) => {
  let userEmail = req.rootUser.Email;
  const orderHistory = await Cart.findOne({ email: userEmail });

  res.json({ orderHistory });
});

module.exports = router;
