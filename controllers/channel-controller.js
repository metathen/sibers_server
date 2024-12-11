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
	addUser: async (req, res) => {
		const { channelId, userId } = req.body;
		if (!channelId || !userId) return res.status(400).json({ error: "Channel ID and User ID are required" });
	  
		try {
			const channel = await prisma.channels.findUnique({
				where: { id: channelId },
			});
		
			if (!channel) return res.status(404).json({ error: "Channel not found" });

			//check user role
			// if (channel.creatorId !== req.user.userId) return res.status(403).json({ error: "Only the channel creator can add members" });
		
			// Check if the user is already a member of the channel.
			if (channel.members.includes(userId)) return res.status(400).json({ error: "User is already a member of this channel" });
		
			const updatedChannel = await prisma.channels.update({
				where: { id: channelId },
				data: {
				members: {push: userId}
				},
			});
		
			res.json(updatedChannel);
		} catch (error) {
		  	console.error('Error adding user to channel', error);
		  	res.status(500).json({ error: "Server error" });
		}
	},
	joinChannel: async (req, res) => {
		const { channelId } = req.body;
		const userId = req.user.userId;
	  
		if (!channelId) return res.status(400).json({ error: "Channel ID is required" });
	  
		try {
			const channel = await prisma.channels.findUnique({where: { id: channelId }});
		
			if (!channel) return res.status(404).json({ error: "Channel not found" });
		
			// Check if the user is already a member of the channel.
			if (channel.members.includes(userId)) return res.status(400).json({ error: "You are already a member of this channel" });
		
			const updatedChannel = await prisma.channels.update({
				where: { id: channelId },
				data: {members: { push: userId }}
			});
		
			res.json(updatedChannel);
		} catch (error) {
			console.error('Error joining channel', error);
			res.status(500).json({ error: "Server error" });
		}
	},
	deleteUser: async (req, res) => {
		const { channelId, userId } = req.body;
		const creatorId = req.user.userId;
	  
		if (!channelId || !userId) return res.status(400).json({ error: "Channel ID and User ID are required" });
	  
		try {
			const channel = await prisma.channels.findUnique({where: { id: channelId }});
		
			if (!channel) return res.status(404).json({ error: "Channel not found" });

			//Check user role
			if (channel.creatorId !== creatorId) return res.status(403).json({ error: "Only the channel creator can remove users" });

			// Check if the user is already a member of the channel.	
			if (!channel.members.includes(userId)) return res.status(400).json({ error: "User is not a member of this channel" });
		
			const updatedChannel = await prisma.channels.update({
				where: { id: channelId },
					data: {
					members: {
						// use the filter method to remove the user from the list
						set: channel.members.filter(member => member !== userId),
					},
				},
			});

			res.json(updatedChannel);
		} catch (error) {
			console.error('Error deleting user from channel', error);
			res.status(500).json({ error: "Server error" });
		}
	},
}
module.exports = ChannelControllers;