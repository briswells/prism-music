const { SlashCommandBuilder, PermissionsBitField, ConnectionVisibility} = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const main = require('../index.js');
const { key } = require("../config.json");
const fs = require("fs");
const path = require("path");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dc')
		.setDescription('disconnects bot'),
	async execute(interaction) {
		const voiceChannel = interaction.member?.voice.channel;
		var connection;
		try {
			connection = getVoiceConnection(voiceChannel.guild.id);
		} catch (error) {
			return await interaction.reply(`Bot isn't connected`);
		}
		this.file_cleanup();
		main.queue.delete(interaction.guildId);
		connection.destroy();
		return await interaction.reply(`Bot Successfully DCed`);
	},
	file_cleanup : function () {
	const directory = "./downloads";
	fs.readdir(directory, (err, files) => {
		if (err) throw err;
	  
		for (const file of files) {
		  fs.unlink(path.join(directory, file), (err) => {
			if (err) throw err;
		  });
		}
	  });
	},
};
