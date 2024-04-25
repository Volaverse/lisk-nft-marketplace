const { assert, expect } = require("chai");
const { network, ethers } = require("hardhat");
const { developmentChains } = require("../../hardhat.config");
require("dotenv").config();

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Land NFT Unit Tests", function () {
      let landNft, deployer, user, nftUser2;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        user = accounts[1];
        landNftContract = await ethers.getContractFactory("LandNft");
        landNft = await landNftContract.deploy();
        nftUser2 = landNft.connect(user);
      });

      describe("Constructor", () => {
        it("Initializes the NFT Correctly.", async () => {
          const name = await landNft.name();
          const symbol = await landNft.symbol();
          const tokenCounter = await landNft.returnTokkenCounter();

          assert.equal(name, "Land");
          assert.equal(symbol, "La");
          assert.equal(tokenCounter.toString(), "0");
        });
      });

      describe("Mint NFT", () => {
        var ipfs = process.env.TEST_ipfs;
        var ipfsArr = [ipfs, ipfs];

        beforeEach(async () => {
          const txResponse = await landNft.mintNft(ipfs);
          await txResponse.wait(1);
        });
        it("Allows users to mint an NFT, and updates appropriately", async function () {
          const tokenURI = await landNft.tokenURI(0);
          const tokenCounter = await landNft.returnTokkenCounter();

          assert.equal(tokenCounter.toString(), "1");
          assert.equal(tokenURI, ipfs);
        });

        it("Allows only deployer to mint an NFT", async function () {
          await expect(nftUser2.mintNft(ipfs)).to.be.revertedWithCustomError(
            nftUser2,
            "OwnableUnauthorizedAccount"
          );
        });

        it("Allows users to mint multiple NFT, and updates appropriately", async function () {
          await landNft.batchMint(ipfsArr);
          const tokenURI1 = await landNft.tokenURI(1);
          const tokenURI2 = await landNft.tokenURI(2);
          const tokenCounter = await landNft.returnTokkenCounter();

          assert.equal(tokenCounter.toString(), "3");
          assert.equal(tokenURI1, ipfsArr[0]);
          assert.equal(tokenURI2, ipfsArr[1]);
        });

        it("For batch mint number of token uri should be more than 0", async function () {
          await expect(landNft.batchMint([])).to.be.revertedWithCustomError(
            landNft,
            "TokenURIsMustNotBeEmpty"
          );
        });

        it("Show the correct balance and owner of an NFT", async function () {
          const deployerAddress = deployer.address;
          const deployerBalance = await landNft.balanceOf(deployerAddress);
          const owner = await landNft.ownerOf("0");

          assert.equal(deployerBalance.toString(), "1");
          assert.equal(owner, deployerAddress);
        });
      });
    });
