const { prisma } = require("../prisma/prisma-client");
const bcrypt = require('bcryptjs');

const UserController = {
	register: async (req, res) => {
		const {username, password} = req.body;

		if(!username || !password) {
			return res.status(400).json({error: "Register Invalid!"});
		}

		try {
			const existUser = await prisma.user.findUnique(({where: {username}}));
			if(existUser) {
				return res.status(400).json({error: "Username has been declared"});
			}
			const hashPass = await bcrypt.hash(password, 10);
			const user = await prisma.user.create({
				data: {username, password: hashPass}
			});
			res.json(user);
		} catch (error) {
			console.error('Error in register', error);
			res.status(500).json({error: 'Interna; server error'});
		}
	},
	login: async () => {},
	getUserById: async () => {},
	updateUser: async () => {},
	currentUser: async () => {}
};

module.exports = UserController;