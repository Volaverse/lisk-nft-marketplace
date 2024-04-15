const { assert, expect } = require("chai");
const { network, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Nft Marketplace Unit Tests", function () {
      let nftMarketplace,
        nftMarketplaceContract,
        basicNft,
        basicNftContract,
        wearableNft,
        wearableNftContract,
        landNft,
        landNftContract,
        nftMarketplaceConnect;
      const PRICE = ethers.parseEther("0.1");
      const TOKEN_ID = 0;
      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        user = accounts[1];
        nftMarketplaceContract = await ethers.getContractFactory(
          "NftMarketplace"
        );
        basicNftContract = await ethers.getContractFactory("BasicNft");
        wearableNftContract = await ethers.getContractFactory("WearableNft");
        wearableNft = await wearableNftContract.deploy();
        basicNft = await basicNftContract.deploy();
        landNftContract = await ethers.getContractFactory("LandNft");
        landNft = await landNftContract.deploy();
        nftMarketplace = await nftMarketplaceContract.deploy([basicNft.target,wearableNft.target]);
        await wearableNft.mintNft();
        await basicNft.mintNft();
        await landNft.mintNft();
        await basicNft.approve(nftMarketplace.target, TOKEN_ID);
        await landNft.approve(nftMarketplace.target, TOKEN_ID);
        nftMarketplaceConnect = nftMarketplace.connect(user);
      });

      describe("listItem", function () {
        it("emits an event after listing an item", async function () {
          expect(
            await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE)
          ).to.emit("ItemListed");
        });
        it("exclusively items that haven't been listed", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE)
          )
            .to.be.revertedWithCustomError(nftMarketplace, "AlreadyListed")
            .withArgs(basicNft.target, TOKEN_ID);
        });
        it("exclusively allows owners to list", async function () {
          await basicNft.approve(user.address, TOKEN_ID);
          await expect(
            nftMarketplaceConnect.listItem(basicNft.target, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(nftMarketplaceConnect, "NotOwner");
        });
        it("only approved nft to be listed", async function () {
          await expect(nftMarketplace.listItem(landNft.target, TOKEN_ID, PRICE))
            .to.be.revertedWithCustomError(
              nftMarketplace,
              "NFTAddressNotPermitted"
            )
            .withArgs(landNft.target);
        });
        it("needs approvals to list item", async function () {
          await expect(
            nftMarketplace.listItem(wearableNft.target, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(nftMarketplace,"NotApprovedForMarketplace");
        });
        it("Updates listing with seller and price", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          const listing = await nftMarketplace.getListing(
            basicNft.target,
            TOKEN_ID
          );
          assert(listing.price.toString() == PRICE.toString());
          assert(listing.seller.toString() == deployer.address);
        });
        it("reverts if the price be 0", async () => {
          const ZERO_PRICE = ethers.parseEther("0");
          await expect(
            nftMarketplace.listItem(basicNft.target, TOKEN_ID, ZERO_PRICE)
          ).revertedWithCustomError(nftMarketplace, "PriceMustBeAboveZero");
        });
      });
      describe("cancelListing", function () {
        it("reverts if there is no listing", async function () {
          const error = `NotListed("${basicNft.target}", ${TOKEN_ID})`;
          await expect(nftMarketplace.cancelListing(basicNft.target, TOKEN_ID))
            .to.be.revertedWithCustomError(nftMarketplace, "NotListed")
            .withArgs(basicNft.target, TOKEN_ID);
        });
        it("reverts if anyone but the owner tries to call", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          await basicNft.approve(user.address, TOKEN_ID);
          await expect(
            nftMarketplaceConnect.cancelListing(basicNft.target, TOKEN_ID)
          ).to.be.revertedWithCustomError(nftMarketplaceConnect, "NotOwner");
        });
        it("emits event and removes listing", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          expect(
            await nftMarketplace.cancelListing(basicNft.target, TOKEN_ID)
          ).to.emit("ItemCanceled");
          const listing = await nftMarketplace.getListing(
            basicNft.target,
            TOKEN_ID
          );
          assert(listing.price.toString() == "0");
        });
      });
      describe("buyItem", function () {
        let buyPrice = ethers.parseEther("0.2");

        it("reverts if the item isnt listed", async function () {
          await expect(
            nftMarketplaceConnect.buyItem(basicNft.target, TOKEN_ID)
          ).to.be.revertedWithCustomError(nftMarketplace, "NotListed");
        });
        it("reverts if owner is their own nft", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.buyItem(basicNft.target, TOKEN_ID)
          ).to.be.revertedWithCustomError(nftMarketplace, "OwnerCannotBuy");
        });
        it("reverts if the price isnt met", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          await expect(
            nftMarketplaceConnect.buyItem(basicNft.target, TOKEN_ID)
          ).to.be.revertedWithCustomError(nftMarketplace, "PriceNotMet");
        });
        it("transfers the nft to the buyer and updates internal proceeds record", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);

          expect(
            await nftMarketplaceConnect.buyItem(basicNft.target, TOKEN_ID, {
              value: buyPrice,
            })
          ).to.emit("ItemBought");
          const newOwner = await basicNft.ownerOf(TOKEN_ID);
          const deployerProceeds = await nftMarketplace.getProceeds(
            deployer.address
          );
          assert.equal(newOwner.toString(), user.address);
          assert.equal(deployerProceeds.toString(), buyPrice.toString());
        });
      });
      describe("updateListing", function () {
        it("must be owner and listed", async function () {
          await expect(
            nftMarketplace.updateListing(basicNft.target, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(nftMarketplace, "NotListed");
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          await expect(
            nftMarketplaceConnect.updateListing(
              basicNft.target,
              TOKEN_ID,
              PRICE
            )
          ).to.be.revertedWithCustomError(nftMarketplaceConnect, "NotOwner");
        });
        it("reverts if new price is 0", async function () {
          const updatedPrice = ethers.parseEther("0");
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.updateListing(
              basicNft.target,
              TOKEN_ID,
              updatedPrice
            )
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "PriceMustBeAboveZero"
          );
        });
        it("updates the price of the item", async function () {
          const updatedPrice = ethers.parseEther("0.2");
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          expect(
            await nftMarketplace.updateListing(
              basicNft.target,
              TOKEN_ID,
              updatedPrice
            )
          ).to.emit("ItemListed");
          const listing = await nftMarketplace.getListing(
            basicNft.target,
            TOKEN_ID
          );
          assert(listing.price.toString() == updatedPrice.toString());
        });
      });
      describe("withdrawProceeds", function () {
        it("doesn't allow 0 proceed withdrawls", async function () {
          await expect(
            nftMarketplace.withdrawProceeds()
          ).to.be.revertedWithCustomError(nftMarketplace, "NoProceeds");
        });
        it("withdraws proceeds", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          await nftMarketplaceConnect.buyItem(basicNft.target, TOKEN_ID, {
            value: PRICE,
          });
          nftMarketplaceConnect = nftMarketplace.connect(deployer);

          const deployerProceedsBefore = await nftMarketplace.getProceeds(
            deployer.address
          );
          const deployerBalanceBefore = await ethers.provider.getBalance(
            deployer.address
          );
          const txResponse = await nftMarketplace.withdrawProceeds();
          const transactionReceipt = await txResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;
          const deployerBalanceAfter = await ethers.provider.getBalance(
            deployer.address
          );
          assert(
            (deployerBalanceAfter + gasCost).toString() ==
              (deployerProceedsBefore + deployerBalanceBefore).toString()
          );
        });
      });
    });
