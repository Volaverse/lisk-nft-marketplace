// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error ItemNotForSale(address nftAddress, uint256 tokenId);
error NotListed(address nftAddress, uint256 tokenId);
error AlreadyListed(address nftAddress, uint256 tokenId);
error NoProceeds();
error OwnerCannotBuy(address spender, address owner);
error NotOwner();
error NotApprovedForMarketplace();
error PriceMustBeAboveZero();
error NFTAddressNotPermitted(address nftAddress);

contract NftMarketplace is ReentrancyGuard {
    struct NftList {
        uint256 tokenId;
        address nftAddress;
        uint256 price;
        address owner;
    }

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    mapping(address => uint256) private proceeds;
    mapping(address => bool) public allowedNFTs;
    mapping(address => mapping(uint256 => NftList)) public nftsListMap;
    mapping(address => mapping(uint256 => uint256)) private listingIndex;
    NftList[] public nftlLists;
    address[] public allowedNFTAddresses;

    modifier notListed(address nftAddress, uint256 tokenId) {
        NftList memory listing = nftsListMap[nftAddress][tokenId];
        if (listing.price > 0) {
            revert AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        NftList memory listing = nftsListMap[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NotListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isAllowedNFT(address nftAddress) {
        if (!allowedNFTs[nftAddress]) {
            revert NFTAddressNotPermitted(nftAddress);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);

        if (spender != owner) {
            revert NotOwner();
        }
        _;
    }

    modifier isNotOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender == owner) {
            revert OwnerCannotBuy(spender, owner);
        }
        _;
    }

    // Only nfts from volaverse smart contract will be traded in the marketplace
    constructor(address[] memory _allowedNFTAddresses) {
        for (uint256 i = 0; i < _allowedNFTAddresses.length; i++) {
            allowedNFTs[_allowedNFTAddresses[i]] = true;
            allowedNFTAddresses.push(_allowedNFTAddresses[i]);
        }
    }

    /////////////////////
    // Main Functions //
    /////////////////////
    /*
     * @notice Method for listing NFT
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     * @param price sale price for each item
     */

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
        isAllowedNFT(nftAddress)
    {
        if (price <= 0) {
            revert PriceMustBeAboveZero();
        }
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NotApprovedForMarketplace();
        }

        NftList memory newListing = NftList(
            tokenId,
            nftAddress,
            price,
            msg.sender
        );
        nftsListMap[nftAddress][tokenId] = newListing;
        nftlLists.push(newListing);
        // Store the index of the new listing
        listingIndex[nftAddress][tokenId] = nftlLists.length - 1;

        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    /*
     * @notice Method for cancelling listing
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     */
    function cancelListing(
        address nftAddress,
        uint256 tokenId
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        uint256 index = listingIndex[nftAddress][tokenId];
        require(index < nftlLists.length, "Index out of bounds");

        // Move the last element to the deleted spot to maintain array integrity
        if (index != nftlLists.length - 1) {
            NftList memory lastListing = nftlLists[nftlLists.length - 1];
            nftlLists[index] = lastListing;
            listingIndex[lastListing.nftAddress][lastListing.tokenId] = index;
        }

        // Remove the last element
        nftlLists.pop();
        delete nftsListMap[nftAddress][tokenId];
        delete listingIndex[nftAddress][tokenId];

        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    /*
     * @notice Method for buying listing
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     */
    function buyItem(
        address nftAddress,
        uint256 tokenId
    )
        external
        payable
        isListed(nftAddress, tokenId)
        isNotOwner(nftAddress, tokenId, msg.sender)
        nonReentrant
    {
        NftList memory listedItem = nftsListMap[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert PriceNotMet(nftAddress, tokenId, listedItem.price);
        }
        proceeds[listedItem.owner] += msg.value;
        uint256 index = listingIndex[nftAddress][tokenId];
        require(index < nftlLists.length, "Index out of bounds");

        // Move the last element to the deleted spot to maintain array integrity
        if (index != nftlLists.length - 1) {
            NftList memory lastListing = nftlLists[nftlLists.length - 1];
            nftlLists[index] = lastListing;
            listingIndex[lastListing.nftAddress][lastListing.tokenId] = index;
        }

        // Remove the last element
        nftlLists.pop();
        delete nftsListMap[nftAddress][tokenId];
        delete listingIndex[nftAddress][tokenId];
        IERC721(nftAddress).safeTransferFrom(
            listedItem.owner,
            msg.sender,
            tokenId
        );
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    /*
     * @notice Method for updating listing
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     * @param newPrice Price in Wei of the item
     */
    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isListed(nftAddress, tokenId)
        nonReentrant
        isOwner(nftAddress, tokenId, msg.sender)
    {

        if (newPrice <= 0) {
            revert PriceMustBeAboveZero();
        }
        nftsListMap[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    /*
     * @notice Method for withdrawing proceeds from sales
     */
    function withdrawProceeds() external {
        uint256 proceedsWithdraw = proceeds[msg.sender];
        if (proceedsWithdraw <= 0) {
            revert NoProceeds();
        }
        proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceedsWithdraw}(
            ""
        );
        require(success, "Transfer failed");
    }

    /////////////////////
    // Getter Functions //
    ////////////////////

    // returns listing of a particular nft
    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (NftList memory) {
        return nftsListMap[nftAddress][tokenId];
    }

    // returns proccesinds of a particular seller
    function getProceeds(address seller) external view returns (uint256) {
        return proceeds[seller];
    }

    // returns all the listed nfts in the marketplace
    function getAllListings() external view returns (NftList[] memory) {
        return nftlLists;
    }
}
