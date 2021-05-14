const MonkeyContract = artifacts.require('MonkeyContract');
const { expectRevert } = require('@openzeppelin/test-helpers');

let monkeyContractHHInstance;


// Truffle test with Hardhat
contract('MonkeyContract with HH', accounts => {

  // deploying both contracts 
  before(async()=> {
    // deploying the main smart contract: MonkeyContract
    monkeyContractHHInstance = await MonkeyContract.new();    
    console.log('MonkeyContract deployed');   
  })

  describe('Testing correct deployment', () => {    

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

    it('There should be one Zero Monkey in the array after deployment', async () => {  
      const totalSupplyAfterDeployment = await monkeyContractHHInstance.totalSupply();
      //const zeroMonkeytest1 = await monkeyContractHHInstance.getMonkeyDetails(0);
      //console.log(zeroMonkeytest1);
      assert.equal(totalSupplyAfterDeployment, 1);
    });
    
    it('Zero Monkey should be owned by zero address', async () => {  
      const zeroMonkeytest2 = await monkeyContractHHInstance.getMonkeyDetails(0);
      //console.log(zeroMonkeytest2.owner);
      assert.equal(zeroMonkeytest2.owner, 0x0000000000000000000000000000000000000000)  
    });
    
    it('Zero Monkey should be over 9000', async () => { 
      const zeroMonkeytest3 = await monkeyContractHHInstance.getMonkeyDetails(0);
      const zeroGenesNumber = zeroMonkeytest3.genes.toNumber();
      // console.log(zeroGenesNumber);
      assert.equal(zeroGenesNumber, 1214131177989271)
      //console.log('Zero monkey is over 9000')
    });    

    it("accounts[0] should create 11 gen0 monkeys, i.e. 12 exist in total", async() => {  
      //console.log("Console.log is available here")
     
      for (let index = 1; index < 12; index++) {        
        await monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]});
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

    it("accounts[1] should try to create NFT, but is not authorized, should fail", async() => {             
        
      await expectRevert.unspecified(
        monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[1]})
      );
      
      /*
        const totalSupplynow2 = await monkeyContractHHInstance.totalSupply(); 
        console.log(totalSupplynow2.toNumber());
      */      
    });

    it("accounts[0] should create NFT, filling gen0 limit (of 12)", async() => {         
      await monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]})      
      
      /*
        const totalSupplynow2 = await monkeyContractHHInstance.totalSupply(); 
        console.log(totalSupplynow2.toNumber());
      */      
    });

    
    it("Limit is reached, creating another NFT should fail", async() => {             
        
      await expectRevert.unspecified(
        monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]})
      );
      
      /*
        const totalSupplynow2 = await monkeyContractHHInstance.totalSupply(); 
        console.log(totalSupplynow2.toNumber());
      */      
    });

    
    it("accounts[0] should give accounts[1] operator status", async() => {  

      // Giving operator status 
      await monkeyContractHHInstance.setApprovalForAll(accounts[1], true, {from: accounts[0]});

      const operatorGivenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
      
      // console.log("operator status for accounts[1] is:", operatorGivenApprovalTesting);
  
      assert.equal(operatorGivenApprovalTesting, true);
     
    });

    it("accounts[0] should take operator status away from accounts[1]", async() => {  
      await monkeyContractHHInstance.setApprovalForAll(accounts[1], false, {from: accounts[0]});
      
      const operatorTakenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
           
      // console.log("operator status for accounts[1] is:", operatorTakenApprovalTesting);    
      
      assert.equal(operatorTakenApprovalTesting, false);
    });

    it("accounts[0] should give accounts[1] operator status again", async() => {  

      // Giving operator status 
      await monkeyContractHHInstance.setApprovalForAll(accounts[1], true, {from: accounts[0]});

      const operatorGivenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
      
      // console.log("operator status for accounts[1] is:", operatorGivenApprovalTesting);
  
      assert.equal(operatorGivenApprovalTesting, true);     
    });

    
    it("as operator, accounts[1] should use transferFrom to move NFT with Token ID 1 from accounts[0] to accounts[2]", async() => {  
      await monkeyContractHHInstance.transferFrom(accounts[0], accounts[2], 1, { 
        from: accounts[1],
      });

      const testingMonkeyNr2PosAndId1 = await monkeyContractHHInstance.getMonkeyDetails(1);
      
      assert.equal(testingMonkeyNr2PosAndId1.owner, accounts[2]);
    });

    it("accounts[2] should give exclusive allowance for Token ID 1 to accounts[3]", async() => {  
      await monkeyContractHHInstance.approve(accounts[3], 1, { 
        from: accounts[2],
      });

      const testingMonkeyNr2PosAndId1 = await monkeyContractHHInstance.getMonkeyDetails(1);

      //console.log("accounts[3] is", accounts[3]) 
      //console.log("testingMonkeyNr2PosAndId1.approvedAddress is", testingMonkeyNr2PosAndId1.approvedAddress);

      assert.equal(testingMonkeyNr2PosAndId1.approvedAddress, accounts[3]);

    });

    it("getApproved should confirm exclusive allowance for Token ID 1", async() => { 

      const testingAllowedAddressForMonkeyId1 = await monkeyContractHHInstance.getApproved(1);

      //console.log("accounts[3] is", testingAllowedAddressForMonkeyId1) 

      assert.equal(testingAllowedAddressForMonkeyId1, accounts[3]);

    });
    
    it("accounts[3] should take the allowed Token ID 1 from accounts[2]", async() => {       
      await monkeyContractHHInstance.transfer(accounts[3], 1, { 
        from: accounts[3],
      });

      const testingMonkeyNr2PosAndId1 = await monkeyContractHHInstance.getMonkeyDetails(1);

      //console.log("accounts[3] is", accounts[1]) 
      //console.log("testingMonkeyNr2PosAndId1.owner is", testingMonkeyNr2PosAndId1.owner);

      assert.equal(testingMonkeyNr2PosAndId1.owner, accounts[3]);

    });
    
  })

});
