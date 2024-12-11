const jwt = require("jsonwebtoken");

const authToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];//get token
	const token = authHeader && authHeader.split(' ')[1];//remove Bearer
	if(!token) return res.status(401).json({error: 'Unauthorization'});
	jwt.verify(token, process.env.SECRET_WORD, (err, user) => { //check token
		if(err) return res.status(403).json({error: "Invalid auth session"});
		req.user = user;
		next();
	})
}
module.exports = authToken;