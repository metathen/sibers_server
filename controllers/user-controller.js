const { prisma } = require("../prisma/prisma-client");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserController = {
	register: async (req, res) => {
		const {username, password} = req.body;
		if(!username || !password) return res.status(400).json({error: "Register Invalid!"});

		try {
			const existUser = await prisma.user.findUnique(({where: {username: username.toLowerCase()}})); //username unique check

			if(existUser) return res.status(400).json({error: "Username has been declared"});

			const hashPass = await bcrypt.hash(password, 10);
			const user = await prisma.user.create({ //db entry
				data: {username: username.toLowerCase(), password: hashPass}
			});
			//Why toLowerCase?
			//Resorted to using a single case for db entries to improve the unique of the data itself.
			res.json(user);
		} catch (error) {
			console.error('Error in register', error);
			res.status(500).json({error: 'Interna; server error'});
		}
	},
	login: async (req, res) => {
		const {username, password} = req.body;
		if(!username || !password) return res.status(400).json({error: "Login invalid!"});

		try {
			const user = await prisma.user.findUnique({where: {username}});
			
			if(!user) return res.status(400).json({error: "Invalid data!"});

			const validPass = await bcrypt.compare(password, user.password); //comparing password hashes

			if(!validPass) return res.status(500).json({error: "Invalid data"});

			const token = jwt.sign(({userId: user.id}), process.env.SECRET_WORD); //create auth token

			res.json({token});
		} catch (error) {
			console.error("Error in Login", error);
			res.status(500).json({error: "Login Invalid"});
		}
	},
	getUserById: async () => {},
	currentUser: async () => {}
};

module.exports = UserController;