// All rights reserved. Do not steal the code from the open source repository.

require("dotenv/config")
const { SlashCommandBuilder, EmbedBuilder, Client, GatewayIntentBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, Events } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const cooldowns = new Map();

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
    .setName('post')
    .setDescription('Post in the market')
    .addStringOption(option => option.setName('job-type').setDescription('Select job type').addChoices({ name: 'For-Hire', value: 'for-hire' }, { name: 'Hiring', value: 'hiring' }, { name: 'Selling', value: 'selling' }).setRequired(true)),
];

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
            await approvingChannel.send({
              content: `<@${memberInteractor}>'s post\n\nBefore approving this, make sure this post has the proper grammar, details, payment, and more... If the post passes all of these then you may approve it`,
              embeds: [embed],
              components: [{ type: 1, components: [approveButton, declineButton] }]
            });
  
client.on('interactionCreate', async (interaction3) => {
              if (!interaction3.isButton()) return;

              try {
                if (interaction3.customId === 'approve_button') {
                  embed.setFooter({ text: `Approved by: ${interaction3.user.username}` });

                  const channel = await client.channels.fetch(channelId);
                  const postedMessage = await channel.send({ content: `<@${memberInteractor}>`, embeds: [embed] });

                  // Store the post information in a database or file for future reference

                  const expirationDate = new Date();
                  expirationDate.setDate(expirationDate.getDate() + 14); // Set the expiration date to 14 days from now
client.on('interactionCreate', async (interaction3) => {
  if (!interaction3.isButton()) return;

  try {
    if (interaction3.customId === 'approve_button') {
      embed.setFooter({ text: `Approved by: ${interaction3.user.username}` });

      const channel = await client.channels.fetch(channelId);
      const postedMessage = await channel.send({ content: `<@${memberInteractor}>`, embeds: [embed] });

      // Store the post information in a database or file for future reference

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 14); // Set the expiration date to 14 days from now

      try {
        const expiredPost = new ExpiredPost({
          postId: postedMessage.id, // Use the posted message ID as the post ID or a unique identifier
          expirationDate,
        });
        await expiredPost.save();

        interaction2.user.send({ content: `:tada: Your post was successfully approved, Congratulations! :tada:`, embeds: [embed] });
        interaction3.reply({ content: '<a:checkmark:1106657807740186684> Post was successfully approved' });
      } catch (error) {
        console.log(error);
        await interaction3.reply({ content: "<a:Xmark:1106658889656709202> An error occurred while processing your request. If this problem persists, please report it to us in <#1061732005533978684>", ephemeral: true });
      }

      // Schedule the deletion of the post after 14 days
      const expirationTimeout = setTimeout(async () => {
        // Retrieve the post information from the database using the postId
        const expiredPost = await ExpiredPost.findOne({ postId: postedMessage.id });

        if (expiredPost) {
          // Delete the post from the marketChannel
          await postedMessage.delete();

          // Remove the expired post document from the database
          await expiredPost.remove();

          await interaction2.user.send({
            content: `Your post with the id being: \`${expiredPost.postId}\` has been deleted from our market, as its been in there for 14 days (2 weeks).`,
            embeds: [embed],
          });
        }
      }, expirationDate - Date.now());

      // Store the expiration timeout in the database or file
      const expirationTimeoutData = {
        postId: postedMessage.id,
        expirationTimeoutId: expirationTimeout,
      };
      await ExpiredPost.findOneAndUpdate({ postId: postedMessage.id }, { expirationTimeoutData }, { upsert: true });
    } else if (interaction3.customId === 'decline_button') {
      interaction3.reply(`Please enter the valid reason why you are declining this post`).then(() => {
        const filter = m => m.author.id === interaction3.user.id;
        const collector = interaction3.channel.createMessageCollector({ filter, max: 1 });

        collector.on('collect', collected => {
          const reason = collected.content;
          interaction2.user.send({ content: `<a:Xmark:1106658889656709202> <@${memberInteractor}> Unfortunately your post in Bloxian Devs has been declined for the following reason: \`${reason}\``, embeds: [embed] });
        });
      });
    }
  } catch (error) {
    console.log(error);
    await interaction3.reply({ content: "<a:Xmark:1106658889656709202> An error occurred while processing your request. If this problem persists, please report it to us in <#1061732005533978684>", ephemeral: true });
  }
});

            cooldowns.set(interaction2.user.id, Date.now() + 12 * 60 * 60 * 1000); // 12 hours cooldown
            await interaction2.reply({ content: "<a:checkmark:1106657807740186684> Post was successfully submitted. Please wait patiently while our staff approves it.", ephemeral: false });
          } catch (error) {
            console.log(error);
            await interaction2.reply({ content: "<a:Xmark:1106658889656709202> An error occurred while submitting your post. If this problem persists, please report it to us in <#1061732005533978684>", ephemeral: true });
          }
        }
      });
    }
});

// All rights reserved. Do not steal the code from the open source repository.
