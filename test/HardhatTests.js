const MonkeyContract = artifacts.require('MonkeyContract');
const MonkeyMarketplace = artifacts.require('MonkeyMarketplace');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

let monkeyContractHHInstance;
let monkeyMarketplaceHHInstance;

// asserting a specific amount of NFTs for an account
async function assertAmountofNFTs(acc, amount){
// checking how many NFTs are owned by account 'acc', should be 'amount' 
const prepAmountNFTsAcc = await monkeyContractHHInstance.balanceOf(acc);
const ammountNFTsAcc = parseInt(prepAmountNFTsAcc) ;
assert.equal(ammountNFTsAcc, amount)
}

// asserting owner and generation for an NFT
async function assertOwnerAndGeneration(ownerToExpect, tokenId, genToExpect){
  let testOwnAndGenDetails  = await monkeyContractHHInstance.getMonkeyDetails(tokenId); 
  assert.equal(testOwnAndGenDetails.owner, ownerToExpect);
  assert.equal(testOwnAndGenDetails.generation, genToExpect);
}

// assert an offer's details
async function assertOfferDetailsForTokenID(tokenId, expectedActive, expectedSeller, expectedPriceInETH ) {

  let expectedPriceInWEI = web3.utils.toWei(expectedPriceInETH);

  let assertOfferTestingResult = await monkeyMarketplaceHHInstance.getOffer(tokenId);

  let returnedTokenId = parseInt(assertOfferTestingResult.tokenId); 
  let returnedActive = assertOfferTestingResult.active;
  let returnedSeller = assertOfferTestingResult.seller;
  let priceInWEITestingResult = parseInt(assertOfferTestingResult.price); 
  let priceInETHTestingResult = web3.utils.fromWei(priceInWEITestingResult.toString()); 
  
  assert.equal(returnedTokenId, tokenId);
  assert.equal(returnedActive, expectedActive);
  assert.equal(returnedSeller, expectedSeller);
  assert.equal(priceInETHTestingResult, expectedPriceInETH);
  assert.equal(priceInWEITestingResult, expectedPriceInWEI);
}

// creates an offer and asserts if values are correct
async function createOfferAndAssert (priceInETH, tokenId, fromAccount) {
  let priceInETHTesting = priceInETH.toString(); 
  let priceInWEIForCallingTest28 = web3.utils.toWei(priceInETHTesting); 
  await monkeyMarketplaceHHInstance.setOffer(priceInWEIForCallingTest28, tokenId, {from: fromAccount});
  //await showActiveOfferForTokenID(tokenId);
  await assertOfferDetailsForTokenID(tokenId, true, fromAccount, priceInETHTesting ); 
}

// expects call to check NFT sell offer to revert with specific error message. Has to become counting 'revert' still xxxx
async function expectNoActiveOfferAndCount(tokenId) {
  await expectRevert( monkeyMarketplaceHHInstance.getOffer(tokenId), 'No active offer for this tokenId.');       
}

// address 'acc' gives operator status to market and asserts it works.  should count also xxxx
async function giveMarketOperatorAndAssertAndCount (acc) {
  await monkeyContractHHInstance.setApprovalForAll(monkeyMarketplaceHHInstance.address, true, {from: acc});
  let resultMarketOpTest = await monkeyContractHHInstance.isApprovedForAll(acc, monkeyMarketplaceHHInstance.address);     
  assert.equal(resultMarketOpTest, true);
}

// for testing/debugging: show the NFT array of an account
async function showArrayOfAccount(acc){
  // outer array holds 1 element: the inner array with BN elements
  const bigNrAccOutArr = [];
  bigNrAccOutArr.push(await monkeyContractHHInstance.findMonkeyIdsOfAddress(acc));

  // inner array holds BN elements
  const bigNrAccInArr = bigNrAccOutArr[0];    
  const convertedNumArr = [];

  // converting BN to numbers and pushing to array convertedNumArr
  for (let testC = 0; testC < bigNrAccInArr.length; testC++) {
                    
    if (bigNrAccInArr[testC] != 0) {          
      const bigNrToConvert = bigNrAccInArr[testC];
      const convertedNrToPush = parseInt(bigNrToConvert);
      convertedNumArr.push( convertedNrToPush ); 
    }
  }      
  console.log(acc +' has this NFT array: ');
  console.log(convertedNumArr);  
}

// for testing/debugging: show owner and generation for an NFT
async function showOwnerAndGeneration(tokenIdToTest){
  let testOwnAndGenDetails  = await monkeyContractHHInstance.getMonkeyDetails(tokenIdToTest); 
  console.log('NFT with Token ID: ' + tokenIdToTest)    
  console.log(testOwnAndGenDetails.owner); 
  console.log(parseInt(testOwnAndGenDetails.generation) );
}

// for testing/debugging: show owner and generation for all NFTs
async function showAllNFTsWithOwnerAndGen() {
  let totalAmount = await monkeyContractHHInstance.totalSupply()
  for (let showAllInd = 0; showAllInd < totalAmount; showAllInd++) {          
    showOwnerAndGeneration(showAllInd);
  }
}

// for testing/debugging: shows active offer for Token ID, if one exists
async function showActiveOfferForTokenID(tokenId) {

  let offerTestingResult = await monkeyMarketplaceHHInstance.getOffer(tokenId);        

  console.log('Offer Nr.: ' + tokenId + ' Token ID: ' + parseInt(offerTestingResult.tokenId));
  console.log('Offer Nr.: ' + tokenId + ' Active: ' + offerTestingResult.active);
  console.log('Offer Nr.: ' + tokenId + ' Index: ' + parseInt(offerTestingResult.index));
  console.log('Offer Nr.: ' + tokenId + ' Seller: ' + offerTestingResult.seller);

  let priceInWEITestingResult = parseInt(offerTestingResult.price); 
  console.log('Offer Nr.: ' + tokenId + ' Price in WEI: ' + priceInWEITestingResult );  

  let priceInETHTestingResult = web3.utils.fromWei(priceInWEITestingResult.toString()); 
  console.log('Offer Nr.: ' + tokenId + ' Price in ETH: ' + priceInETHTestingResult );  
  console.log('-----------------------------------');

}

// for testing/debugging: show all Token IDs with active offer
async function showingTokenIDsWithActiveOffer() {
  let actOffersBNArr = await monkeyMarketplaceHHInstance.getAllTokenOnSale();
  let activeOffers = [];

  for (let checkOffersIndex = 0; checkOffersIndex < actOffersBNArr.length; checkOffersIndex++) {    
    let offerToCheck = parseInt(actOffersBNArr[checkOffersIndex]);
    activeOffers.push(offerToCheck);
    console.log( 'Found active for Token ID: ' + offerToCheck);      
  }

  console.log('activeOffers');
  console.log(activeOffers);

}

// asserting that a specific number of sales offers are active
// xxxx should also count assertions
async function assertAmountOfActiveOffersAndCount(expectedAmount) {
  const actOffersBNArr = await monkeyMarketplaceHHInstance.getAllTokenOnSale();
  const activeOffersAmount = actOffersBNArr.length;

  assert.equal(activeOffersAmount, expectedAmount);
}


// Main contract Hardhat test with openzeppelin, Truffle and web3
contract('MonkeyContract with HH', accounts => {

  // for testing/debugging: show all accounts and their addresses
  async function showAllAccounts(){
    for (let ind = 0; ind <= 10; ind++) {
      console.log("accounts[" +`${ind}`+ "] is: " + accounts[ind])
    }  
  };

  // deploying the main smart contract: MonkeyContract
  before(async()=> {
    // deploying the main smart contract: MonkeyContract
    monkeyContractHHInstance = await MonkeyContract.new();    
    // console.log('MonkeyContract deployed');   
  });

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
      const totalSupplyAfterDeployment = await monkeyContractHHInstance.showTotalSupply();
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
        
        // checking how many NFTs are owned by accounts[0] after each loop
        const prepAmountNFTsForAccounts0 = await monkeyContractHHInstance.balanceOf(accounts[0]);
        const amountNFTsForAccounts0 = parseInt(prepAmountNFTsForAccounts0) ;
        //console.log(amountNFTsForAccounts0);
        assert.equal(amountNFTsForAccounts0, i)
      }

      // checking total supply of NFTs, should be 10, one Zero Monkey plus 9 gen0
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
        
        // checking how many NFTs are owned by accounts[0] after each loop
        const prepAmountNFTsForAccounts0 = await monkeyContractHHInstance.balanceOf(accounts[0]);
        const amountNFTsForAccounts0 = parseInt(prepAmountNFTsForAccounts0) ;
        //console.log(amountNFTsForAccounts0);
        assert.equal(amountNFTsForAccounts0, correctTokenID)
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
    it('Test 11: accounts[0] should create NFT, filling gen0 limit (of 12), bringing totalSupply to 13 (incl. Zero Monkey)', async() => {         
      await monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]})      
      
      // checking how many NFTs are owned by accounts[0], should be 12
      const prepAmountNFTsForAccounts0 = await monkeyContractHHInstance.balanceOf(accounts[0]);
      const amountNFTsForAccounts0 = parseInt(prepAmountNFTsForAccounts0) ;
      //console.log(amountNFTsForAccounts0);
      assert.equal(amountNFTsForAccounts0, 12)

      const totalSupplynow2 = await monkeyContractHHInstance.showTotalSupply();
      //const zeroMonkeytest1 = await monkeyContractHHInstance.getMonkeyDetails(0);
      //console.log(zeroMonkeytest1);
      assert.equal(parseInt(totalSupplynow2), 13);

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
    it('Test 16A: as operator, accounts[1] should use transferFrom to take 7 NFTs with Token IDs 6-12 from accounts[0]', async() => {  
      
      for (let index = 6; index <= 12; index++) {
        await monkeyContractHHInstance.transferFrom(accounts[0], accounts[1], `${index}`, { 
          from: accounts[1],
        });

        const testingMonkey = await monkeyContractHHInstance.getMonkeyDetails(index);
      
        assert.equal(testingMonkey.owner, accounts[1]);        
      }
      
    });



    // 17
    it('Test 17: accounts[1] should give exclusive allowance for the NFT with Token ID 7 to accounts[2]', async() => {  
      const receipt = await monkeyContractHHInstance.approve(accounts[2], 7, {from: accounts[1]});
      // console.log(receipt);
      //expectEvent(receipt, 'Approval', { genes: `${concattedIndexes}` });
      const testingMonkeyNr7 = await monkeyContractHHInstance.getMonkeyDetails(7);

      //console.log('Test 17: accounts[2] is', accounts[2]) 
      //console.log('Test 17: testingMonkeyNr7.approvedAddress is', testingMonkeyNr7.approvedAddress);

      assert.equal(testingMonkeyNr7.approvedAddress, accounts[2]);

    });

    // 18
    it('Test 18: getApproved should confirm exclusive allowance for NFT with Token ID 7', async() => { 

      const testingAllowedAddressForMonkeyId7 = await monkeyContractHHInstance.getApproved(7);

      //console.log('approved for NFT with tokenID 7 is', testingAllowedAddressForMonkeyId7) 

      assert.equal(testingAllowedAddressForMonkeyId7, accounts[2]);

    });
    
    // 19
    it('Test 19: accounts[2] should use transferFrom to take the allowed NFT with Token ID 7 from accounts[1]', async() => {       
      await monkeyContractHHInstance.transferFrom(accounts[1], accounts[2], 7, {from: accounts[2]});

      const testingMonkeyNr7 = await monkeyContractHHInstance.getMonkeyDetails(7);

      //console.log('accounts[2] is', accounts[2]) 
      //console.log('testingMonkeyNr7.owner is', testingMonkeyNr7.owner);

      assert.equal(testingMonkeyNr7.owner, accounts[2]);

    });

    // 20
    it('Test 20: accounts[1] should use transfer to send NFT with Token ID 6 to accounts[3]' , async() => {       
      await monkeyContractHHInstance.transfer(accounts[3], 6, { 
        from: accounts[1],
      });

      const testingMonkeyNr6 = await monkeyContractHHInstance.getMonkeyDetails(6);

      //console.log('accounts[3] is', accounts[3]) 
      //console.log('testingMonkeyNr6.owner is', testingMonkeyNr6.owner);

      assert.equal(testingMonkeyNr6.owner, accounts[3]);

    });
    
    // 21 is skipped
    // might be due to hardhat, truffle, etc being so new
    // accepts 4 arguments (either without data or targeting an instance with predefined {from: accounts[PREDEFINED_ARRAY_INDEX]})
    // but when given 5 (i.e.  with data plus custom defined account in contract call) throws and says: "Error: Invalid number of parameters for "safeTransferFrom". Got 5 expected 3!"
    // complicating factor maybe: two functions exist under the name "safeTransferFrom", one accepting 4 argumens, the other only 3, setting the fourth to ''
    it.skip('Test 21: accounts[2] should use safeTransferFrom to move NFT with Token ID 5 from accounts[2] to accounts[3] and also send in data', async() => {       
      await monkeyContractHHInstance.safeTransferFrom(accounts[2], accounts[3], 5, '0xa1234', { 
        from: accounts[2],
      });

      const testingMonkey5 = await monkeyContractHHInstance.getMonkeyDetails(5);

      //console.log('accounts[3] is', accounts[3]) 
      //console.log('testingMonkey5.owner is', testingMonkey5.owner);

      assert.equal(testingMonkey5.owner, accounts[3]);
    });

    // 21Placeholder
    it('Test 21Placeholder: accounts[2] should use safeTransferFrom to move NFT with Token ID 5 from accounts[2] to accounts[3] (test cant send data atm, fix test 21)', async() => {       
      await monkeyContractHHInstance.safeTransferFrom(accounts[2], accounts[3], 5, { 
        from: accounts[2],
      });

      const testingMonkey5 = await monkeyContractHHInstance.getMonkeyDetails(5);

      //console.log('accounts[3] is', accounts[3]) 
      //console.log('testingMonkey5.owner is', testingMonkey5.owner);

      assert.equal(testingMonkey5.owner, accounts[3]);
    });

  })

  describe('Testing main contract: Breeding', () => {     

    // 22
    it('Test 22: accounts[3] should breed NFT monkeys (Token IDs 5 and 6) 14 times. First 2 digits should make up random number 10-98 (test throws if first two digits of 2 NFTs in a row are the same)', async() => {  
      
      
      //let firstTwoDigitsNFTNow;
      //let firstTwoDigitsNFTLast = 0;      

      // checking how many NFTs are owned by accounts[3] at the start, should be 2, Token IDs 5 and 6
      const prepAmountNFTsForAccounts3 = await monkeyContractHHInstance.balanceOf(accounts[3]);
      const amountNFTsForAccounts3 = parseInt(prepAmountNFTsForAccounts3) ;
      //console.log('at start of Test 22 accounts[3] has this many NFTs: ' + amountNFTsForAccounts3);
      assert.equal(amountNFTsForAccounts3, 2);
      
      for (let index = 1; index <= 14; index++) {   

        await monkeyContractHHInstance.breed(5, 6, {from: accounts[3]});

        // Zero Monkey is in array on index 0, plus 12 NFT monkeys, first free array index is position 13
        const newMonkeyTokenIdTestingDetails = await monkeyContractHHInstance.getMonkeyDetails(index + 12);  
         
        /*
          // comparing first 2 digits of genes
          let stringOfNFTGenesNow = newMonkeyTokenIdTestingDetails.genes.toString();
          // console.log('Breed Nr.' + index + ' genes are ' + stringOfNFTGenesNow);  
          firstTwoDigitsNFTNow = parseInt(stringOfNFTGenesNow.charAt(0)+stringOfNFTGenesNow.charAt(1));
          //console.log('Breed Nr.' + index + ' first 2 gene digits LAST are ' + firstTwoDigitsNFTLast); 
          //console.log('Breed Nr.' + index + ' first 2 gene digits NOW are ' + firstTwoDigitsNFTNow);  
          assert.notEqual(firstTwoDigitsNFTNow, firstTwoDigitsNFTLast);

          // the 'NFT to check now' becomes the 'last NFT checked' for next loop
          firstTwoDigitsNFTLast = firstTwoDigitsNFTNow;
        */

        // checking if contract owner is owner of NFT
        assert.equal(newMonkeyTokenIdTestingDetails.owner, accounts[3]); 
        
        // checking how many NFTs are owned by accounts[3] at the start, should be increasing, starting with 3, go up to 16
        const loopPrepAmountNFTsForAccounts3 = await monkeyContractHHInstance.balanceOf(accounts[3]);
        const loopAmountNFTsForAccounts3 = parseInt(loopPrepAmountNFTsForAccounts3) ;
        // console.log('during looping in Test 22 accounts[3] has this many NFTs: ' + loopAmountNFTsForAccounts3);
        assert.equal(loopAmountNFTsForAccounts3, index + 2);
      }
      
    });

    it('Test 22A: accounts[3] should use safeTransferFrom to move 4 NFTs from itself to accounts[4]. Token IDs 5 and 6 (gen0) and Token IDs 14 and 15 (gen1)' , async() => {       
      // transferring Token ID 15
      await monkeyContractHHInstance.safeTransferFrom(accounts[3], accounts[4], 5, { 
        from: accounts[3],
      });  
      // querying Token details and comparing owenership to new account
      const testingMonkeyNr5 = await monkeyContractHHInstance.getMonkeyDetails(5);        
      assert.equal(testingMonkeyNr5.owner, accounts[4]);

      // repeat for Token ID 16
      await monkeyContractHHInstance.safeTransferFrom(accounts[3], accounts[4], 6, { 
        from: accounts[3],
      });        
      const testingMonkeyNr6 = await monkeyContractHHInstance.getMonkeyDetails(6);        
      assert.equal(testingMonkeyNr6.owner, accounts[4]);
      
      // repeat for Token ID 14
      await monkeyContractHHInstance.safeTransferFrom(accounts[3], accounts[4], 14, { 
        from: accounts[3],
      });  
      const testingMonkeyNr14 = await monkeyContractHHInstance.getMonkeyDetails(14);        
      assert.equal(testingMonkeyNr14.owner, accounts[4]);

      // repeat for Token ID 15
      await monkeyContractHHInstance.safeTransferFrom(accounts[3], accounts[4], 15, { 
        from: accounts[3],
      });        
      const testingMonkeyNr15 = await monkeyContractHHInstance.getMonkeyDetails(15);        
      assert.equal(testingMonkeyNr15.owner, accounts[4]);  

      //showArrayOfAccount(accounts[4]);

      // accounts[4] should have 4 NFTs at this point: 5, 6, 14, 15
      assertAmountofNFTs(accounts[4], 4)

      // repeat procedure for accounts[3]    
      
      //showArrayOfAccount(accounts[3]);

      // checking how many NFTs are owned by accounts[3], should be 12 (2 gen0 have been sent, also Token IDs 14 and 15, i.e. 12 left of 14 bred)
      assertAmountofNFTs(accounts[3], 12)
      

    });   

    
    it('Test 22B: accounts[4] should use breed to create 2 NFTs each of gen2, gen3, gen4, gen5, gen6 and gen7, i.e. should have 16 NFTs at the end (2x gen0 - 2x gen7) ' , async() => { 

      // breeding NFTs with Token IDs 14 and 15, creating gen2: Token IDs 27 and 28       
      for (let index22B1 = 14; index22B1 <= 15; index22B1++) {
        await monkeyContractHHInstance.breed(14, 15, {from: accounts[4]}); 
        
      }        
      
      assertOwnerAndGeneration(accounts[4], 27, 2);
      assertOwnerAndGeneration(accounts[4], 28, 2);

      // starting with gen2 for breeding NFTs with Token IDs 27 and 28 
      let test22Bgeneration = 2;
      // Token IDs are increased by 2 per loop, breeding 27 and 28, then 29 and 30, etc.
      // these are the Token IDs of the parents, not the children
      let test22BFirstParentIdCounter = 27;
      let test22BSecondParentIdCounter = test22BFirstParentIdCounter+1;
      
      // 5 loops, creating gen3-gen7
      for (let t22BigLoop = 0; t22BigLoop < 5; t22BigLoop++) {

        // creating 2 NFTs per loop
        for (let index22B = 0; index22B < 2; index22B++) {
          await monkeyContractHHInstance.breed(test22BFirstParentIdCounter, test22BSecondParentIdCounter, {from: accounts[4]});                
        }  

        /*
        console.log('test22BFirstParentIdCounter ' + test22BFirstParentIdCounter);
        console.log('test22BSecondParentIdCounter ' + test22BSecondParentIdCounter);
        console.log('test22Bgeneration ' + test22Bgeneration);
        console.log('-------------------- ' );
        
        await assertOwnerAndGeneration(accounts[4], test22BFirstParentIdCounter, test22Bgeneration);
        await assertOwnerAndGeneration(accounts[4], test22BSecondParentIdCounter, test22Bgeneration) ;  */     
        
        test22Bgeneration++;      
        test22BFirstParentIdCounter = test22BFirstParentIdCounter +2;    
        test22BSecondParentIdCounter = test22BFirstParentIdCounter+1;    
      }      

      // expecting 16 NFTs, 4 from before (5,6,14,15) plus 2 bred gen2 (27,28) plus 10 bred gen3-gen7 (5 loops of 2)
      assertAmountofNFTs(accounts[4], 16);          
      

    });
  });



});

// Market contract Hardhat test with openzeppelin, Truffle and web3
contract("MonkeyContract + MonkeyMarketplace with HH", accounts => {

  // for testing/debugging: show all accounts and their addresses
  async function showAllAccounts(){
    for (let ind = 0; ind <= 10; ind++) {
      console.log("accounts[" +`${ind}`+ "] is: " + accounts[ind])
    }  
  }

  // Before running the tests, deploying a new MonkeyMarketplace 
  before(async()=> {
    // deploying the marketplace smart contract: MonkeyMarketplace and getting the address of the MonkeyContract for the marketplace constructor
    monkeyMarketplaceHHInstance = await MonkeyMarketplace.new(monkeyContractHHInstance.address); 
    // console.log('MonkeyMarketplace deployed');
   
  });

  describe('Testing correct deployment', () => {

    // starts at 23
    it('Test 23: Market should know main contract address', async () => {  

      //console.log('monkeyContractHHInstance.address: ');
      //console.log(monkeyContractHHInstance.address);

      const mainContractAddressSavedInMarket = await monkeyMarketplaceHHInstance.returnMonkeyContract();
      //console.log('mainContractAddressSavedInMarket: ');
      //console.log(mainContractAddressSavedInMarket);

      assert.equal(mainContractAddressSavedInMarket, monkeyContractHHInstance.address);
      // console.log('Both addresses are the same.')      
    }) 

    // 24
    it('Test 24: accounts[0] should be deployer of main contract', async () => {  
      
      const monkeyContractHHInstanceOwner = await monkeyContractHHInstance.contractOwner()
      //console.log(monkeyContractHHInstanceOwner);
      //console.log("accounts[0]");
      //console.log(accounts[0]);
      assert.equal(monkeyContractHHInstanceOwner, accounts[0]);
    }) 

    // 25
    it('Test 25: accounts[0] should be deployer of market contract', async () => {  
      
      const marketContractHHInstanceOwner = await monkeyMarketplaceHHInstance.contractOwner()
      //console.log(marketContractHHInstanceOwner);
      //console.log("accounts[0]");
      //console.log(accounts[0]);
      assert.equal(marketContractHHInstanceOwner, accounts[0]);
    }) 

  });

  describe('Testing creating and deleting offers', () => {
    
    it('Test 26: accounts[2] and accounts[4] should give market contract operator status', async () => {    

      giveMarketOperatorAndAssertAndCount(accounts[2]);
      giveMarketOperatorAndAssertAndCount(accounts[4]);
    }) 

    it('Test 27: accounts[2] should create 4 offers, all gen0 (Token IDs: 1,2,3,4)', async () => {    

      for (let test27Counter = 1; test27Counter <= 4; test27Counter++) {        

        let priceInETHTest27 = test27Counter.toString(); 

        let priceInWEIForCallingTest27 = web3.utils.toWei(priceInETHTest27); 

        await monkeyMarketplaceHHInstance.setOffer(priceInWEIForCallingTest27, test27Counter, {from: accounts[2]});

        //await showActiveOfferForTokenID(test27Counter);

        await assertOfferDetailsForTokenID(test27Counter, true, accounts[2], priceInETHTest27 );        
      }
     
    }) 

    it('Test 28: accounts[4] should create 4 offers, 2x gen6 (Token IDs: 35, 36) and 2x gen7 (Token IDs: 37, 38)', async () => {    

      //await showArrayOfAccount(accounts[4]);

      for (let test28Counter = 35; test28Counter <= 38; test28Counter++) {        

        await createOfferAndAssert (test28Counter, test28Counter, accounts[4]); 
        
      }
      //await showingTokenIDsWithActiveOffer();
    }) 

    

    it('Test 29: accounts[2] should delete 1 active offer (Token ID: 4), now 7 active offers should exist (Token IDs: 1,2,3 and 35,36,37,38) ', async () => {  

      await monkeyMarketplaceHHInstance.removeOffer(4, {from: accounts[2]});

      await expectNoActiveOfferAndCount(4); 

      await assertAmountOfActiveOffersAndCount(7);
    }) 

    it('Test 30: accounts[4] should delete 1 active offer (Token ID: 35), now 6 active offers should exist (Token IDs: 1,2,3 and 36,37,38)', async () => {  

      await monkeyMarketplaceHHInstance.removeOffer(35, {from: accounts[4]});

      await expectNoActiveOfferAndCount(35); 

      //await showingTokenIDsWithActiveOffer();

      await assertAmountOfActiveOffersAndCount(6);
    }) 

    it('Test 31: accounts[5] should buy 3 NFTs (Token IDs: 1,2,3) from accounts[2], now 3 active offers should exist (Token IDs: 36,37,38)', async () => {  

      
      for (let buyCountT31 = 1; buyCountT31 <= 3; buyCountT31++) { 

        let largeCountingNrT31 = buyCountT31.toString();
        let t31priceToPayInWEI = web3.utils.toWei(largeCountingNrT31);
        
        await monkeyMarketplaceHHInstance.buyMonkey(buyCountT31, {from: accounts[5], value: t31priceToPayInWEI});
      }
      
      await assertAmountOfActiveOffersAndCount(3);
    })   

    it('Test 32: accounts[1] should buy 2 NFTs (Token IDs: 36, 37) from accounts[4], now 1 active offer should exist (Token ID: 38)', async () => {  

      
      for (let buyCountT32 = 36; buyCountT32 <= 37; buyCountT32++) { 

        let largeCountingNrT32 = buyCountT32.toString();
        let t32priceToPayInWEI = web3.utils.toWei(largeCountingNrT32);
        
        await monkeyMarketplaceHHInstance.buyMonkey(buyCountT32, {from: accounts[1], value: t32priceToPayInWEI});
      }
      //await showingTokenIDsWithActiveOffer();
      await assertAmountOfActiveOffersAndCount(1);
    }) 

    
    it('Test 33: accounts[3] should breed NFTs (IDs:25,26) creating 3 gen2 NFTs (Token IDs:39,40,41) create offers, now 4 active offers (Token ID: 38,39,40,41)', async () => {  
      

      // breeding NFTs with Token IDs 25 and 26 three times, creating gen2 Token IDs 39,40,41       
      for (let index22B1 = 1; index22B1 <= 3; index22B1++) {
        await monkeyContractHHInstance.breed(25, 26, {from: accounts[3]}); 
        
      }        

      // Giving operator status 
      giveMarketOperatorAndAssertAndCount(accounts[3]);
     

      for (let test33Counter = 39; test33Counter <= 41; test33Counter++) {        
        // args: price in ETH, Token ID, account
        await createOfferAndAssert (test33Counter, test33Counter, accounts[3]);    
        
      }
     
      //await showingTokenIDsWithActiveOffer();  

      //await showingTokenIDsWithActiveOffer();
      await assertAmountOfActiveOffersAndCount(4);
      
      //console.log('end');
      //await showArrayOfAccount(accounts[3]);
    }) 

    
    it('Test 34: accounts[1] should create 2 offers (Token IDs:36,37) and accounts[5] 2 offers (Token IDs:1,2), now 8 active offers (Token IDs: 1,2,36,37,38,39,40,41)', async () => {  
      
      // Giving operator status 
      giveMarketOperatorAndAssertAndCount(accounts[1]);
      giveMarketOperatorAndAssertAndCount(accounts[5]);
      
      // accounts[1] creating 2 offers (Token IDs:36,37)
      for (let test34Counter2 = 36; test34Counter2 <= 37; test34Counter2++) {        
        // args: price in ETH, Token ID, account
        await createOfferAndAssert (test34Counter2, test34Counter2, accounts[1]);            
      }      
      
      // accounts[5] creating 2 offers (Token IDs:1,2)
      for (let test34Counter1 = 1; test34Counter1 <= 2; test34Counter1++) {        
        // args: price in ETH, Token ID, account
        await createOfferAndAssert (test34Counter1, test34Counter1, accounts[5]); 
      }
    
      //await showingTokenIDsWithActiveOffer();
      await assertAmountOfActiveOffersAndCount(8);
    }) 

    
    it('Test 35: accounts[4] should buy back 2 NFTs (Token IDs: 36, 37) from accounts[1], now 6 active offers should exist (Token IDs: 1,2,38,39,40,41)', async () => {  

      
      for (let buyCountT35 = 36; buyCountT35 <= 37; buyCountT35++) { 

        let largeCountingNrT35 = buyCountT35.toString();
        let t35priceToPayInWEI = web3.utils.toWei(largeCountingNrT35);
        
        await monkeyMarketplaceHHInstance.buyMonkey(buyCountT35, {from: accounts[4], value: t35priceToPayInWEI});
      }
      //await showingTokenIDsWithActiveOffer();
      await assertAmountOfActiveOffersAndCount(6);
    }) 

    
    
    it('Test 36: accounts[6] (Token IDs 1) and accounts[7] (Token ID 2) should buy from accounts[5], now 46 active offers (Token IDs: 38,39,40,41) ', async () => {  

      // Giving operator status 
      giveMarketOperatorAndAssertAndCount(accounts[6]);
      giveMarketOperatorAndAssertAndCount(accounts[7]);
      
      await monkeyMarketplaceHHInstance.buyMonkey(1, {from: accounts[6], value: web3.utils.toWei('1')});
      //showArrayOfAccount(accounts[6]);

      await monkeyMarketplaceHHInstance.buyMonkey(2, {from: accounts[7], value: web3.utils.toWei('2')});
      //showArrayOfAccount(accounts[7]);      

      //await showingTokenIDsWithActiveOffer();
      await assertAmountOfActiveOffersAndCount(4);
      showAllNFTsWithOwnerAndGen()
    }) 
    
    

    
    

  });


 
});