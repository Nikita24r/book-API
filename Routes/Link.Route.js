const express = require('express');
const router = express.Router();
const Controller = require('../Controller/Link.Controller.js');
const { verifyAccessToken } = require('../helpers/jwt_helpers.js');

// Routes
router.post('/',verifyAccessToken, Controller.create);
router.get('/:id', Controller.get);
router.get('/', Controller.list);
router.put('/:id', verifyAccessToken, Controller.update);
router.delete('/:id', verifyAccessToken, Controller.delete);
router.put('/:id/restore', verifyAccessToken, Controller.restore);

module.exports = router;