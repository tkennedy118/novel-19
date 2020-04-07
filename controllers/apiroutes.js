const db = require('../models');
const passport = require('../config/passport');
const isAuthenticated = require('../config/middleware/isAuthenticated');


module.exports = function (app) {

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
        res.redirect(307, '/api/login');
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
  app.get('/api/logout', (req, res) => {
    req.logout();
    res.redirect('/home');
  });

  // Route to update user status. Ternary operator used to check logged in user's status.
  app.put('/api/status', isAuthenticated, (req, res) => {
    const newStatus = (req.user.status === '1') ? false : true;
    db.User.update({ status: newStatus }, {
      where: {
        id: req.user.id
      }
    })
      .then(() => {
        // Render page that user made the request from.
        if (req.headers.referer === (req.headers.origin + '/profile')) {
          setTimeout(function() { res.render('profile'); }, 2000);
        }
        else {
          setTimeout(function() { res.render('index'); }, 2000);
        }
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  });

  // Route to add location.
  app.post('/api/addlocation', (req, res) => {
    const address = req.body.addressLine;
    db.Location.findOne({
      where: {
        addressLine: address
      }
    }).then((address) => {
      console.log(address);
      if (null === address) {
        db.Location.create({
          addressLine: req.body.addressLine,
          country: req.body.country,
          state: req.body.state,
          zipcode: req.body.zipcode,
          latitude: req.body.latitude,
          longitude: req.body.longitude
        })
          .then(() => {
            res.redirect('/home');
          })
          .catch((err) => {
            console.log(err);
          });
      }
      else {
        res.redirect('/home');
      }
    });
  });

  // Route to add note. Checks if user is authenticated first.
  app.post('/api/addnote', isAuthenticated, (req, res) => {
    const address = req.body.addressLine;
    db.Location.findOne({
      where: {
        addressLine: address
      }
    }).then((location) => {
      db.Note.create({
        body: req.body.body,
        UserId: req.user.id,
        LocationId: location.id
      }).then(() => {
        res.redirect('/home');
      }).catch((err) => {
        console.log(err);
      });
    });
  });

  // Route to update note.
  app.put('/api/note/update', isAuthenticated, (req, res) => {
    db.Note.update(
      { body: req.body.body },
      { where: { id: req.body.id }}
    ).then((affectedRows) => {
      res.send(affectedRows);
    }).catch((err) => {
      console.log(err);
      res.end();
    });
  });

  // Route to delete note.
  app.delete('/api/note/delete', isAuthenticated, (req, res) => {
    console.log('REQ.BODY.ID: ', req.body.id);
    db.Note.destroy(
      { where: { id: req.body.id }}
    ).then(() => {
      res.end();
    }).catch((err) => {
      console.log(err);
      res.end();
    });
  });

  app.get('/api/notes/all', function(req, res) {
    db.Note.findAll({
      include: [
        {
          model: db.Location
        },
        {
          model: db.User
        }
      ]
    }).then(results => {
      res.json(results);
    });
  });

  app.get('/api/user', isAuthenticated, (req, res) => {
    res.json(req.user.id);
  });


  app.get('/api/users/all', (req, res) => {
    db.User.findAll().then(result => res.json(result));
  });

  // Route to get user notes.
  app.get('/api/notes/user', function(req, res) {

    if (req.user) {
      db.User.findOne({
        include: [
          {
            model: db.Note,
            include: [
              {
                model: db.Location
              }
            ]
          }
        ],
        where: { id: req.user.id }
      }).then(result => res.json(result));
    }
    // User is not signed in.
    else {
      res.send(false);
    }
  });

  // Route to get Algolia api key
  app.get('/api/key/algolia', (req, res) => {
    res.send(process.env.ALGOLIA_API_KEY);
  });
  
};