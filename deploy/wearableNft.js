const { network } = require("hardhat");
const { developmentChains } = require("../hardhat.config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("deploying wearable nft");

  log("----------------------------------------------------");
  const arguments = [];
  const WearableNft = await deploy("WearableNft", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // Verify the deployment
  if (!developmentChains.includes(network.name)) {
    log("Verifying...");
    await verify(WearableNft.address, arguments);
  }
};

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
module.exports.tags = ["all", "WearableNft", "main"];
