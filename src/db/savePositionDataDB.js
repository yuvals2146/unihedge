const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger.js");
const {
  retriveInitalPositionData,
} = require("../blockchain/getPostionData.js");
const { chains } = require("../utils/chains.js");
const { alertsTypes } = require("../utils/alertsTypes.js");
const prisma = new PrismaClient();

const saveInitialPositionInfo = async (position, initData) => {
  await prisma.Position.create({
    data: {
      id: parseInt(position.id),
      chainId: parseInt(position.chain),
      createdAt: new Date(initData.blockTimestemp),
      initValueToken0: parseFloat(initData.initValueToken0),
      token0Symbol: initData.token0symbol,
      initValueToken1: parseFloat(initData.initValueToken1),
      token1Symbol: initData.token1symbol,
      initToken0USDRate: parseFloat(initData.initToken0USDRate),
      initToken1USDRate: parseFloat(initData.initToken1USDRate),
      initPriceT0T1: parseFloat(
        initData.initToken0USDRate / initData.initToken1USDRate
      ),
    },
  });
};

async function savePositionData(
  positionData,
  etherUsdExchangeRate,
  ArbitUsdExchangeRate,
  positionId,
  blockNumber
) {
  let position = await prisma.Position.findUnique({
    where: {
      id: positionId,
    },
  });

  if (!position) throw new Error("position not found");

  await prisma.PositionInfo.create({
    data: {
      positionId: {
        connect: { id: position.id },
      },
      pair: positionData.pair,
      liquidityToken0: parseFloat(positionData.liquidityToken0),
      liquidityToken1: parseFloat(positionData.liquidityToken1),
      feesToken0: parseFloat(positionData.feesToken0),
      feesToken1: parseFloat(positionData.feesToken1),
      token0Token1Rate: positionData.priceToken0 / 1e18,
      token0USDCExchangeRate: etherUsdExchangeRate,
      token1USDCExchangeRate: ArbitUsdExchangeRate,
      blockNumber: blockNumber,
    },
  });
}

const userSaveNewPosition = async (position, txHash) => {
  let pos = await prisma.Position.findUnique({
    where: {
      id: parseInt(position.id),
    },
  });

  if (pos) {
    logger.error("could not save postition, position already exist");
    throw new Error(
      `could not save postition ${position.id} on ${
        chains[position.chain].name
      }, position already exist`
    );
  }
  try {
    const initData = await retriveInitalPositionData(position, txHash);
    if (!initData) throw new Error("could not retrive initial data");
    saveInitialPositionInfo(position, initData);
  } catch (err) {
    throw new Error(err.message);
  }
};

const deletePosition = async (position) => {
  try {
    await prisma.Position.delete({
      where: {
        id: parseInt(position.id),
      },
    });
  } catch (err) {
    throw new Error("could not delete position, reason: ", err.message);
  }
};

const muteOrUnmutePositionAlert = async (position, mute) => {
  try {
    await prisma.Position.update({
      where: {
        id: parseInt(position.id),
      },
      data: {
        IsAlertMuted: mute,
      },
    });
  } catch (err) {
    console.log(err);
    throw new Error("could not mute position, reason: ", err.message);
  }
};

const updatePositionActiveAlert = async (position, alertType, isActive) => {
  let currentAlerts;

  currentAlerts = await prisma.Position.findUnique({
    where: {
      id: position.id,
    },
  });

  if (!currentAlerts) {
    throw new Error(`could not find Position ${position.id}`);
  }

  await prisma.Position.update({
    where: {
      id: parseInt(position.id),
    },
    data: {
      OutOfBounds:
        alertType === alertsTypes.OUT_OF_BOUNDS
          ? isActive
          : currentAlerts.outOfBounds,
      OutOfBoundsLastTriggered:
        alertType === alertsTypes.OUT_OF_BOUNDS && isActive === true
          ? new Date()
          : currentAlerts.OutOfBoundsLastTriggered,
      OldPosition:
        alertType === alertsTypes.OLD_POSITION
          ? isActive
          : currentAlerts.oldPosition,
      OldPositionLastTriggered:
        alertType === alertsTypes.OLD_POSITION && isActive === true
          ? new Date()
          : currentAlerts.oldPositionLastTriggered,
      PNL: alertType === alertsTypes.PNL ? isActive : currentAlerts.PNL,
      PNLLastTriggered:
        alertType === alertsTypes.PNL && isActive === true
          ? new Date()
          : currentAlerts.PNLLastTriggered,
      IMPLoss:
        alertType === alertsTypes.IMP_LOSS ? isActive : currentAlerts.IMPLoss,
      IMPLossLastTriggered:
        alertType === alertsTypes.IMP_LOSS && isActive === true
          ? new Date()
          : currentAlerts.IMPLossLastTriggered,
    },
  });
};

const updatePositionActiveAlertTriggeredTime = async (
  positionId,
  alertType
) => {
  let pos = await prisma.Position.findUnique({
    where: {
      id: positionId,
    },
  });
  if (!pos) {
    throw new Error("could not find active alert");
  }

  await prisma.Position.update({
    where: {
      id: parseInt(positionId),
    },
    data: {
      OutOfBoundsLastTriggered:
        alertType === alertsTypes.OUT_OF_BOUNDS
          ? new Date()
          : pos.OutOfBoundsLastTriggered,

      OldPositionLastTriggered:
        alertType === alertsTypes.OLD_POSITION
          ? new Date()
          : pos.oldPositionLastTriggered,

      PNLLastTriggered:
        alertType === alertsTypes.PNL ? new Date() : pos.PNLLastTriggered,

      IMPLossLastTriggered:
        alertType === alertsTypes.IMP_LOSS
          ? new Date()
          : pos.IMPLossLastTriggered,
    },
  });
};

module.exports = {
  savePositionData,
  userSaveNewPosition,
  deletePosition,
  muteOrUnmutePositionAlert,
  updatePositionActiveAlert,
  updatePositionActiveAlertTriggeredTime,
};
