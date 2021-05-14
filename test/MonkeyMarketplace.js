const MonkeyContract = artifacts.require('MonkeyContract');
const MonkeyMarketplace = artifacts.require('MonkeyMarketplace');
const { expectRevert } = require('@openzeppelin/test-helpers');

let monkeyContractHHInstance;
let monkeyMarketplaceHHInstance;


// Truffle test with Hardhat
contract("MonkeyContract + MonkeyMarketplace with HH", accounts => {

  before(async()=> {
    // deploying the main smart contract: MonkeyContract
    monkeyContractHHInstance = await MonkeyContract.new();    
    console.log('MonkeyContract deployed');

    // deploying the marketplace smart contract: MonkeyMarketplace and sending the address of the MonkeyContract to the marketplace constructor
    monkeyMarketplaceHHInstance = await MonkeyMarketplace.new(monkeyContractHHInstance.address); 
    console.log('MonkeyMarketplace deployed');
   
  })

  describe('Testing correct deployment', () => {

    it('Market should know main contract address', async () => {  

      //console.log('monkeyContractHHInstance.address: ');
      //console.log(monkeyContractHHInstance.address);

      const mainContractAddressSavedInMarket = await monkeyMarketplaceHHInstance.returnMonkeyContract();
      //console.log('mainContractAddressSavedInMarket: ');
      //console.log(mainContractAddressSavedInMarket);

      assert.equal(mainContractAddressSavedInMarket, monkeyContractHHInstance.address);
      // console.log('Both addresses are the same.')      
    }) 

    it('accounts[0] should be deployer of main contract', async () => {  
      //console.log('monkeyContractHHInstance.owner: ');
      //console.log(monkeyContractHHInstance);
      const monkeyContractHHInstanceOwner = await monkeyContractHHInstance.contractOwner()
      //console.log(monkeyContractHHInstanceOwner);
      //console.log("accounts[0]");
      //console.log(accounts[0]);
      assert.equal(monkeyContractHHInstanceOwner, accounts[0]);
    }) 
  })



 
});
