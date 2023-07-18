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
      //if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return await interaction.reply('This command is currently under development and will be available soon');

      const cooldown = cooldowns.get(interaction.user.id);
      if (cooldown && cooldown > Date.now()) {
        const remainingTime = Math.ceil((cooldown - Date.now()) / 1000 / 60 / 60);
        return interaction.reply(`You have to wait ${remainingTime} more hours before using this command again.`);
      }

      const isValidUrl = async (url) => {
        try {
          const response = await fetch(url);
          return response.ok;
        } catch (error) {
          return false;
        }
      };

      const approveChannelId = '1117185592690741278';

      let channelId = null;
      let paymentType = null;

      if (interaction.options.getString('job-type') === 'hiring') {
        channelId = '1073004427893555240';
      } else if (interaction.options.getString('job-type') === 'for-hire') {
        channelId = '1073004365008343091';
      } else if (interaction.options.getString('job-type') === 'selling') {
        channelId = '1062218093377617941';
      }

      if (interaction.options.getString('payment-type') === 'upon-completion') {
        paymentType = 'Upon-Completion';
      } else if (interaction.options.getString('payment-type') === 'upfront') {
        paymentType = 'Upfront';
      } else if (interaction.options.getString('payment-type') === 'partial-upfront') {
        paymentType = 'Partial-Upfront';
      } else if (interaction.options.getString('payment-type') === 'per-task') {
        paymentType = 'Per-Task';
      }

      const modal2 = new ModalBuilder()
        .setTitle("Post Configuration")
        .setCustomId('modal2');

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
        .setRequired(false)
        .setLabel("Image URL (Portfolio, game, etc...)")
        .setStyle(TextInputStyle.Short);

      const approveButton = new ButtonBuilder()
        .setCustomId('approve_button')
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success);

      const declineButton = new ButtonBuilder()
        .setCustomId('decline_button')
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger);

      const firstActionRow = new ActionRowBuilder().addComponents(Title);
      const secondActionRow = new ActionRowBuilder().addComponents(Description);
      const thirdActionRow = new ActionRowBuilder().addComponents(Payment);
      const fourthActionRow = new ActionRowBuilder().addComponents(ImageUrl);

      modal2.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
      interaction.showModal(modal2);

      client.once('interactionCreate', async (interaction2) => {
        if (!interaction2.isModalSubmit()) return;

        if (interaction2.customId === 'modal2') {
          try {
            const title = interaction2.fields.getTextInputValue('Title');
            const description = interaction2.fields.getTextInputValue('Description');
            const payment = interaction2.fields.getTextInputValue('Payment');
            const imageUrl = interaction2.fields.getTextInputValue('ImageUrl');

            const memberInteractor = interaction2.user.id;

            const channel = await client.channels.fetch(channelId);
            const approvingChannel = await client.channels.fetch(approveChannelId);

            const user = await interaction2.guild.members.fetch(memberInteractor);

            const embed = new EmbedBuilder()
              .setAuthor({
                name: `${interaction2.user.username}`,
                iconURL: interaction2.user.displayAvatarURL({ dynamic: true }),
              })
              .setTitle(`${title}`)
              .setDescription(`\n${description}\n\n**Payment:** ${payment}\n**Payment Type:** ${paymentType}\n\n**Contact** <@${memberInteractor}>`)
              .setColor('cc33ff')
              .setTimestamp();

            if (imageUrl) {
              const isUrlValid = await isValidUrl(imageUrl);
              if (isUrlValid) {
                embed.setImage(imageUrl);
              }
            }

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

                  try {

                    interaction2.user.send({ content: `:tada: Your post was successfully approved, Congratulations! :tada:`, embeds: [embed] });
                    interaction3.reply({ content: '<a:checkmark:1106657807740186684> Post was successfully approved' });
                  } catch (error) {
                    console.log(error);
                    await interaction3.reply({ content: "<a:Xmark:1106658889656709202> An error occurred while processing your request. If this problem persists, please report it to us in <#1061732005533978684>", ephemeral: true });
                  }
                } else if (interaction3.customId === 'decline_button') {
                  interaction3.reply(`Please enter the valid reason why you are declining this post`).then(() => {
                    const filter = m => m.author.id === interaction3.user.id;
                    const collector = interaction3.channel.createMessageCollector({ filter, max: 1 });

                    collector.on('collect', collected => {
                      const reason = collected.content;
                      // Change the target user for the DM
                      client.users.cache.get(memberInteractor).send({ content: `<a:Xmark:1106658889656709202> <@${memberInteractor}> Unfortunately your post in Bloxian Devs has been declined for the following reason: \`${reason}\``, embeds: [embed] });
                      collected.react("<a:checkmark:1106657807740186684>");
                    });
                  });
                }
              } catch (error) {
                console.log(error);
                await interaction3.reply({ content: "<a:Xmark:1106658889656709202> An error occurred while processing your request. If this problem persists, please report it to us in <#1061732005533978684>", ephemeral: true });
              }
            });

            if (description.length < 100) return interaction.reply({ content: '<a:Xmark:1106658889656709202> Your post description cannot have less than 100 characters', ephemeral: true });

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
