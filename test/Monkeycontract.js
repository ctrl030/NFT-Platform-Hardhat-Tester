const MonkeyContract = artifacts.require('MonkeyContract');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

let monkeyContractHHInstance;


// Hardhat test with openzeppelin, Truffle and web3
contract('MonkeyContract with HH', accounts => {

  // deploying the main smart contract: MonkeyContract
  before(async()=> {
    monkeyContractHHInstance = await MonkeyContract.new();      
  })

  describe('Testing correct deployment', () => {     

    // 1
    it('Test 1: accounts[0] should be deployer of main contract', async () => {  
      //console.log('monkeyContractHHInstance.owner: ');
      //console.log(monkeyContractHHInstance);
      const monkeyContractHHInstanceOwner = await monkeyContractHHInstance.contractOwner()
      //console.log(monkeyContractHHInstanceOwner);
      //console.log('accounts[0]');
      //console.log(accounts[0]);
      assert.equal(monkeyContractHHInstanceOwner, accounts[0]);
    }) 

    // 2
    it('Test 2: _name should be "Crypto Monkeys"', async () => {  
      // console.log(monkeyContractHHInstance._name)
      assert.equal(await monkeyContractHHInstance.name(), 'Crypto Monkeys')        
    })

    // 3
    it('Test 3: _symbol should be "MONKEY"', async () => {
      assert.equal(await monkeyContractHHInstance.symbol(), 'MONKEY')      
    })              
    
    // 4
    it('Test 4: GEN0_Limit should be 12', async() => {  
      //console.log('Console.log is available here')
      const limit = await monkeyContractHHInstance.GEN0_Limit();
      //console.log('GEN0_Limit is', Number(limit));
      assert.equal(limit, 12); 
    });

    // 5 
    it('Test 5: There should be one Zero Monkey in the array after deployment', async () => {  
      const totalSupplyAfterDeployment = await monkeyContractHHInstance.totalSupply();
      //const zeroMonkeytest1 = await monkeyContractHHInstance.getMonkeyDetails(0);
      //console.log(zeroMonkeytest1);
      assert.equal(totalSupplyAfterDeployment, 1);
    });
    
    // 6
    it('Test 6: Zero Monkey should be owned by zero address', async () => {  
      const zeroMonkeytest2 = await monkeyContractHHInstance.getMonkeyDetails(0);
      //console.log(zeroMonkeytest2.owner);
      assert.equal(zeroMonkeytest2.owner, 0x0000000000000000000000000000000000000000)  
    });

    // 7
    it('Test 7: Zero Monkey should be over 9000', async () => { 
      const zeroMonkeytest3 = await monkeyContractHHInstance.getMonkeyDetails(0);
      const zeroGenesNumber = zeroMonkeytest3.genes.toNumber();
      // console.log(zeroGenesNumber);
      assert.equal(zeroGenesNumber, 1214131177989271)
      //console.log('Zero monkey is over 9000')
    }); 
  })

  describe('Testing main contract: NFT creation and transfers', () => {      

    // 8
    it('Test 8: accounts[0] should create 9 gen0 monkeys with DNA matching their index/tokenId', async() => {  
         
      // this loop will create 9 gen0 NFTs, each with a DNA string consisting of repeated, concatted NFT tokenId
      // i.e. 1111111111111111 for the NFT with tokenId 1
      // it will also check the emitted MonkeyCreated event each time and check if the emitted DNA string is correct as well
      for (let i = 1; i < 10; i++) {
        
        const concattedIndexes = `${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}` 
        // console.log(concattedIndexes);
        
        const truffleReceipt = await monkeyContractHHInstance.createGen0Monkey(concattedIndexes, {from: accounts[0]});
        // console.log(truffleReceipt);
        expectEvent(truffleReceipt, 'MonkeyCreated', { genes: `${concattedIndexes}` });

        // console.log(index);  
        const genesTestedDetails = await monkeyContractHHInstance.getMonkeyDetails(i);
        const genesTested = parseInt(genesTestedDetails.genes);
        const compareConcats = parseInt(concattedIndexes); 
        assert.equal(genesTested, compareConcats)        
      }
      const totalSupplyAfterCreating10 = await monkeyContractHHInstance.totalSupply();      
      assert.equal(totalSupplyAfterCreating10, 10)      
    });

    // 9
    it('Test 9: accounts[0] should create 2 additional gen0 monkeys, bringing totalSupply to 12, of which 11 gen0', async() => { 

      // this loop will create 2 gen0 NFTs, each with a DNA string of 1111111111111111
      // it will also check the emitted MonkeyCreated event each time and check if the emitted DNA string is correct as well
      for (let i = 0; i < 2; i++) {              
        const truffleReceipt2 =  await monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]});  
        
        // checking if genes string is as expected in NFTs with Token ID 10 and 11
        const correctTokenID = i + 10
        const genesTestedDetails = await monkeyContractHHInstance.getMonkeyDetails(correctTokenID);
        const genesTested = parseInt(genesTestedDetails.genes); 
        const correctGenes = parseInt(1111111111111111)
        assert.equal(genesTested, correctGenes);

        // checking if MonkeyCreated event was correctly triggered
        expectEvent(truffleReceipt2, 'MonkeyCreated', { genes: `${correctGenes}` });                
      }
      const totalSupplyAfterCreating12 = await monkeyContractHHInstance.totalSupply();      
      assert.equal(parseInt(totalSupplyAfterCreating12), 12);    
    });

    // 10
    it('Test 10: accounts[1] should try to create NFT, but is not authorized, should fail', async() => {             
        
      await expectRevert.unspecified(
        monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[1]})
      );
      
      /*
        const totalSupplynow2 = await monkeyContractHHInstance.totalSupply(); 
        console.log(totalSupplynow2.toNumber());
      */      
    });

    // 11
    it('Test 11: accounts[0] should create NFT, filling gen0 limit (of 12)', async() => {         
      await monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]})      
      
      /*
        const totalSupplynow2 = await monkeyContractHHInstance.totalSupply(); 
        console.log(totalSupplynow2.toNumber());
      */      
    });
    
    // 12
    it('Test 12: Limit is reached, creating another NFT should fail', async() => {             
        
      await expectRevert.unspecified(
        monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]})
      );
      
      /*
        const totalSupplynow2 = await monkeyContractHHInstance.totalSupply(); 
        console.log(totalSupplynow2.toNumber());
      */      
    });

    // 13
    it('Test 13: accounts[0] should give accounts[1] operator status', async() => {  

      // Giving operator status 
      await monkeyContractHHInstance.setApprovalForAll(accounts[1], true, {from: accounts[0]});

      const operatorGivenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
      
      // console.log('operator status for accounts[1] is:', operatorGivenApprovalTesting);
  
      assert.equal(operatorGivenApprovalTesting, true);
     
    });

    // 14
    it('Test 14: accounts[0] should take operator status away from accounts[1]', async() => {  
      await monkeyContractHHInstance.setApprovalForAll(accounts[1], false, {from: accounts[0]});
      
      const operatorTakenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
           
      // console.log('operator status for accounts[1] is:', operatorTakenApprovalTesting);    
      
      assert.equal(operatorTakenApprovalTesting, false);
    });

    // 15
    it('Test 15: accounts[0] should give accounts[1] operator status again', async() => {  

      // Giving operator status 
      await monkeyContractHHInstance.setApprovalForAll(accounts[1], true, {from: accounts[0]});

      const operatorGivenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
      
      // console.log('operator status for accounts[1] is:', operatorGivenApprovalTesting);
  
      assert.equal(operatorGivenApprovalTesting, true);     
    });

    // 16
    it('Test 16: as operator, accounts[1] should use transferFrom to move 5 NFTs with Token IDs 1-5 from accounts[0] to accounts[2]', async() => {  
      
      for (let index = 1; index <= 5; index++) {
        await monkeyContractHHInstance.transferFrom(accounts[0], accounts[2], `${index}`, { 
          from: accounts[1],
        });

        const testingMonkey = await monkeyContractHHInstance.getMonkeyDetails(index);
      
        assert.equal(testingMonkey.owner, accounts[2]);        
      }
      
    });

    // 16A
    it('Test 16A: as operator, accounts[1] should use transferFrom to take 6 NFTs with Token IDs 6-11 from accounts[0]', async() => {  
      
      for (let index = 6; index <= 11; index++) {
        await monkeyContractHHInstance.transferFrom(accounts[0], accounts[1], `${index}`, { 
          from: accounts[1],
        });

        const testingMonkey = await monkeyContractHHInstance.getMonkeyDetails(index);
      
        assert.equal(testingMonkey.owner, accounts[1]);        
      }
      
    });



    // 17
    it('Test 17: accounts[1] should give exclusive allowance for the NFT with Token ID 6 to accounts[2]', async() => {  
      const receipt = await monkeyContractHHInstance.approve(accounts[2], 6, {from: accounts[1]});
      // console.log(receipt);
      //expectEvent(receipt, 'Approval', { genes: `${concattedIndexes}` });
      const testingMonkeyNr6 = await monkeyContractHHInstance.getMonkeyDetails(6);

      //console.log('Test 17: accounts[2] is', accounts[2]) 
      //console.log('Test 17: testingMonkeyNr6.approvedAddress is', testingMonkeyNr6.approvedAddress);

      assert.equal(testingMonkeyNr6.approvedAddress, accounts[2]);

    });

    // 18
    it('Test 18: getApproved should confirm exclusive allowance for NFT with Token ID 6', async() => { 

      const testingAllowedAddressForMonkeyId6 = await monkeyContractHHInstance.getApproved(6);

      //console.log('approved for NFT with tokenID 6 is', testingAllowedAddressForMonkeyId6) 

      assert.equal(testingAllowedAddressForMonkeyId6, accounts[2]);

    });
    
    // 19
    it('Test 19: accounts[2] should take the allowed NFT with Token ID 6 from accounts[1]', async() => {       
      await monkeyContractHHInstance.transfer(accounts[2], 6, {from: accounts[2]});

      const testingMonkeyNr6 = await monkeyContractHHInstance.getMonkeyDetails(6);

      //console.log('accounts[3] is', accounts[1]) 
      //console.log('testingMonkeyNr6.owner is', testingMonkeyNr6.owner);

      assert.equal(testingMonkeyNr6.owner, accounts[2]);

    });

    // 20
    it('Test 20: as operator of accounts[0], accounts[1] should use safeTransferFrom to move NFT with Token ID 12 from accounts[0] to accounts[3]' , async() => {       
      await monkeyContractHHInstance.safeTransferFrom(accounts[0], accounts[3], 12, { 
        from: accounts[1],
      });

      const testingMonkeyNr12 = await monkeyContractHHInstance.getMonkeyDetails(12);

      //console.log('accounts[3] is', accounts[3]) 
      //console.log('testingMonkeyNr12.owner is', testingMonkeyNr12.owner);

      assert.equal(testingMonkeyNr12.owner, accounts[3]);

    });
    
    // 21
    it('Test 21: accounts[2] should use safeTransferFrom to move NFT with Token ID 5 from accounts[2] to accounts[3] and also send in data', async() => {       
      await monkeyContractHHInstance.safeTransferFrom(accounts[2], accounts[3], 5, '0xa1234', { 
        from: accounts[1],
      });

      const testingMonkeyNr4PosAndId3 = await monkeyContractHHInstance.getMonkeyDetails(3);

      //console.log('accounts[5] is', accounts[5]) 
      //console.log('testingMonkeyNr4PosAndId3.owner is', testingMonkeyNr4PosAndId3.owner);

      assert.equal(testingMonkeyNr4PosAndId3.owner, accounts[5]);
    })
  })

  describe('Testing main contract: Breeding', () => {      

    // 22
    it('Test 22: accounts[0] should breed NFT monkeys (tokenId 4 and 5) 14 times. First 2 digits should make up random number 10-98', async() => {  

      let firstTwoDigitsNFTNow;
      let firstTwoDigitsNFTLast = 0;

      for (let index = 1; index < 15; index++) {    
        
        await monkeyContractHHInstance.breed(4, 5, {from: accounts[0]});

        // Zero Monkey is in array on index 0, plus 12 NFT monkeys, first free array index is position 13
        const newMonkeyTokenIdTestingDetails = await monkeyContractHHInstance.getMonkeyDetails(index + 12);  
                
        // comparing first 2 digits of genes
        let stringOffirstTwoDigitsNFTNow = newMonkeyTokenIdTestingDetails.genes.toString(); 
        firstTwoDigitsNFTNow = parseInt(stringOffirstTwoDigitsNFTNow.charAt(0)+stringOffirstTwoDigitsNFTNow.charAt(1));
        //console.log('Breed Nr.' + index + ' first 2 gene digits LAST are ' + firstTwoDigitsNFTLast); 
        //console.log('Breed Nr.' + index + ' first 2 gene digits NOW are ' + firstTwoDigitsNFTNow);  
        assert.notEqual(firstTwoDigitsNFTNow, firstTwoDigitsNFTLast);

        // the 'NFT to check now' becomes the 'last NFT checked' for next loop
        firstTwoDigitsNFTLast = firstTwoDigitsNFTNow;

        // checking if contract owner is owner of NFT
        assert.equal(newMonkeyTokenIdTestingDetails.owner, accounts[0]);        
      }  
    });



  })



});
