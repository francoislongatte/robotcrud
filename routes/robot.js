const express = require('express');
const { body } = require('express-validator/check');

const robotController = require('../controllers/robot');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /feed/robots
router.get('/robots', robotController.getRobots);

// POST /feed/post
router.post(
  '/robot',
  isAuth,
  [
    body('title')
      .trim()
      .isLength({ min: 3 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  robotController.createRobot
);

router.get('/robot/:robotId', robotController.getRobot);

router.delete('/robot/:robotId', isAuth, robotController.deleteRobot); 

module.exports = router;
