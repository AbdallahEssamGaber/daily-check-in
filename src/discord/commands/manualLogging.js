const { SlashCommandBuilder, ActionRowBuilder } = require("discord.js");

const { newModal, newInput } = require("../utils/components/modalBuilder.js");

const {
  tags,
  fetchTasksUsers,
  fetchCheckIns,
  deleteHighlighting,
  addType,
  logTask,
} = require("../../notion");

const parseTime = require("../../functions/general/parseTime.js");

let tasks;
let checkIns;
(async () => {
  tasks = await fetchTasksUsers();
  checkIns = await fetchCheckIns();
  setInterval(async () => {
    tasks = await fetchTasksUsers();
    checkIns = await fetchCheckIns();
  }, 3000);
})();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("manual-logging")
    .setDescription("Manually time logging")
    .addStringOption((option) =>
      option
        .setName("task")
        .setDescription(
          "Choose the name of the task you want to log or create a new one."
        )
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("tag")
        .setDescription("Choose the type of the task you want to add.")
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("start-time")
        .setDescription("the start time of your log.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("end-time")
        .setDescription("the end time of your log.")
        .setRequired(true)
    ),
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices;
    if (focusedOption.name === "tag") choices = tags;
    else if (focusedOption.name === "task") {
      const { globalName } = interaction.user;
      if (tasks[globalName] !== undefined) {
        choices = tasks[globalName];
      } else {
        choices = ["ADD A TASK FIRST."];
      }
    }

    const filtered = choices.filter((choice) =>
      choice.startsWith(focusedOption.value)
    );
    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice }))
    );
    deleteHighlighting();
  },
  async execute(interaction) {
    const user = interaction.user;
    const chose = interaction.options.getString("task");
    const taskTag = interaction.options.getString("tag");
    let startTime = interaction.options.getString("start-time");
    let endTime = interaction.options.getString("end-time");
    let info = {
      taskName: chose,
      userId: user.id,
      name: user.globalName,
      username: user.username,
      taskTag,
    };
    if (!checkIns.includes(info.name)) {
      return interaction.reply({
        content: "Please check in first.",
        ephemeral: true,
      });
    }
    if (chose === "ADD A TASK FIRST.") {
      return interaction.reply({
        content: "ADD A TASK FIRST.",
        ephemeral: true,
      });
    } else if (tasks[info.name].includes(chose)) {
      //check if the time inputted in right. and convert em before sending
      //check if it's 12-hours system with "pm" or "am" at the end.
      const re = new RegExp("^((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))$");
      if (!re.test(startTime) || !re.test(endTime)) {
        deleteHighlighting();
        await interaction.reply({
          content:
            "**Please Type time in the 12 hour format with `AM` or `PM` at the end. `/manual-logging` again plz**",
          ephemeral: true,
        });

        return;
      }

      startTime = parseTime(startTime);
      endTime = parseTime(endTime);
      if (endTime <= startTime) {
        deleteHighlighting();
        await interaction.reply({
          content:
            "**Start time should be before End time. `/manual-logging` again plz**",
          ephemeral: true,
        });

        return;
      }
      await interaction.reply({
        content: "Your submission was received successfully!",
        ephemeral: true,
      });

      info = { ...info, startTime, endTime };
      await addType(info);
      await logTask(info);
    }

    //TODO: if it's any thing else (not new task or not from choices) create this as a task
  },
};
