var express = require('express');
var router = express.Router();
var api = require('../controllers/api.js');

router.get('/messages',[api.get_messages]);

router.post('/messages',api.post_messages);

router.post('/messages/bulk',api.post_bulk);

router.get('/users/check',api.check_user);

router.get('/users/signout',api.signout_user);

router.post('/register',api.register_token);

router.post('/push',api.push);

router.post('/push/all',api.push_all);

module.exports = router;
