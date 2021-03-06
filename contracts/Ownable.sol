pragma solidity ^0.8.0;

contract Ownable {
    
    //"contractOwner" as not to confuse with NFT "owner"s in the Monkeycontract 
    address payable public contractOwner;
    
    constructor () public {
        contractOwner = msg.sender;
    }
    
    modifier onlyOwner(){
        require (msg.sender == contractOwner);
        _; // orders execution to continue, if this line is reached (i.e. the require above was passed) 
    }
    
}