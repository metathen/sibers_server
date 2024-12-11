const express = require('express');
const router = express.Router();
const multer = require('multer');
const { UserController } = require('../controllers');

const storage = multer.diskStorage({
	destination: 'uploads',
	filename: function(req, file, next) { //this func generates a filename
		next(null, file.originalname);
	}
});

const uploads = multer({storage});

router.post('/reg', UserController.register);
router.post('/log', UserController.login);
router.get('/user/:id', UserController.login);
router.put('/user/:id', UserController.updateUser);
router.get('/current', UserController.currentUser);

module.exports = router;