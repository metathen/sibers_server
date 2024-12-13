const {prisma} = require('../prisma/prisma-client');

const ChannelControllers = {
	createChannel: async (req, res) => {
		const {name} = req.body;
		const createdBy = req.user.userId;
		if(!name) return res.status(400).json({error: "Invalid!"});
		try {
			const cahnnel = await prisma.channel.create({
				data: {
					name,
					creatorId: createdBy,
					members: {
						connect: [{ id: createdBy }],
					},
				}
			});

			await prisma.user.update({ //saving a user to the group model in the database.
				where: { id: createdBy },
				data: {
					channels: {
						connect: { id: cahnnel.id },
					},
				},
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
			const channel = await prisma.channel.findUnique({
				where: { id: channelId },
				select: { members: true },
			});
		
			if (!channel) return res.status(404).json({ error: "Channel not found" });

			//check user role
			// if (channel.creatorId !== req.user.userId) return res.status(403).json({ error: "Only the channel creator can add members" });
		
			// Check if the user is already a member of the channel.
			if (channel.members.includes(userId)) return res.status(400).json({ error: "User is already a member of this channel" });
		
			// Add the new user to the members array.
			const updatedMembers = [...channel.members, userId];
			
			const updatedChannel = await prisma.channels.update({
				where: { id: channelId },
				data: { members: updatedMembers },
			});

			const updatedUser = await prisma.user.update({ //saving a user to the group model in the database.
				where: { id: userId },
				data: {
					Channels: {
						connect: { id: channelId },
					},
				},
				select: {
					Channels: true
				}
			});
		
			res.json([updatedChannel, updatedUser]);
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
			const channel = await prisma.channel.findUnique({where: { id: channelId }, select: {members: true}});
		
			if (!channel) return res.status(404).json({ error: "Channel not found" });
		
			// Check if the user is already a member of the channel.
			const userIsMember = channel.members.some(member => member.id === userId);

			if (userIsMember) return res.status(400).json({ error: "You are already a member of this channel" });
		
			const updatedChannel = await prisma.channel.update({
				where: { id: channelId },
				data: {members: {
					connect: [{ id: userId }],
				}}
			});

			await prisma.user.update({
				where: { id: userId },
				data: {
					channels: {
						connect: { id: updatedChannel.id },
					},
				},
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
			const channel = await prisma.channel.findUnique({where: { id: channelId }, select: { members: true, creatorId: true }});
			
			if (!channel) {
				return res.status(404).json({ error: "Channel not found" });
			}

			console.log(channel)
		
			if (!channel) return res.status(404).json({ error: "Channel not found" });

			//Check user role
			if (channel.creatorId !== creatorId) return res.status(403).json({ error: "Only the channel creator can remove users" });

			if (!Array.isArray(channel.members)) {
				return res.status(500).json({ error: "Invalid members data" });
			}

			// Check if the user is already a member of the channel.	
			const userIsDelete = channel.members.some(member => member.id === userId);
			if (!userIsDelete) return res.status(400).json({ error: "User is not a member of this channel" });
		
			const updatedChannel = await prisma.channel.update({
				where: { id: channelId },
					data: {
					members: {
						// use the filter method to remove the user from the list
						set: channel.members.filter(member => member !== userId),
					},
				},
			});
			
			await prisma.user.update({
				where: { id: userId },
				data: {
					channels: {
						disconnect: { id: channelId },
					},
				},
			});

			res.json(updatedChannel);
		} catch (error) {
			console.error('Error deleting user from channel', error);
			res.status(500).json({ error: "Server error" });
		}
	},
	getAllMessages: async(req,res) => {
		const {channelId} = req.body;
		if (!channelId) return res.status(400).json({ error: "Failed to get the Channel ID" });
		try {
			const messages = await prisma.message.findMany({
				where: {
					channelId: channelId
				},
				select: {sender: true, text: true, channelId: true, channel: true, senderId: true, id: true}
			});
			if(messages.length <= 0) return res.json({message: "This channel doesnt have any messages"});
			res.json(messages);
		} catch (error) {
			console.error("Error in function getAllMessages", error);
			res.status(500).json({error: "Failed to get messages!"})
		}
	},
	getChannelById: async (req, res) => {
		const { id } = req.params;
	
		if (!id) return res.status(400).json({ error: "Channel ID is required" });
	
		try {
			const channel = await prisma.channel.findUnique({
				where: { id },
				select: {
					name: true,
					members: true,
					creatorId: true,
					creator: true
				}
			});
	
			if (!channel) return res.status(404).json({ error: "Channel not found" });
	
			res.json(channel);
		} catch (error) {
			console.error("Error retrieving channel by ID:", error);
			res.status(500).json({ error: "Server error" });
		}
	},
	sendMessage: async (req, res) => {
		const { channelId, text } = req.body;
		const senderId = req.user.userId;
	
		if (!channelId || !text) return res.status(400).json({ error: "Channel ID and text are required" });
	
		try {
			const channel = await prisma.channel.findUnique({where: { id: channelId }});
	
			if (!channel) return res.status(404).json({ error: "Channel not found" });
	
			const message = await prisma.message.create({
				data: {
					channelId,
					senderId,
					text,
				},
				select: {sender: true,channelId: true,
					senderId: true,
					text: true}
			});
	
			// get Socket.IO from application
			const io = req.app.get('io');
	
			// Send a message of realtime for all user
			io.to(channelId).emit('receiveMessage', {
				id: message.id,
				channelId: message.channelId,
				senderId: message.senderId,
				sender: message.sender,
				text: message.text,
				createdAt: message.createdAt,
			});
	
			res.status(201).json(message);
		} catch (error) {
			console.error('Error sending message:', error);
			res.status(500).json({ error: "Server error" });
		}
	}
}
module.exports = ChannelControllers;