const db = require('../models');
const passport = require('../config/passport');

module.exports = function(app) {

  // Route to sign up. The user's password is automatically hashed and stored securely thanks to
  // how the sequelize User model was configured. If the user is created successfully, proceed to
  // log the user in. Otherwise send back an error.
  app.post('/api/signup', (req, res) => {
    db.User.create({
      username: req.body.username,
      password: req.body.password,
      yearBorn: req.body.yearBorn,
      status: false
    })
      .then(() => {
        res.redirect('/api/login');
      })
      .catch((err) => {
        res.status(401).json(err);
      });
  });

  // Route to login. Uses passport.authenticate middleware that was set up with local strategy.
  // If the user has valid login credentials, sign them in. Otherwise send an error.
  app.post('/api/login', passport.authenticate('local', { successRedirect: '/home', failureRedirect: '/home' }));

  // Route to terminate a login session. According to passport docs, invoking req. logout() will
  // remove the req.user property and clear the login session (if any).
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });
};