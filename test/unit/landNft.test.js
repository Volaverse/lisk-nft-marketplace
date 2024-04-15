// We are going to skip a bit on these tests...

const { assert,expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

//writing the test code from here..

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Land NFT Unit Tests", function () {
      let landNft, deployer;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        landNftContract = await ethers.getContractFactory("LandNft");
        landNft = await landNftContract.deploy();
      });

      describe("Constructor", () => {
        it("Initializes the NFT Correctly.", async () => {
          const name = await landNft.name();
          const symbol = await landNft.symbol();
          const tokenCounter = await landNft.returnTokkenCounter();
          assert.equal(name, "LiskTest");
          assert.equal(symbol, "Lt");
          assert.equal(tokenCounter.toString(), "0");
        });
      });
      //test02
      describe("Mint NFT", () => {
        beforeEach(async () => {
          const txResponse = await landNft.mintNft();
          await txResponse.wait(1);
        });
        it("Allows users to mint an NFT, and updates appropriately", async function () {
          const tokenURI = await landNft.tokenURI(0);
          const tokenCounter = await landNft.returnTokkenCounter();

          assert.equal(tokenCounter.toString(), "1");
          assert.equal(tokenURI, await landNft.TOKEN_URI());
        });

        it("Allows users to mint multiple NFT, and updates appropriately", async function () {
          await landNft.batchMint(
            [123,122],
            [
              "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json",
              "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json",
            ]
          );
          const tokenURI = await landNft.tokenURI(0);
          const tokenCounter = await landNft.returnTokkenCounter();

          assert.equal(tokenCounter.toString(), "3");
          assert.equal(tokenURI, await landNft.TOKEN_URI());
        });


        it("For batch mint number of token uri should match the number of token Ids", async function () {
            await expect(
                landNft.batchMint(
                    [123],
                    [
                      "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json",
                      "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json",
                    ]
                  )
              ).to.be.revertedWith("Token IDs and URIs length mismatch");

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
