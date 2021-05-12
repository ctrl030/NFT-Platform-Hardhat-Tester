const MonkeyContract = artifacts.require('MonkeyContract');
const MonkeyMarketplace = artifacts.require('MonkeyMarketplace');
const { expectRevert } = require('@openzeppelin/test-helpers');

let monkeyContractHHInstance;
let monkeyMarketplaceHHInstance;

// Truffle test with Hardhat
contract('MonkeyContract + MonkeyMarketplace with HH', accounts => {

  // deploying both contracts 
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

  describe('Testing main contract functionality', () => {

    it('_name should be "Crypto Monkeys"', async () => {  
      // console.log(monkeyContractHHInstance._name)
      assert.equal(await monkeyContractHHInstance.name(), 'Crypto Monkeys')        
    })

    it('_symbol should be "MONKEY"', async () => {
      assert.equal(await monkeyContractHHInstance.symbol(), 'MONKEY')      
    })              

    
    it("GEN0_Limit should be 12", async() => {  
      //console.log("Console.log is available here")
      const limit = await monkeyContractHHInstance.GEN0_Limit();
      //console.log("GEN0_Limit is", Number(limit));
      assert.equal(limit, 12); 
    });

    it('There should be one monkey in the array after deployment', async () => {  
      const totalSupplyAfterDeployment = await monkeyContractHHInstance.totalSupply();
      //const zeroMonkeytest1 = await monkeyContractHHInstance.getMonkeyDetails(0);
      //console.log(zeroMonkeytest1);
      assert.equal(totalSupplyAfterDeployment, 1);
    });

    
    it('Zero monkey should be owned by zero address', async () => {  
      const zeroMonkeytest2 = await monkeyContractHHInstance.getMonkeyDetails(0);
      //console.log(zeroMonkeytest2.owner);
      assert.equal(zeroMonkeytest2.owner, 0x0000000000000000000000000000000000000000)  
    });

    
    it('Zero monkey should be over 9000', async () => { 
      const zeroMonkeytest3 = await monkeyContractHHInstance.getMonkeyDetails(0);
      const zeroGenesNumber = zeroMonkeytest3.genes.toNumber();
      // console.log(zeroGenesNumber);
      assert.equal(zeroGenesNumber, 1214131177989271)
      //console.log('Zero monkey is over 9000')
    });    

    it("should be able to create another 11 monkeys, so there are 12 in total now", async() => {  
      //console.log("Console.log is available here")
     
      for (let index = 1; index < 12; index++) {        
        await monkeyContractHHInstance.createGen0Monkey(1111111111111111);
        // console.log(index);        
      }
      const totalSupplyAfterCreating12 = await monkeyContractHHInstance.totalSupply();      
      assert.equal(totalSupplyAfterCreating12, 12)
      /*
      const zeroMonkeytest3 = await monkeyContractHHInstance.getMonkeyDetails(0);
      console.log("monkeyID 0, number 1, zero monkey");
      console.log("tokenId");
      console.log(zeroMonkeytest3.tokenId);
      console.log("genes");
      console.log(zeroMonkeytest3.genes.toNumber());

      const zeroMonkeytest4 = await monkeyContractHHInstance.getMonkeyDetails(11);
      console.log("monkeyID 11, number 12");
      console.log("tokenId");
      console.log(zeroMonkeytest4.tokenId);
      console.log("genes");
      console.log(zeroMonkeytest4.genes.toNumber());
      */
    });

    it("should be able to create another 11 monkeys, so there are 12 in total now", async() => {  
        
      await monkeyContractHHInstance.createGen0Monkey(1111111111111111);
      
      const totalSupplyAfterCreating12 = await monkeyContractHHInstance.totalSupply();      
      assert.equal(totalSupplyAfterCreating12, 12)
      
    });

  })

});
