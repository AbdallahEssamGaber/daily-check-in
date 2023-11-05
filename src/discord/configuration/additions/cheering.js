const Tasks = require("../../../schemas/task");
const { EmbedBuilder } = require("discord.js");

const cron = require("cron");
const { format } = require("date-fns");
let dailyCounter = {};

module.exports = async (client) => {
  //everyday at 21(9pm) but Fri
  const dailyScheduledMessage = new cron.CronJob("0 0 21 * * 0-4", async () => {
    const date = format(new Date(), "yyyy-MM-dd");
    const guild = client.guilds.cache.get(process.env.GUILD_ID);

    let res = await guild.members.fetch();
    res = res.filter((member) => !member.user.bot);

    res.forEach(async (member) => {
      const userId = member.user.id;
      const allTasksNumber = await Tasks.find({
        created_time: date,
        discord_userId: userId,
      }).count();
      const allDoneTasksNumber = await Tasks.find({
        created_time: date,
        discord_userId: userId,
        done: true,
      }).count();

      if (allTasksNumber == allDoneTasksNumber) {
        member.user.send("Yaaaaaaay finished all today's tasks.");
        if (dailyCounter[userId] !== undefined) {
          dailyCounter[userId] += dailyCounter[userId];
        } else {
          dailyCounter[userId] = 0;
        }
      }
    });
  });

  //Only Fridays at 9pm
  const weeklyScheduledMessage = new cron.CronJob("0 0 21 * * 5", async () => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const channel = guild.channels.cache;
    const foundChannel = undefined;
    for (const item of channel.values()) {
      if (item.id == process.env.CONGRATS_DISCORD_CHANNEL_ID) {
        foundChannel = channel.get(item.id);
        console.log("Found the cheering channel!");
        break;
      }
    }
    if (!foundChannel) {
      console.log("DIDN'T FIND A CHANNEL.");
      return;
    }
    let res = await guild.members.fetch();

    res = res.filter((member) => !member.user.bot);
    res.forEach(async (member) => {
      const userId = member.user.id;
      const userName = member.user.globalName;
      const avatar = member.user.avatar;
      // if (dailyCounter[userId] == 6) {
      console.log(member);
      const weeklyEmbed = new EmbedBuilder()
        .setColor("#57F287")
        .setTitle("Weekly Finishherrrr!")
        .setAuthor({
          name: userName,
          iconURL: `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`,
        })
        .setDescription(
          `Yo everyone, Your lovely worker ${userName} finished all the the tasks *for a week streak*....let's hear it up for him.`
        );

      channel.send({ embeds: [weeklyEmbed] });
    });
  });
  // When you want to start it, use:
  dailyScheduledMessage.start();
  weeklyScheduledMessage.start();
};
