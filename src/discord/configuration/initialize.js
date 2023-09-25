const Bot = require("./bot");
const deployCommands = require("./handlers/deploy-commands");
const mountListeners = require("./handlers/mount-listener");
const handleComponents = require("./handlers/handleComponents");
// const { reminderInterval } = require("./../../interval");
const loadFiles = require("./../../functions/fileLoader");

module.exports = async () => {
  while (!Bot.initialized) {
    //Retry until bot mounts. Can sometimes take several seconds in development
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const commandFiles = await loadFiles("commands");
  const eventsFiles = await loadFiles("events");
  const responsesFiles = await loadFiles("utils/responses");
  await deployCommands(Bot.client, commandFiles);
  // reminderInterval();
  //Start the listeners
  await mountListeners(Bot.client, eventsFiles);

  await handleComponents(Bot.client, responsesFiles);

  await Bot.client.login(process.env.BOT_TOKEN);
};
