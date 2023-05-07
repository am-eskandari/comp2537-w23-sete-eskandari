const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();

const UserModel = require("./models/User");
const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT;

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

const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", (req, res) => {
  res.render("landing", { isAuth: req.session.isAuth });
});

app.get("/login", (req, res) => {
  res.render("login", { err: "" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.render("login", { err: "" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.render("login", { err: "Email or Password does not match." });
  }

  req.session.isAuth = true;
  res.redirect("/members");
});

app.get("/register", (req, res) => {
  res.render("register", { err: "" });
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!email) {
    return res.render("register", { err: "Email is required." });
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
  });

  await user.save();

  res.redirect("/login");
});

app.get("/members", isAuth, (req, res) => {
  const images = ["image1.jpg", "image2.jpg", "image3.jpg"];
  const randomImage = images[Math.floor(Math.random() * images.length)];
  res.render("members", { image: randomImage });
});

app.get("/admin", (req, res) => {
  res.render("admin", { isAuth: req.session.isAuth });
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

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});


app.listen(5000, () => {
  console.log("Server started on http://localhost:5000");
});
