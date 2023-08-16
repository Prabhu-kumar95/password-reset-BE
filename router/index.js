const express = require("express");
const router = express.Router();
const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const authendicate = require("../middleware/authendicate");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const keysecret = "gghjnbccxsetyuopplmkhgsarwryippk";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "nrtech92@gmail.com",
    pass: "eirryawnyfehnlcu",
  },
});

router.post("/user", async (req, res) => {
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    res.status(422).json({ error: "fill all the details" });
  }
  try {
    const preuser = await User.findOne({ email: email });
    if (preuser) {
      res.status(422).json({ error: "This email is already exists" });
    } else {
      const finalUser = new User({
        fullname,
        email,
        password,
      });
      const storeData = await finalUser.save();
      res.status(201).json({ status: 201, storeData });
    }
  } catch (error) {
    res.status(422).json(error);
    console.log("catch block error");
  }
});

router.post("/login", async (req, res) => {
  //console.log(req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({ error: "fill all the details" });
  }
  try {
    const userValid = await User.findOne({ email: email });

    if (userValid) {
      const isMatch = await bcrypt.compare(password, userValid.password);

      if (!isMatch) {
        res.status(422).json({ error: "Invalid Details" });
      } else {
        const token = await userValid.generateAuthtoken();

        res.cookie("usercookie", token, {
          expires: new Date(Date.now() + 9000000),
          httpOnly: true,
        });
        const result = {
          userValid,
          token,
        };
        res.status(201).json({ status: 201, result });
      }
    }
  } catch (error) {
    res.status(201).json(error);
    console.log("catch block");
  }
});

router.get("/validuser", authendicate, async (req, res) => {
  try {
    const ValidUserOne = await User.findOne({ _id: req.user_id });
    res.status(201).json({ status: 201, ValidUserOne });
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

router.post("/sendpasswordlink", async (req, res) => {
  console.log(req.body);
  const { email } = req.body;
  if (!email) {
    res.status(401).json({ status: 401, message: "Enter your email" });
  }
  try {
    const userfind = await User.findOne({ email: email });

    const token = jwt.sign({ _id: userfind._id }, keysecret, {
      expiresIn: "120s",
    });

    const setusertoken = await User.findByIdAndUpdate(
      { _id: userfind._id },
      { verifytoken: token },
      { new: true }
    );

    if (setusertoken) {
      const mailOptions = {
        from: "nrtech92@gmail.com",
        to: email,
        subject: "Sending Email for Password Reset",
        text: `This link valid for two minutes http://localhost:3000/forgotpassword/${userfind.id}/${setusertoken.verifytoken}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("error", "error");
          res.status(401).json({ status: 401, message: "email not send" });
        } else {
          console.log("Email sent", info.response);
          res
            .status(201)
            .json({ status: 201, message: "email sent successfully" });
        }
      });
    }
  } catch (error) {
    res.status(401).json({ status: 401, message: "email invalid" });
  }
});

router.get("/forgotpassword/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  try {
    const validuser = await User.findOne({ _id: id, verifytoken: token });

    const verifyToken = jwt.verify(token, keysecret);
    if (validuser && verifyToken._id) {
      res.status(201).json({ status: 201, validuser });
    } else {
      res.status(401).json({ status: 401, message: "user not exists" });
    }
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

router.post("/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  const { password } = req.body;
  try {
    const validuser = await User.findOne({ _id: id, verifytoken: token });

    const verifyToken = jwt.verify(token, keysecret);

    if (validuser && verifyToken._id) {
      const newpassword = await bcrypt.hash(password, 10);
      const setnewuserpass = await User.findByIdAndUpdate(
        { _id: id },
        { password: newpassword }
      );

      setnewuserpass.save();
      res.status(201).json({ status: 201, setnewuserpass });
    } else {
      res.status(401).json({ status: 401, message: "user not exists" });
    }
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

module.exports = router;
