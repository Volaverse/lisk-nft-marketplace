## Overview

Volaverse is an education-focused metaverse powered by the Lisk blockchain. It provides a platform where users can engage in immersive educational experiences using blockchain technology.

## Getting Started

### Prerequisites

To use this backend, you will need to install the following dependencies:

- Nvm
- Node.js v20.3.1(Please note that project might not run on the other versions of Node.js)

### Installation

1. After installing Node.js, clone the Volaverse repository:

   ```sh
   git clone https://github.com/Volaverse/lisk-nft-marketplace.git
   
2. Install the dependencies
   ```sh
    npm install

### Environment Variables

The project uses environment variables for configuration. To set up your environment, create a `.env` file in the root directory of the project and populate it with your values. You can use the provided `.env.sample` file as a template:

```
cp .env.sample .env
```


### Run Tests

```
npx hardhat test
```



### Start a local node

```
npx hardhat node
```


### Linting 

```
npm run solhint
```

### Deploying with Hardhat

To deploy your smart contracts using Hardhat, you can use the `npx hardhat deploy` command followed by the `--network` flag to specify the network you want to deploy to. Additionally, you can use the `--tags` flag to deploy specific contracts tagged in your deployment scripts.

For example, to deploy the `CollectibleNft` contract to the mainnet network, you would run:

```bash
npx hardhat deploy --network lisk-sepolia --tags collectibleNft 
```

## Smart Contacts

### Marketplace Smart Contract
The Marketplace.sol file contains the marketplace smart contract, which includes functions for buying and listing NFTs. Additionally, the constructor of the Marketplace contract accepts an array of allowed NFT contract addresses as input. This ensures that only NFTs from these specified contracts can be traded on the marketplace.

### Land Nft Smart Contract
The Land.sol file contains the Land nft smart contract, which includes minting of  NFTs by the owner of the contract.

### Wearable Smart Contract
The Land.sol file contains the Land nft smart contract, which includes minting of  NFTs by the owner of the contract.

### Collectible Smart Contract
The Collectible.sol file contains the Land nft smart contract, which includes minting of  NFTs by the owner of the contract.

## Smart contract functions
Following are the functions in the marketplace smart contract:



1. `listItem`: Allows the owner of an NFT to list it for sale on the marketplace with a specified price.
2. `cancelListing`: Allows owners to cancel the listing of an NFT that they have previously listed for sale.
3. `buyItem`: Allows users to purchase an NFT that is listed for sale on the marketplace.
4. `updateListing`: Enables the owner of an NFT to update the sale price of their listed NFT.
5. `withdrawProceeds`: Allows sellers to withdraw the proceeds from the sale of their NFTs.

Following are the functions in the land,werable and collectible nft smart contract:



1. `returnTokkenCounter`: Retrieves the current value of the token counter.
2. `mintNft`: Mints a single NFT and assigns it to the caller's address. It also sets the token URI for the minted NFT.
3. `batchMint`: Mints multiple NFTs in a batch and assigns them to the caller's address. It also sets the token URIs for the minted NFTs.
   
## Learn More

You can learn more about [lisk](https://lisk.com/).

# License
[Apache License](LICENSE)
