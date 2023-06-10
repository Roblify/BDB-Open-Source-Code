require("dotenv/config")
const { SlashCommandBuilder, EmbedBuilder, Client, GatewayIntentBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, Events, PermissionsBitField, Embed } = require("discord.js");

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
    } 
});

client.login(process.env.TOKEN);
