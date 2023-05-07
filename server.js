const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;
const Joi = require("joi");
const app = express();
require("dotenv").config();

const UserModel = require("./models/User");
const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT;

const isAuth = require("./middlewares/isAuth");
const isAdmin = require("./middlewares/isAdmin");

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    // useCreateIndex: true
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("Connected to MongoDB");
  });

const store = new MongoDBSession({
  uri: mongoURI,
  collection: "mySessions",
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(__dirname + "/public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false, // for each request, a new session is not created
    saveUninitialized: false, // don't save unmodified session
    store: store,
    cookie: {
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  })
);

app.get("/", (req, res) => {
  res.render("landing", { isAuth: req.session.isAuth });
});

app.get("/login", (req, res) => {
  res.render("login", { err: "" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate user input
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate({ email, password });
  if (error) {
    return res.render("login", { err: "Invalid email or password format." });
  }

  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.render("login", { err: "Email or Password does not match." });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.render("login", { err: "Email or Password does not match." });
  }

  req.session.isAuth = true;
  req.session.isAdmin = user.isAdmin; // Set the isAdmin field in the session
  res.redirect("/members");
});

app.get("/register", (req, res) => {
  res.render("register", { err: "" });
});

app.post("/register", async (req, res) => {
  const { username, email, password, isAdmin } = req.body;

  // Validate user input
  const schema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    isAdmin: Joi.boolean(),
  });

  const { error } = schema.validate({ username, email, password, isAdmin });
  if (error) {
    return res.render("register", { err: "Invalid input format." });
  }

  let user = await UserModel.findOne({ email });

  if (user) {
    return res.render("register", { err: "Email is already in use." });
  }

  const hashedPsw = await bcrypt.hash(password, 12);

  user = new UserModel({
    username: username,
    email: email,
    password: hashedPsw,
    isAdmin: isAdmin === "true", // Set the isAdmin field based on the checkbox value
  });

  await user.save();

  res.redirect("/login");
});

app.get("/members", isAuth, (req, res) => {
  const images = ["image1.jpg", "image2.jpg", "image3.jpg"];
  const randomImage = images[Math.floor(Math.random() * images.length)];
  res.render("members", { image: randomImage });
});

app.get("/admin", isAuth, isAdmin, async (req, res) => {
  // Fetch all users
  const users = await UserModel.find();
  res.render("admin", {
    users: users,
    isAuth: req.session.isAuth,
    error: null,
  });
});

app.post("/promote/:userId", isAuth, isAdmin, async (req, res) => {
  const { userId } = req.params;

  // Validate user input
  const schema = Joi.object({
    userId: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error("Invalid ObjectId format");
      }
      return value;
    }),
  });

  const { error } = schema.validate({ userId });
  if (error) {
    return res.redirect("/admin"); // Redirect to admin page if the input is invalid
  }

  await UserModel.findByIdAndUpdate(userId, { $set: { isAdmin: true } });
  res.redirect("/admin");
});

app.post("/demote/:userId", isAuth, isAdmin, async (req, res) => {
  const { userId } = req.params;

  // Validate user input
  const schema = Joi.object({
    userId: Joi.string().custom((value, helpers) => {
      if (!ObjectId.isValid(value)) {
        return helpers.error("Invalid ObjectId format");
      }
      return value;
    }),
  });

  const { error } = schema.validate({ userId });
  if (error) {
    return res.redirect("/admin"); // Redirect to admin page if the input is invalid
  }

  await UserModel.findByIdAndUpdate(userId, { $set: { isAdmin: false } });
  res.redirect("/admin");
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

// Catch-all route handler
app.use((req, res) => {
  res.status(404).render("404");
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

app.listen(5000, () => {
  console.log("Server started on http://localhost:5000");
});
