const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder} = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const main = require('../index.js');
const { key } = require("../config.json");
const fs = require("fs");
const path = require("path");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Displays the current queue'),
	async execute(interaction) {
        const voiceChannel = interaction.member?.voice.channel;
        await interaction.deferReply();
        try {
			connection = getVoiceConnection(voiceChannel.guild.id);
		} catch (error) {
			return await interaction.followUp(`Bot isn't connected`);
		}
        await interaction.followUp({ content: '', embeds: [this.generate_queue(interaction)] });
	},
    generate_queue : function (interaction) {
        const serverQueue = main.queue.get(interaction.guildId);
        const embed_values = [];
        embed_values.push(
            {
                name:  "Playing. ", 
                value: serverQueue.songs[0].title,
            }
        );
        for (let index = 1; index < serverQueue.songs.length; index++) {
            embed_values.push(
                {
                    name:  index.toString() + ".", 
                    value: serverQueue.songs[index].title,
                }
            );
            
        }
        const queue = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Music Queue')
            .setDescription('Current Queue:')
            .addFields(
                embed_values
            )
            .setTimestamp();
        return queue;
    },
};