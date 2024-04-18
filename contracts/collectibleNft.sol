// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error TokenURIsMustNotBeEmpty();

contract CollectibleNft is ERC721URIStorage, Ownable {
    uint256 private tokkenCounter;

    constructor() ERC721("Collectibles", "Cl") Ownable(msg.sender) {
        tokkenCounter = 0;
    }

    function returnTokkenCounter() public view returns (uint256) {
        return tokkenCounter;
    }

    function mintNft(string memory tokenURI) public onlyOwner {
        _safeMint(msg.sender, tokkenCounter);
        _setTokenURI(tokkenCounter, tokenURI);
        tokkenCounter = tokkenCounter + 1;
    }

    function batchMint(string[] memory tokenURIs) public onlyOwner {
        if (tokenURIs.length == 0) {
            //TokenUri array sshould not be empty
            revert TokenURIsMustNotBeEmpty();
        }

        for (uint256 i = 0; i < tokenURIs.length; i++) {
            _safeMint(msg.sender, tokkenCounter);
            _setTokenURI(tokkenCounter, tokenURIs[i]);
            tokkenCounter = tokkenCounter + 1;
        }
    }
}
