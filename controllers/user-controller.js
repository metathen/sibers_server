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
	currentUser: async (req, res) => {
		try {
			const user = await prisma.user.findUnique({
				where: {
					id: req.user.userId
				},
				include: {
					Channels: true,
					Messages: true
				}
			})
			if(!user) {
				return res.status(400).json({error: "Cannot find the user"})
			}
			res.json(user);
		} catch (error) {
			console.error('Error in current',error);
			req.status(500).json({error: "Cannot find the user"});
		}
	},
	searchUser: async (req, res) => {
		const { username } = req.body;
	
		if (!username) return res.status(400).json({ error: 'Username query parameter is required' });
	
		try {
			const users = await prisma.user.findMany({
				where: {
					username: {
						contains: username,
						mode: 'insensitive',  //case-insensitive search
					},
				},
				select: {
					id: true,
					username: true,
					avatarurl: true,
					createdAt: true,
					updatedAt: true,
				},
			});
	
			if (users.length === 0) return res.status(404).json({ message: 'No users found with that username' });
	
			res.status(200).json(users);
		} catch (error) {
			console.error('Error searching users by username:', error);
			return res.status(500).json({ error: 'Server error' });
		}
	}
};

module.exports = UserController;