const {prisma} = require('../prisma/prisma-client');

const ChannelControllers = {
	createChannel: async (req, res) => {
		const {name} = req.body;
		const createdBy = req.user.userId;
		if(!name) return res.status(400).json({error: "Invalid!"});
		try {
			const cahnnel = await prisma.channels.create({
				data: {
					name,
					creatorId: createdBy,
					members: [createdBy]
				}
			});
			res.json(cahnnel);
		} catch (error) {
			console.error('Error with create a channel', error);
			res.status(500).json({error: "server error"});
		}
	},
	addUser: async () => {},
	joinChannel: async () => {},
	deleteUser: async () => {}
}
module.exports = ChannelControllers;