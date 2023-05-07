// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.render("admin", {
      isAuth: req.session.isAuth,
      error: "You don't have the required admin privileges.",
    });
  }
};

module.exports = isAdmin;
