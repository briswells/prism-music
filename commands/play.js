const { SlashCommandBuilder, PermissionsBitField, ConnectionVisibility} = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, createReadStream,  NoSubscriberBehavior, AudioPlayerStatus  } = require("@discordjs/voice");
const main = require('../index.js');
const FFmpeg = require('ffmpeg');
const ytdl = require("ytdl-core");
const youtubesearchapi = require("youtube-search-api");
const { key } = require("../config.json");
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

async function download(song) {
    await new Promise((resolve) => { // wait
        ytdl(song.url, {filter: 'audioonly'})
        .pipe(fs.createWriteStream(song.file))
        .on('close', () => {
          resolve(); // finish
        })
      })
  }

const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
        maxMissedFrames: 2,
    },
    });
    
module.exports = {
  player,
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('plays a song')
        .addStringOption(option =>
            option.setName('song')
            .setDescription('The song you want to play')),
	async execute(interaction) {
        await interaction.deferReply();
        const voiceChannel = interaction.member?.voice.channel;
        if (!voiceChannel)
        return await  interaction.followUp({
             content: 'You need to be in a voice channel to play music!', 
             ephemeral: true }
        );
        const songString = interaction.options.getString('song');
        const serverQueue = main.queue.get(interaction.guildId);
        if (!main.bitPermissions.has(PermissionsBitField.Flags.Speak) || !main.bitPermissions.has(PermissionsBitField.Flags.Connect)) {
            return await  interaction.followUp({
                content: "I need the permissions to join and speak in your voice channel!",
                ephemeral: true
            });
        }
        var song;
        await youtubesearchapi.GetListByKeyword(songString,[0],[1]).then(function(result) {
            song = {
                title: result.items[0].title,
                url: "https://www.youtube.com/watch?v=" +  result.items[0].id,
                id: result.items[0].id,
                file: "./downloads/" + uuidv4() + '.mp3'
            }
         });
        
        if (!serverQueue) {
        const voiceChannel = interaction.member?.voice.channel;
        const serverQueue = {
            textChannel: interaction.channelId,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        console.log("settinging queue")
        main.queue.set(interaction.guildId, serverQueue);
        console.log("queue set")
        serverQueue.songs.push(song);
        await download(song);
        if (!voiceChannel) {
          return interaction.followUp('Please join a voice channel to use this command.');
        }
      
        try {
          const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
          });
      
          
        connection.on('stateChange', (oldState, newState) => {
          if (newState.status === "connecting") {
            console.log(`Disconnected from ${voiceChannel.name} ${newState.status} ${oldState.status}!`);
          }
        });
        this.play(serverQueue);
        this.player.on(AudioPlayerStatus.Idle, () => {
          this.song_shift(serverQueue, 0);
          console.log("shifted song")
          console.log(serverQueue.songs[0])
          if (serverQueue.songs.length == 0) {
            main.queue.delete(interaction.guildId);
            connection.destroy();
          }
          else {
            this.play(serverQueue);
            const channel = main.client.channels.cache.get(serverQueue.textChannel);
            channel.send(`Started playing: **${serverQueue.songs[0].title}**`);
        }
        });
        connection.subscribe(this.player);
        await interaction.editReply(`Now playing ${serverQueue.songs[0].title} in ${voiceChannel.name}!`);
    } catch (error) {
        console.error(error);
        await interaction.followUp('Failed to join voice channel or play audio.');
    }
        } else {
        serverQueue.songs.push(song);
        await interaction.followUp(`Adding ${song.title} to queue!`);
        await download(song);
        }
	},
  play : async function play(serverQueue) {
    const audioResource = createAudioResource(fs.createReadStream(serverQueue.songs[0].file), {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
        });
        this.player.play(audioResource);
  },
  song_shift : function(serverQueue, index) {
    index = index || 0;
    fs.unlink(serverQueue.songs[index].file, (err) => {
        if (err) {
            throw err;
        }
    })
    serverQueue.songs.shift();
    }
};
