// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";
contract WearableNft is ERC721URIStorage {
    uint256 private s_tokkenCounter;

    string public constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    constructor() ERC721("Wearable", "Wr") {
        s_tokkenCounter = 0;
    }

    function returnTokkenCounter() public view returns (uint256) {
        return s_tokkenCounter;
    }

    function mintNft() public {
        _safeMint(msg.sender, s_tokkenCounter);
        s_tokkenCounter = s_tokkenCounter + 1;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        // require( _requireOwned(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return TOKEN_URI;
    }

    function batchMint(
        uint256[] memory tokenIds,
        string[] memory tokenURIs
    ) public {
        require(
            tokenIds.length == tokenURIs.length,
            "Token IDs and URIs length mismatch"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            // Ensure the tokenId is not already minted and the URI is not empty
            _safeMint(msg.sender, tokenIds[i]);
            _setTokenURI(tokenIds[i], tokenURIs[i]);
            s_tokkenCounter = s_tokkenCounter + 1;
        }
    }
}
