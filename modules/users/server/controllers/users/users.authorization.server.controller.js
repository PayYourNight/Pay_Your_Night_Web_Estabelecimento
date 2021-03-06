'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  jwt = require('jsonwebtoken');

var secret = 'secret';

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  User.findOne({
    _id: id
  }).exec(function (err, user) {
    if (err) return next(err);
    if (!user) return next(new Error('Failed to load User ' + id));
    req.profile = user;
    next();
  });
};

/**
 * Require login routing middleware
 */
exports.requiresLogin = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).send({
      message: 'User is not logged in'
    });
  }

  next();
};

/**
 * Require login token routing middleware
 */
exports.requiresLoginToken = function (req, res, next) {
  // check for login token here
  console.log("authorization");
  console.log(req.headers.authorization);
  var loginToken = req.headers.authorization;

  loginToken = loginToken.replace("JWT ", "");

  // query DB for the user corresponding to the token and act accordingly
  /*    User.findOne({
          loginToken: loginToken,
          loginExpires: {
              $gt: Date.now()
          }
      }, function (err, user) {
          if (!user) {
              return res.status(401).send({
                  message: 'Token is incorrect or has expired. Please login again'
              });
          }
          if (err) {
              return res.status(500).send({
                  message: 'There was an internal server error processing your login token'
              });
          }

          console.log(user);
          // bind user object to request and continue
          req.user = user;

          next();
      });*/

  // verifies secret and checks exp
  jwt.verify(loginToken, secret, function (err, decoded) {
    if (err) {
      return res.status(401).send({
        message: 'Failed to authenticate token.'
      });
    } else {
      // if everything is good, save to request for use in other routes
      req.decoded = decoded;

      next();
    }
  });
};

/**
 * User authorizations routing middleware
 */
exports.hasAuthorization = function (roles) {
  var _this = this;

  return function (req, res, next) {
    _this.requiresLogin(req, res, function () {
      if (_.intersection(req.user.roles, roles).length) {
        return next();
      } else {
        return res.status(403).send({
          message: 'User is not authorized'
        });
      }
    });
  };
};
