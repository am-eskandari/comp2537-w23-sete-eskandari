// Middleware to check if the user is authenticated
const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect("/login");
  }
};

module.exports = isAuth;
