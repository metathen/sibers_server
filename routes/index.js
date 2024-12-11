const express = require('express');
const router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
	destination: 'uploads',
	filename: function(req, file, next) { //this func generates a filename
		next(null, file.originalname);
	}
});

const uploads = multer({storage});

module.exports = router;