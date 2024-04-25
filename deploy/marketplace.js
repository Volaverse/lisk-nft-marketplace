const { network } = require("hardhat");
const {
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../hardhat.config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  log("----------------------------------------------------");

  const argumentsArr = process.env.NFT_ALLOWED_ADDRESS.split(",");
  console.log("arg array ", argumentsArr);
  const arguments = [argumentsArr];
  const nftMarketplace = await deploy("NftMarketplace", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  // Verify the deployment
  if (!developmentChains.includes(network.name)) {
    log("Verifying...");
    await verify(nftMarketplace.address, arguments);
  }
  log("----------------------------------------------------");
};



module.exports.tags = ["all", "marketplace", "main"];
