const express = require("express");
const session = require("express-session");

const app = express();

const port = process.env.PORT || 3020;

const node_session_secret = "4f198574-f203-4187-af56-4672b581500b";

const path = require("path");

// app.use(
//   session({
//     secret: node_session_secret,
//     // store: mongoStore, // default is memory store
//     saveUninitialized: false,
//     resave: false,
//   })
// );

// // var numPageHits = 0;

// app.get("/", (req, res) => {
//   if (req.session.numPageHits == null) {
//     req.session.numPageHits = 0;
//   } else {
//     req.session.numPageHits++;
//   }
//   // numPageHits++;
//   res.send(`This page has been visited ${req.session.numPageHits} times!`);
// });

// app.get("/", (req, res) => {
//   res.send("Hello World");
// });

// app.listen(port, () => console.log(`Listening on port ${port}...`));
