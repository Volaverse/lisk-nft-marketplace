const { network } = require("hardhat");
const { developmentChains } = require("../hardhat.config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("deploying land nft");

  log("----------------------------------------------------");
  const arguments = [];
  const basicNft = await deploy("LandNft", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // Verify the deployment
  if (
    !developmentChains.includes(network.name)
  ) {
    log("Verifying...");
    await verify(basicNft.address, arguments);
  }
};

module.exports.tags = ["all", "landNft", "main"];
