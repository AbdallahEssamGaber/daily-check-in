module.exports = {
  data: {
    name: "addTime",
  },
  async execute(interaction, client) {
    await interaction.reply({
      content: "https://google.com",
    });
  },
};
