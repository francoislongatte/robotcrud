const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const Robot = require('../models/robot');
const User = require('../models/user');

exports.getRobots = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = req.query.perPage || 250;
  let totalItems;

  Robot.find()
    .countDocuments()
    .then(count => {
      totalItems = count;
      return Robot.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then(robots => {
      res.status(200).json({
        message: 'Fetched posts successfully.',
        robots: robots,
        totalItems: totalItems
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createRobot = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const robot = new Robot({
    title: title,
    content: content,
    creator: req.userId
  });
  robot.save()
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      creator = user;
      user.robots.push(robot);
      return user.save();
    })
    .then(result => {
      res.status(201).json({
        message: 'Post created successfully!',
        robot: robot,
        creator: { _id: creator._id, name: creator.name }
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getRobot = (req, res, next) => {
  const robotId = req.params.robotId;
  Robot.findById(robotId)
    .then(robot => {
      if (!robot) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: 'Post fetched.', robot: robot });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteRobot = (req, res, next) => {
  const robotId = req.params.robotId;
  Robot.findById(robotId)
    .then(robot => {
      if (!robot) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if (robot.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      // Check logged in user
      return Robot.findByIdAndRemove(robotId);
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.robots.pull(robotId);
      return user.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Deleted robot.' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
