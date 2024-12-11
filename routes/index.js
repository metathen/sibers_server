const express = require('express');
const router = express.Router();
const multer = require('multer');
const { UserController, ChannelControllers } = require('../controllers');
const authToken = require('../middleware/auth');

const storage = multer.diskStorage({
	destination: 'uploads',
	filename: function(req, file, next) { //this func generates a filename
		next(null, file.originalname);
	}
});

const uploads = multer({storage});

//User routes
router.post('/reg', UserController.register);
router.post('/log', UserController.login);
router.get('/current', authToken, UserController.currentUser);

//channel routes
router.post('/create', authToken, ChannelControllers.createChannel);
router.put('/add', authToken, ChannelControllers.addUser);
router.post('/join', authToken, ChannelControllers.joinChannel);
router.delete('/delete', authToken, ChannelControllers.deleteUser);
router.post('/send-message', authToken, ChannelControllers.sendMessage);

module.exports = router;