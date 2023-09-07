const { loadAllPositions } = require("./db/loadPositionDataDB.js");
const { notify } = require("./utils/notifer.js");
const logger = require("./utils/logger.js");
const { userSaveNewPosition } = require("./db/savePositionDataDB.js");

const init = async () => {
  // await addNewPositionTemp();

  console.log("init1");
  const positions = (await loadAllPositions()).map((position) => {
    return {
      id: position.id,
      chain: position.chainId,
    };
  });

  if (positions.length === 0) {
    logger.error("No positions found in DB");
    process.exit(0);
  }

  logger.info(`Found ${positions.length} positions`, positions);
  logger.info("init", "done");

  await notify(
    `UniApp Bot is up and running on ${positions.length} positions`,
    "🤖🦄 Startup 🤖🦄"
  );
  return positions;
};

const addNewPositionTemp = async () => {
  array = [
    [
      { id: 795484, chain: 42161 },
      "0x3f040e3300be131dbe7ce228f21f26ddc28271c53b4a2ae590142669fce45b0e",
    ],
    [{ id: 482139, chain: 1 }],
  ];

  for (let i = 0; i < array.length; i++) {
    await userSaveNewPosition(array[i][0], array[i][1]);
  }
};

module.exports = { init, addNewPositionTemp };
