require("dotenv/config")
const { SlashCommandBuilder, EmbedBuilder, Client, GatewayIntentBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, Events, PermissionsBitField, Embed } = require("discord.js");
const warningSchema = require("./warnSchema.js");
const EmojiCommand = require('./emojiSchema');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const cooldowns = new Map();
const suggestionMap = new Map();
const usedEmojiCommands = new Set();

client.on('ready', async () => {
  try {
    const registeredCommands = await client.application.commands.set(commands);
    console.log(`${registeredCommands.length} command(s) registered globally.`);
  } catch (e) {
    console.error(e);
  }
});

const commands = [
  new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('View the member count of Bloxian Devs'),
  new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Provide a suggestion for the server')
    .addStringOption(option => option.setName('text').setDescription("The described suggestion").setRequired(true)),
  new SlashCommandBuilder()
    .setName('create-emoji')
    .setDescription('Create an emoji for this server (Server boosters only)')
    .addAttachmentOption(option => option.setName('file').setDescription("The emoji you want to upload").setRequired(true))
    .addStringOption(option => option.setName('name').setDescription("The name of your emoji").setRequired(true)),
  new SlashCommandBuilder()
    .setName('approve-suggestion')
    .setDescription('Approve a suggestion by a member')
    .addStringOption(option => option.setName('message-id').setDescription("Message ID of the suggestion").setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription("Reason why your approving this suggestion").setRequired(true)),
  new SlashCommandBuilder()
    .setName('decline-suggestion')
    .setDescription('Decline a suggestion by a member')
    .addStringOption(option => option.setName('message-id').setDescription("Message ID of the suggestion").setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription("Reason why your declining this suggestion").setRequired(true)),
  new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Run an 8-Ball to see your future (Note this command is not real)')
    .addStringOption(option => option.setName('will-i').setDescription("Ask BDB about your future").setRequired(true)),
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option => option.setName('user').setDescription("Select the user you want to warn").setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription("The reason of this user's warn").setRequired(false)),
  new SlashCommandBuilder()
    .setName('clear-warn')
    .setDescription('Clear a warn on a user')
    .addUserOption(option => option.setName('user').setDescription("Select the user you want to clear a warn on").setRequired(true))
    .addNumberOption(option => option.setName('id').setDescription("The ID of the warning").setRequired(true)),
  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Check warnings for a user')
    .addUserOption(option => option.setName('user').setDescription("Select the user you want to see warns for").setRequired(true)),
  new SlashCommandBuilder()
    .setName('post')
    .setDescription('Post in the market')
    .addStringOption(option => option.setName('job-type').setDescription('Select job type').addChoices({ name: 'For-Hire', value: 'for-hire' }, { name: 'Hiring', value: 'hiring' }, { name: 'Selling', value: 'selling' }).setRequired(true)),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from this server')
    .addUserOption(option => option.setName('user').setDescription('Select the user you want to ban.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason of their ban.').setRequired(false)),
  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user from this server')
    .addUserOption(option => option.setName('user').setDescription('Select the user you want to unban.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason of unbanning them.').setRequired(false)),
  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Purge an amount of messages in the channel this command is ran in')
    .addNumberOption(option => option.setName('amount').setDescription('The amount of messages you want purged').setRequired(true)),
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from this server')
    .addUserOption(option => option.setName('user').setDescription('Select the user you want to kick.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason of their kick.').setRequired(false)),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Bot replies with "Pong"'),
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user in this server')
    .addUserOption(option => option.setName('target').setDescription('The user you would like to mute').setRequired(true))
    .addStringOption(option => option.setName('duration').setRequired(true).setDescription('The duration of the mute')
      .addChoices(
        { name: '60 Secs', value: '60' },
        { name: '2 Minutes', value: '120' },
        { name: '5 Minutes', value: '300' },
        { name: '10 Minutes', value: '600' },
        { name: '15 Minutes', value: '900' },
        { name: '20 Minutes', value: '1200' },
        { name: '30 Minutes', value: '1800' },
        { name: '45 Minutes', value: '2700' },
        { name: '1 Hour', value: '3600' },
        { name: '2 Hours', value: '7200' },
        { name: '3 Hours', value: '10800' },
        { name: '5 Hours', value: '18000' },
        { name: '10 Hours', value: '36000' },
        { name: '1 Day', value: '86400' },
        { name: '2 Days', value: '172800' },
        { name: '3 Days', value: '259200' },
        { name: '5 Days', value: '432000' },
        { name: 'One Week', value: '604800' }))
    .addStringOption(option => option.setName('reason').setDescription('The reason for muting the user').setRequired(true)),
  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user in this server')
    .addUserOption(option => option.setName('target').setDescription('The user you would like to unmute').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for unmuting the user').setRequired(false)),
];

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://Roblify:7ILOcermUoXt85h3@bdb-bot.egoqocq.mongodb.net/?retryWrites=true&w=majority');
mongoose.set('strictQuery', true);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("Connection Successful!");

  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'post') {
      const cooldown = cooldowns.get(interaction.user.id);
      if (cooldown && cooldown > Date.now()) {
        const remainingTime = Math.ceil((cooldown - Date.now()) / 1000 / 60 / 60);
        return interaction.reply(`You have to wait ${remainingTime} more hours before using this command again.`);
      }

      let channelId = null;

      if (interaction.options.getString('job-type') == 'hiring') {
        channelId = '1073004427893555240';
      } else if (interaction.options.getString('job-type') == 'for-hire') {
        channelId = '1073004365008343091';
      } else if (interaction.options.getString('job-type') == 'selling') {
        channelId = '1062218093377617941'
      }

      const modal2 = new ModalBuilder()
        .setTitle("Post Configuration")
        .setCustomId('modal2')

      const Title = new TextInputBuilder()
        .setCustomId("Title")
        .setRequired(true)
        .setLabel("Provide the title of your post.")
        .setStyle(TextInputStyle.Short);

      const Description = new TextInputBuilder()
        .setCustomId("Description")
        .setRequired(true)
        .setLabel("Provide the description of your post.")
        .setStyle(TextInputStyle.Paragraph);

      const Payment = new TextInputBuilder()
        .setCustomId("Payment")
        .setRequired(true)
        .setLabel("Provide the payment (Robux, USD, Other)")
        .setStyle(TextInputStyle.Short);

      const ImageUrl = new TextInputBuilder()
        .setCustomId("ImageUrl")
        .setRequired(true)
        .setLabel("Image URL (Portfolio, game, etc...)")
        .setStyle(TextInputStyle.Short);

      const firstActionRow = new ActionRowBuilder().addComponents(Title)
      const secondActionRow = new ActionRowBuilder().addComponents(Description)
      const thirdActionRow = new ActionRowBuilder().addComponents(Payment)
      const fourthActionRow = new ActionRowBuilder().addComponents(ImageUrl)

      modal2.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow)
      interaction.showModal(modal2)

      client.once(Events.InteractionCreate, async (interaction2) => {
        if (!interaction2.isModalSubmit()) return;

        if (interaction2.customId === 'modal2') {
          try {
            const Title = interaction2.fields.getTextInputValue('Title');
            const Description = interaction2.fields.getTextInputValue('Description');
            const Payment = interaction2.fields.getTextInputValue('Payment');
            const ImageUrl = interaction2.fields.getTextInputValue('ImageUrl');

            const memberInteractor = interaction2.user.id;

            const channel = await client.channels.fetch(channelId); // get the channel by ID

            const embed = new EmbedBuilder()
              .setTitle(`**Title** ${Title}`)
              .setDescription(`\n**Description:** ${Description}\n\n**Payment:** ${Payment}\n\n**Contact:** <@${memberInteractor}>`)
              .setImage(ImageUrl)
              .setColor('Purple')
              .setTimestamp();

            await channel.send({
              content: `<@${memberInteractor}>`,
              embeds: [embed]
            });

            cooldowns.set(interaction2.user.id, Date.now() + 12 * 60 * 60 * 1000); // 12 hours cooldown
            await interaction2.reply({ content: "<a:checkmark:1106657807740186684> Post was successfully submitted. Thank you for using our market, you should've been mentioned as it posted.", ephemeral: false });
          } catch (error) {
            console.log(error);
            await interaction2.reply({ content: "<a:Xmark:1106658889656709202> An error occurred while submitting your post. If this problem persists then please report it to us in <#1061732005533978684>", ephemeral: true });
          }
        }
      });
    } else if (interaction.commandName === 'ban') {
      if (interaction.replied) {
        return;
      }
      const Users = interaction.options.getUser('user');
      const ID = Users.id;
      const banUser = client.users.cache.get(ID);

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return await interaction.reply({ content: "<a:Xmark:1106658889656709202> You do not have permission to ban users", ephemeral: true })
      }

      if (interaction.member.id === ID) {
        return await interaction.reply({ content: "<a:Xmark:1106658889656709202> You cannot ban yourself!", ephemeral: true });
      }

      let reason = interaction.options.getString('reason');
      if (!reason) reason = "No reason provided.";

      const dmEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle(`Hello ${Users.username},`)
        .setDescription(`You have been banned from ${interaction.guild.name} for the following reason:\n**${reason}**\n\nIf you felt like this ban was not fair or want to be unbanned, then appeal via this link: https://dyno.gg/form/c96e9b53\n\nYours sincerely,\nBloxian Devs Moderation Team`)

      try {
        await banUser.send({ embeds: [dmEmbed] });
      } catch (err) {
        // If an error occurs while trying to send the DM, log the error to the console
        console.log(`Failed to send DM to user ${banUser.tag}: ${err}`);
      }

      // Defer the interaction before performing any further tasks
      await interaction.deferReply();

      // Attempt to ban the user
      try {
        await interaction.guild.bans.create(banUser.id, { reason });
      } catch (err) {
        return await interaction.editReply({ content: "<a:Xmark:1106658889656709202> I cannot ban this member", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("<a:checkmark:1106657807740186684> SUCCESS")
        .setDescription(`<@${banUser.id}> has been banned by <@${interaction.user.id}> for the following reason: **${reason}**`)
        .setTimestamp()

      // Send the final reply if the ban was successful
      await interaction.editReply({ embeds: [embed] });
    } else if (interaction.commandName === "warn") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return await interaction.reply({ content: "You do not have permission to warn others", ephemeral: true })

      const { options, guildId, user } = interaction;

      const target = options.getUser('user')
      const reason = options.getString("reason") || "No reason provided."

      const userTag = `${target.username}#${target.discriminator}`

      warningSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: userTag }, async (err, data) => {

        if (err) throw err;

        if (!data) {
          data = new warningSchema({
            GuildID: guildId,
            UserID: target.id,
            UserTag: userTag,
            Content: [
              {
                ExecuterId: user.id,
                ExecuterTag: user.tag,
                Reason: reason
              }
            ],
          });
        } else {
          const warnContent = {
            ExecuterId: user.id,
            ExecuterTag: user.tag,
            Reason: reason
          }
          data.Content.push(warnContent);
        }
        data.save()
      });

      const dmEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle(`Hello ${target.username},`)
        .setDescription(`You have been warned in ${interaction.guild.name} for the following reason:\n\`${reason}\`\n\nPlease be adviced if this behavior continues then bigger Moderation actions may be placed on you.\n\nYours sincerely,\nBloxian Devs Moderation Team.`)

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle(`<a:checkmark:1106657807740186684> SUCCESS`)
        .setDescription(`**Warned User:** <@${target.id}>\n**Reason:** \`${reason}\`\n**Moderator:** <@${interaction.user.id}>`)

      target.send({ embeds: [dmEmbed] }).catch(err => {
        return;
      });

      interaction.reply({ embeds: [embed] })

    } else if (interaction.commandName === "warnings") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return await interaction.reply({ content: "You do not have permission to warn others", ephemeral: true })

      const { options, guildId, user } = interaction;

      const target = options.getUser('user')

      const embed = new EmbedBuilder()
      const noWarns = new EmbedBuilder

      warningSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: target.tag }, async (err, data) => {

        if (err) throw err;

        if (data) {
          embed.setColor("Red")
            .setDescription(`${target.tag}'s warnings: \n${data.Content.map(
              (w, i) =>
                `
                  **Warning:** ${i + 1}
                  **Moderator:** ${w.ExecuterTag}
                  **Reason:** ${w.Reason}
              `
            ).join(`-`)}`)

          interaction.reply({ embeds: [embed] });
        } else {
          noWarns.setColor("Red")
            .setDescription(`${target.tag} has no warnings`)

          interaction.reply({ embeds: [noWarns] })
        }
      });

    } else if (interaction.commandName === "clear-warn") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return await interaction.reply({ content: "You do not have permission to clear peoples warnings", ephemeral: true });
      }
    
      const { options, guildId, user } = interaction;
      const target = options.getUser('user');
      const warningIndex = options.getNumber('id'); // Get the warning ID (index) from the options
    
      const embed = new EmbedBuilder();
    
      try {
        // Retrieve all warnings for the user
        const data = await warningSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: target.tag });
    
        if (data && data.Content.length > 0 && data.Content.length > warningIndex - 1) {
          // Remove the warning with the specified ID (index) from the Content array
          data.Content.splice(warningIndex - 1, 1);
    
          // Save the updated data back to the database
          await data.save();
    
          embed.setColor("Green")
            .setTitle("<a:checkmark:1106657807740186684> SUCCESS")
            .setDescription(`Warning with ID ${warningIndex} for ${target.tag} has been cleared`); // Update the success message
    
          interaction.reply({ embeds: [embed] });
        } else {
          interaction.reply({ content: `${target.tag} has no warning with ID ${warningIndex} to be cleared`, ephemeral: true });
        }
      } catch (err) {
        throw err;
      }
    } else if (interaction.commandName === "unban") {

      const userID = interaction.options.getUser('user');

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return await interaction.reply({ content: "<a:Xmark:1106658889656709202> You do not have permission to unban users", ephemeral: true })
      }

      if (interaction.member.id === userID) {
        return await interaction.reply({ content: "<a:Xmark:1106658889656709202> You cannot unban yourself!", ephemeral: true });
      }

      let reason = interaction.options.getString('reason');
      if (!reason) reason = "No reason provided.";

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("<a:checkmark:1106657807740186684> SUCCESS")
        .setDescription(`${userID} has been unbanned by <@${interaction.user.id}> for the following reason: **${reason}**`)
        .setTimestamp()

      await interaction.guild.bans.fetch()
        .then(async bans => {

          if (bans.size == 0) return await interaction.reply({ content: "<a:Xmark:1106658889656709202> There is no one banned from this server", ephemeral: true })
          let bannedID = bans.find(ban => ban.user.id == userID);
          if (!bannedID) return await interaction.reply({ content: "<a:Xmark:1106658889656709202> The ID stated is not banned from this server", ephemeral: true })

          await interaction.guild.bans.remove(userID, reason).catch(err => {
            return interaction.reply({ content: "<a:Xmark:1106658889656709202> I cannot unban this user" })
          })
        })

      await interaction.reply({ embeds: [embed] });
    } else if (interaction.commandName === "mute") {
      const timeUser = interaction.options.getUser('target');
      const timeMember = await interaction.guild.members.fetch(timeUser.id);
      const channel = interaction.channel;
      const duration = interaction.options.getString('duration');
      const user = interaction.options.getUser('user') || interaction.user;

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) return interaction.reply({ content: "<a:Xmark:1106658889656709202> You do not have permission to run this command", ephemeral: true })
      if (!timeMember) return await interaction.reply({ content: '<a:Xmark:1106658889656709202> The user mentioned is no longer within the server.', ephemeral: true })
      if (!timeMember.kickable) return interaction.reply({ content: '<a:Xmark:1106658889656709202> I cannot mute this user!', ephemeral: true })
      if (!duration) return interaction.reply({ content: '<a:Xmark:1106658889656709202> You must set a valid duration for the timeout', ephemeral: true })
      if (interaction.member.id === timeMember.id) return interaction.reply({ content: "<a:Xmark:1106658889656709202> You cannot timeout yourself!", ephemeral: true })
      if (timeMember.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "<a:Xmark:1106658889656709202> You cannot timeout staff members or people with the Administrator permission!", ephemeral: true })

      let reason = interaction.options.getString('reason');
      if (!reason) reason = "No reason provided."

      await timeMember.timeout(duration * 1000, reason)

      const minEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle(`<a:checkmark:1106657807740186684> SUCCESS`)
        .setDescription(`<@${timeMember.id}> has been muted for **${duration / 60}** minute(s) for the following reason:\n**${reason}**`)
        .setFooter({ text: `User: ${user.tag}` })
        .setTimestamp()


      const dmEmbed = new EmbedBuilder()
        .setTitle(`Hello ${timeMember.user.username}`)
        .setDescription(`You have been muted in ${interaction.guild.name} for **${duration / 60}** minute(s) for the following reason:\n**${reason}**\n\nIf you felt like this mute was not fair or want to be unmuted, then appeal via this link: https://dyno.gg/form/c96e9b53\n\nYours sincerely,\nBloxian Devs Moderation Team`)
        .setColor('DarkRed')
        .setTimestamp()

      await timeMember.send({ embeds: [dmEmbed] }).catch(err => {
        return;
      })

      await interaction.reply({ embeds: [minEmbed] })

    } if (interaction.commandName === "unmute") {
      const timeUser = interaction.options.getUser('target');
      const timeMember = await interaction.guild.members.fetch(timeUser.id);
      const user = interaction.options.getUser('user') || interaction.user;

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return interaction.reply({ content: "You do not have permission to run this command", ephemeral: true })
      if (!timeMember.kickable) return interaction.reply({ content: 'I cannot timeout this user! This is either because their higher then me or you.', ephemeral: true })
      if (interaction.member.id === timeMember.id) return interaction.reply({ content: "You cannot timeout yourself!", ephemeral: true })

      let reason = interaction.options.getString('reason');
      if (!reason) reason = "No reason given."

      await timeMember.timeout(null, reason)

      const unminEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle(`<a:checkmark:1106657807740186684> SUCCESS`)
        .setDescription(`<@${timeMember.id}> has been unmuted for the following reason:\n**${reason}**`)
        .setFooter({ text: `User: ${user.tag}` })
        .setTimestamp();


      const dmEmbed = new EmbedBuilder()
        .setTitle(`Hello ${timeMember.user.username}`)
        .setDescription(`You have been unmuted in ${interaction.guild.name} for the following reason:\n**${reason}**\n\nYours sincerely,\n${interaction.guild.name} Moderation Team`)
        .setColor('DarkGreen')
        .setTimestamp();


      await timeMember.send({ embeds: [dmEmbed] }).catch(err => {
        return;
      })

      await interaction.reply({ embeds: [unminEmbed] })
    } else if (interaction.commandName === "suggest") {
      const suggestText = interaction.options.getString("text");
      const suggestionChannelId = '1109013349582254120';
      const suggestChannel = client.channels.cache.find(channel => channel.id === suggestionChannelId);
    
      const embed = new EmbedBuilder()
        .setColor("Yellow")
        .setTitle(`Suggestion from ${interaction.user.tag}`)
        .setDescription(`${suggestText}`)
        .setTimestamp();
    
      interaction.reply(`Before this is posted, are you sure you want to suggest:\n\`\`\`\n${suggestText}\n\`\`\`\n(Either reply with "Yes" or "No")`)
        .then(() => {
          const filter = m => m.author.id === interaction.user.id;
          const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 15000 });
    
          collector.on('collect', collected => {
            const confirmation = collected.content.toLowerCase();
            if (confirmation === 'yes') {
              suggestChannel.send({ embeds: [embed] })
                .then(sentMessage => {
                  sentMessage.react("⬆");
                  sentMessage.react("⬇");
                  sentMessage.startThread({
                    name: `${interaction.user.username}'s suggestion discussion`, // Replace with desired thread name
                  })
                    .then(thread => {
                      thread.members.add(interaction.user.id); // Add the interaction user to the thread
    
                      // Store the suggestion information in the map
                      suggestionMap.set(sentMessage.id, {
                        suggestText: suggestText,
                        suggestionChannelId: suggestionChannelId,
                        threadId: thread.id
                      });
    
                      console.log(`Thread created: ${thread.name} (${thread.id})`);
                      interaction.followUp(`<a:checkmark:1106657807740186684> Suggestion successfully created in <#${suggestionChannelId}>`);
                    })
                    .catch(console.error);
                })
                .catch(console.error);
            } else {
              interaction.followUp("<a:Xmark:1106658889656709202> Suggestion canceled.");
            }
          });
    
          collector.on('end', () => {
            if (collector.collected.size === 0) {
              interaction.followUp("<a:Xmark:1106658889656709202> No response received. Suggestion canceled.");
            }
          });
        })
        .catch(console.error);
    } else if (interaction.commandName === "approve-suggestion") {
      // Check if the user is an administrator
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return await interaction.reply({ content: "You do not have permission to approve suggestions", ephemeral: true })

  
      // Get the message ID and reason string options
      const messageId = interaction.options.getString("message-id");
      const reason = interaction.options.getString("reason");
    
      // Find the original suggestion message
      const suggestionChannelId = '1109013349582254120';
      const suggestionChannel = client.channels.cache.find(channel => channel.id === suggestionChannelId);
      const originalMessage = await suggestionChannel.messages.fetch(messageId);

      if (originalMessage.thread) {
        await originalMessage.thread.setLocked(true);
      }

      const originalEmbed = originalMessage.embeds[0];
    
      // Create a new MessageEmbed with a green color and the "Approved by <Approver>\n<Reason>" message
      const newEmbed = new EmbedBuilder(originalMessage.embeds[0])
        .setColor("Green")
        .setTitle(`${originalEmbed.title} (Approved)`)
        .setDescription(`${originalEmbed.description}\n**${interaction.user.tag} responded:**\n${reason}`);
    
      // Edit the original message with the new MessageEmbed
      originalMessage.edit({ embeds: [newEmbed] });

      interaction.reply({ content: "Suggestion was successfully approved", ephemeral: true})
    } else if (interaction.commandName === "decline-suggestion") {
      // Check if the user is an administrator
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return await interaction.reply({ content: "You do not have permission to approve suggestions", ephemeral: true })

    
      // Get the message ID and reason string options
      const messageId = interaction.options.getString("message-id");
      const reason = interaction.options.getString("reason");
    
      // Find the original suggestion message
      const suggestionChannelId = '1109013349582254120';
      const suggestionChannel = client.channels.cache.find(channel => channel.id === suggestionChannelId);
      const originalMessage = await suggestionChannel.messages.fetch(messageId);

      if (originalMessage.thread) {
        await originalMessage.thread.setLocked(true);
      }

      const originalEmbed = originalMessage.embeds[0];
    
      // Create a new MessageEmbed with a green color and the "Approved by <Approver>\n<Reason>" message
      const newEmbed = new EmbedBuilder(originalMessage.embeds[0])
        .setColor("Red")
        .setTitle(`${originalEmbed.title} (Declined)`)
        .setDescription(`${originalEmbed.description}\n**${interaction.user.tag} responded:**\n${reason}`);
    
      // Edit the original message with the new MessageEmbed
      originalMessage.edit({ embeds: [newEmbed] });

      interaction.reply({ content: "Suggestion was successfully declined", ephemeral: true})
    } else if (interaction.commandName === "create-emoji") {
      const userId = interaction.member.user.id;
      const roleId = "1062214729680031754";
    
      if (!interaction.member.roles.cache.has(roleId)) {
        return interaction.reply("You need to boost this server in order to upload one custom emoji!");
      }
    
      const emojiFile = interaction.options.getAttachment("file");
      const emojiName = interaction.options.getString("name");
    
      await interaction.deferReply({ content: '<a:loading:1109988466613293076> Uploading your emoji...' });
    
      if (emojiFile.size > 256 * 1024) {
        return interaction.editReply("<a:Xmark:1106658889656709202> The emoji file size exceeds the limit of 256KB.");
      }
    
      // Check if the user has already used the command
      const user = await EmojiCommand.findOne({ userId });
    
      if (user && user.usedCommand) {
        return interaction.editReply("You can only use this command once.");
      }
    
      // ...
    
      const emoji = await interaction.guild.emojis.create({ attachment: `${emojiFile.attachment}`, name: `${emojiName}` }).catch(err => {
        setTimeout(() => {
          console.log(err);
          interaction.editReply({ content: `${err.rawError.message}` });
        }, 2000);
      });
    
      setTimeout(async () => {
        if (!emoji) return;
    
        const embed = new EmbedBuilder()
          .setColor("Green")
          .setDescription(`<a:checkmark:1106657807740186684> Your emoji was successfully created ${emoji}`);
    
        interaction.editReply({ content: ``, embeds: [embed] });
    
        // Mark the command as used for the user
        if (user) {
          user.usedCommand = true;
          await user.save();
        } else {
          await EmojiCommand.create({ userId, usedCommand: true });
        }
      }, 3000);
    } else if (interaction.commandName === 'purge') {
      const amount = interaction.options.getNumber('amount');

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return interaction.reply({ content: "<a:Xmark:1106658889656709202> You do not have permission to purge messages", ephemeral: true })

      if (amount > 100) {
        return interaction.reply('<a:Xmark:1106658889656709202> The purge amount cannot exceed 100');
      }
      
      if (amount <= 0) {
        return interaction.reply('<a:Xmark:1106658889656709202> The purge amount must be at least 1')
      }

      interaction.channel.messages
        .fetch({ limit: amount + 1 })
        .then((messages) => {
          interaction.channel.bulkDelete(messages);
          interaction.reply(`<a:checkmark:1106657807740186684> Successfully purged **${amount} messages**`);
        })
        .catch((error) => {
          console.error('Failed to purge messages:', error);
          interaction.reply('<a:Xmark:1106658889656709202> Failed to purge messages');
        });
    } else if (interaction.commandName === 'ping') {
      const startTime = Date.now();
      interaction.reply('Pong!').then(() => {
        const endTime = Date.now();
        const pingTime = endTime - startTime;
        interaction.editReply(`Pong! Response time: \`${pingTime}ms\``);
      });
    } else if (interaction.commandName === 'kick') {
      const kickUser = interaction.options.getUser('user');
      const kickMember = await interaction.guild.members.fetch(kickUser.id);
      const channel = interaction.channel;

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return await interaction.reply({ content: "<a:Xmark:1106658889656709202> You do not have permission to kick users", ephemeral: true })
      }

      if (kickUser.id === interaction.user.id) {
        return await interaction.reply({ content: "<a:Xmark:1106658889656709202> You cannot kick yourself!" })
      }

      if (!kickMember.kickable) return await interaction.reply({ content: "<a:Xmark:1106658889656709202> I cannot kick this user" })

      let reason = interaction.options.getString('reason');
      if (!reason) reason = "No reason provided.";

      const dmEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle(`Hello ${kickMember.user.username},`)
        .setDescription(`You have been kicked from Bloxian Devs for the following reason:\n**${reason}**\n\nYours sincerely,\nBloxian Devs Moderation Team.`)


      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("<a:checkmark:1106657807740186684> SUCCESS")
        .setDescription(`${kickMember} has been kicked by <@${interaction.user.id}> for the following reason:\n**${reason}**`)

      await kickMember.send({ embeds: [dmEmbed] }).catch(err => {
        return;
      });

      await kickMember.kick({ reason: reason }).catch(err => {
        interaction.reply({ content: "<a:Xmark:1106658889656709202> There was an error kicking this user", ephemeral: true });
      });

      await interaction.reply({ embeds: [embed] });

    } else if (interaction.commandName === 'membercount') {
      const embed = new EmbedBuilder()
      .setColor("Purple")
      .setTitle('Members')
      .setDescription(`${interaction.guild.memberCount}`)
      .setTimestamp()

      interaction.reply({ embeds: [embed] })
    } else if (interaction.commandName === '8ball') {
      const answers = ["Yes", "No"];

      const prompt = interaction.options.getString('will-i');

      if (prompt.length < 10) return await interaction.reply({ content: 'Your question must have more than 10 characters', ephemeral: true});

      const answer = answers[Math.floor(Math.random() * answers.length)]

      interaction.reply(`**Will I:** \`${prompt}\`\n\nAnswer: ${answer}`);
    }
  });
});

client.login(process.env.TOKEN);