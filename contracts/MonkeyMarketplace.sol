pragma solidity ^0.8.0;

import "./Monkeycontract.sol";
import "./Ownable.sol";
import "./IMonkeyMarketplace.sol";
// preparing safemath to rule out over- and underflow  
import "./Safemath.sol";

import "hardhat/console.sol";

// importing openzeppelin script to guard against re-entrancy
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// importing openzeppelin script to make contract pausable
import "@openzeppelin/contracts/security/Pausable.sol";

contract MonkeyMarketplace is Ownable, IMonkeyMarketplace, ReentrancyGuard, Pausable {
  using SafeMath for uint256;
  
  MonkeyContract private _monkeycontract;

  struct Offer {
    address payable seller;
    uint256 price;
    uint256 index;
    uint256 tokenId;    
    bool active;
  }

  // Array of all offers
  // can be queried by onlyOwner via showOfferArrayEntry
  Offer[] offersArray; 

  // Mapping of Token ID to offer
  mapping (uint256 => Offer) tokenIdToOfferMapping;   

  event MarketTransaction(string TxType, address owner, uint256 tokenId);

  event monkeySold (address seller, address buyer, uint256 priceInGwei, uint256 tokenId);  
  
  /** 
  * Sets the current MonkeyContract address and initializes the instance of Monkeycontract.
  * Requirement: Only the contract owner can call.
  */
  function setMonkeyContract(address _newMonkeyContractAddress) public onlyOwner {
   _monkeycontract = MonkeyContract(_newMonkeyContractAddress);
  }

  constructor (address _constructorMonkeyContractAddress) public {
    setMonkeyContract(_constructorMonkeyContractAddress); 
  }


  // Variable getters for testing
  function returnMonkeyContract() public view returns (MonkeyContract _monkeycontractNow) {
    return _monkeycontract;
  }
 

 /**
  * Get the details about a offer for _tokenId. Throws an error if there is no active offer for _tokenId.
  */
  function getOffer(uint256 _tokenId) external view returns (address seller, uint256 price, uint256 index, uint256 tokenId, bool active)
  {
    require (tokenIdToOfferMapping[_tokenId].active, "No active offer for this tokenId.");

    Offer memory offer = tokenIdToOfferMapping[_tokenId]; 
    return (
    offer.seller,
    offer.price,
    offer.index, 
    offer.tokenId,
    offer.active       
    );
  }

  /**
  * Get all tokenId's that are currently for sale. 
  * Returns an empty array if none exist.
  // adds a Token ID to the 'result' array each time the loop finds an active offer in the offersArray  
  */
  function getAllTokenOnSale() external view returns(uint256[] memory listOfOffers) {  

    // counting active offers, needed to create correct hardcoded length of 'result' array
    uint256 numberOfActiveOffers;
    
    // looking through offersArray at each postion
    for (uint256 actCount = 0; actCount < offersArray.length; actCount++) {

      // each time an active offer is found, numberOfActiveOffers is increased by 1
      if (offersArray[actCount].active) {
        numberOfActiveOffers++;
      }
    }     

    // if no active offers are found, an empty array is returned
    if (numberOfActiveOffers == 0){
      return new uint256[](0);
    }
    // looking again through offersArray at each postion
    else {
      // 'result' array with hardcoded length, defined by active offers found above
      uint256[] memory result = new uint256[](numberOfActiveOffers);      

      // index position in result array
      uint256 newIndex = 0 ;

      for (uint256 k = 0; k < offersArray.length; k++) {
        
        // each time an active offer is found, its tokenId is put into the next position in the 'result' array
        if (offersArray[k].active) {
          result[newIndex] = offersArray[k].tokenId;
          newIndex++;
        }         
      }

      return result; 

    }
   
  }

  /**
  * Creates a new offer for _tokenId for the price _price.
  * Emits the MarketTransaction event with txType "Create offer"
  * Requirement: Only the owner of _tokenId can create an offer.
  * Requirement: There can only be one active offer for a token at a time.
  * Requirement: Marketplace contract (this) needs to be an approved operator when the offer is created.
  */    
  function setOffer(uint256 _price, uint256 _tokenId) external whenNotPaused {    

    //  Only the owner of _tokenId can create an offer.
    address monkeyOwner = _monkeycontract.ownerOf(_tokenId);
    require( monkeyOwner == msg.sender);

    //Marketplace contract (this) needs to be an approved operator when the offer is created.
    require(_monkeycontract.isApprovedForAll(msg.sender, address(this)), "Marketplace address needs operator status from monkey owner.");

    Offer memory tokenOffer = tokenIdToOfferMapping[_tokenId];

    // There can only be one active offer for a token at a time.    
    if (tokenOffer.active == true) {
      
      // delete offer array entry 
      delete offersArray[tokenOffer.index]; 

      // delete mapping entry
      delete tokenIdToOfferMapping[_tokenId];

      // emit MarketTransaction("Remove offer", msg.sender, _tokenId);
    }
    
    // Creating a new offer from the Offer struct "blueprint"
    Offer memory _newOffer = Offer({
      seller: msg.sender,
      price: _price,
      tokenId: _tokenId,      
      active: true,
      index: offersArray.length  // This is the index it has in the offersArray, see below
    });

    // saving new offer (it's a struct) to mapping 
    tokenIdToOfferMapping[_tokenId] = _newOffer;    

    offersArray.push(_newOffer);  

    emit MarketTransaction("Create offer", monkeyOwner, _tokenId);

  }

  /**
  * Removes an existing offer.
  * Emits the MarketTransaction event with txType "Remove offer"
  * Requirement: Only the seller of _tokenId can remove an offer.
  */
  function removeOffer(uint256 _tokenId) external whenNotPaused {

    Offer memory tokenOffer = tokenIdToOfferMapping[_tokenId];

    //  Only the owner of _tokenId can delete an offer.
    require(tokenOffer.seller == msg.sender, "You're not the owner");    

    // setting array entry inactive
    offersArray[tokenOffer.index].active = false;

    // deleting mapping entry
    delete tokenIdToOfferMapping[_tokenId];      

    emit MarketTransaction("Remove offer", msg.sender, _tokenId);
    
  }

  /**
  * Executes the purchase of _tokenId.
  * Sends the funds to the seller and transfers the token using transferFrom in Monkeycontract.   
  * Emits the MarketTransaction event with txType "Buy".
  * Requirement: The msg.value needs to equal the price of _tokenId
  * Requirement: There must be an active offer for _tokenId
  */
  function buyMonkey(uint256 _tokenId) external payable nonReentrant whenNotPaused{    

    Offer memory tokenOffer = tokenIdToOfferMapping[_tokenId];
    
    require(tokenOffer.active == true, "No active offer for this monkey" );

    require(tokenOffer.price == msg.value, "Not sending the correct amount");    

    uint256 _priceInGwei = msg.value / 1000000000;
                                       
    address _oldOwner = tokenOffer.seller;

    // deactivating offer by setting array entry inactive
    offersArray[tokenOffer.index].active = false;

    // deleting offer mapping entry
    delete tokenIdToOfferMapping[_tokenId];

    // deleting local memory variable against re-entrancy  
    delete tokenOffer;    

    // transferring the NFT
    _monkeycontract.transferFrom(_oldOwner, msg.sender, _tokenId);  

    // transferring sent funds to _oldOwner
    (bool success, ) = _oldOwner.call.value(msg.value)("");        
    require(success, "Transfer did not succceed");

    // emitting events
    emit MarketTransaction("Buy", msg.sender, _tokenId);
    emit monkeySold (_oldOwner, msg.sender, _priceInGwei, _tokenId);
  }

  function showLengthOfOffersArray() external view onlyOwner returns(uint256 length) {
    return offersArray.length;
  }
  
  function showOfferArrayEntry(uint256 arrayPosition) external view onlyOwner returns(address seller, uint256 price, uint256 index, uint256 tokenId, bool active) { 

    Offer memory offer = offersArray[arrayPosition]; 

    return (
    offer.seller,
    offer.price,
    offer.index, 
    offer.tokenId,
    offer.active       
    );      

  }    

} 