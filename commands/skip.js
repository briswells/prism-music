const { SlashCommandBuilder, PermissionsBitField, ConnectionVisibility} = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const main = require('../index.js');
const play = require('./play.js');
const dc = require('./dc.js');
const { key } = require("../config.json");
const fs = require("fs");
const path = require("path");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips song'),
	async execute(interaction) {
		const directory = "./downloads";
		const serverQueue = main.queue.get(interaction.guildId);
		await interaction.deferReply();
        const voiceChannel = interaction.member?.voice.channel;
        if (!voiceChannel)
        return await  interaction.followUp({
             content: 'You need to be in a voice channel to skip songs', 
             ephemeral: true }
        );
		var connection;
		try {
			 connection = getVoiceConnection(voiceChannel.guild.id);
		} catch (error) {
			return await interaction.followUp(`Bot isn't connected`);
		}
		if( serverQueue.songs.length == 0 ) {
			return await interaction.followUp(`No songs in queue to skip`);
		}
		play.song_shift(serverQueue);
		interaction.followUp(`**Song Skipped**`);
        if (serverQueue.songs.length > 0) {
			play.play(serverQueue);
            interaction.followUp(`Started playing: **${serverQueue.songs[0].title}**`);
         }
		 else {
			interaction.followUp(`No more songs in queue, gooodbye`);
		 }
	},
};
