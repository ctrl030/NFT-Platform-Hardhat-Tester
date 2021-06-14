const MonkeyContract = artifacts.require('MonkeyContract');
const MonkeyMarketplace = artifacts.require('MonkeyMarketplace');
const { expectRevert, expectEvent, balance, BN } = require('@openzeppelin/test-helpers');
const { assert } = require('hardhat');

let monkeyContractHHInstance;
let monkeyMarketplaceHHInstance;

// this array serves as will receive the generated Hardhat addresses,
// i.e. accountToAddressArray[0] will hold the address of accounts[0]
// can be queried by showAllAccounts and findAccountForAddress
let accountToAddressArray = [];

// asserting a specific amount of NFTs for an account
async function assertAmountofNFTs(accToCheck, expectedAmount){
// checking how many NFTs are owned by account 'acc', should be 'amount' 
const prepAmountNFTsAcc = await monkeyContractHHInstance.balanceOf(accToCheck);
const ammountNFTsAcc = parseInt(prepAmountNFTsAcc) ;
assert.equal(ammountNFTsAcc, expectedAmount)
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
  await assertOfferDetailsForTokenID(tokenId, true, fromAccount, priceInETHTesting ); 
}

// expects call to check NFT sell offer to revert with specific error message. Has to count 'revert' still xxxx
async function expectNoActiveOfferAndCount(tokenId) {
  await expectRevert( monkeyMarketplaceHHInstance.getOffer(tokenId), 'No active offer for this tokenId.');       
}

// address 'acc' gives operator status to market and asserts it works.
async function giveMarketOperatorAndAssertAndCount (acc) {
  await monkeyContractHHInstance.setApprovalForAll(monkeyMarketplaceHHInstance.address, true, {from: acc});
  let resultMarketOpTest = await monkeyContractHHInstance.isApprovedForAll(acc, monkeyMarketplaceHHInstance.address);     
  assert.equal(resultMarketOpTest, true);
}

// uses findNFTposition while skipping zero entries and and converting the result to normal number
async function findNFTPositionJS (ownerToQuery, tokenIdtoCheck) {
  if (tokenIdtoCheck !=0){
    
    const positionFoundBN = await monkeyContractHHInstance.findNFTposition(ownerToQuery, tokenIdtoCheck);
    const positionFound = parseInt(positionFoundBN);
  
    //console.log('Token ID: ', tokenIdtoCheck, ' should be in the _owners2tokenIdArrayMapping of', findAccountForAddress(ownerToQuery),'in this position: ', positionFound);
  
    return positionFound;

  } else {
    console.log(' Error, trying to lookup Token ID Zero, but burnt/zero address is not in accounts.')
  }	
}  

// controls MonkeyIdPositionsMapping by comparing it's results to _owners2tokenIdArrayMapping
// should be called passing amount and an spreading array of expected tokenId, for ex.:
async function assertPosIntegrAllNFTs(){

  // this many NFTs exist
  const totalSupplyAmount = parseInt(await monkeyContractHHInstance.showTotalSupply());   

  // asserting the Zero Monkey was burnt and owned by Zero Address
  const zeroMonkeyOwner = await monkeyContractHHInstance.ownerOf(0);
  assert.equal(zeroMonkeyOwner, '0x0000000000000000000000000000000000000000');
  
  // looping through all NFTs that exist 
  for (let assertAllIndex = 1; assertAllIndex < totalSupplyAmount; assertAllIndex++) {

    //console.log('Looking up NFT with Token ID:', assertAllIndex);
    
    // looking up owner
    let ownerAccount = await monkeyContractHHInstance.ownerOf(assertAllIndex);
    const readableOwner = findAccountForAddress(ownerAccount);
    //console.log('NFT with Token ID:', assertAllIndex, ' is owned by', readableOwner);
    
    // creating array to compare index to
    // using _owners2tokenIdArrayMapping as control variable to compare against
    // getting the owner's array of NFTs (without 0 entries, and converted to normal numbers) from: _owners2tokenIdArrayMapping
    let arrayOfFoundNFTs = await getNFTArrayOfAccount(ownerAccount);    
    //showArrayOfAccount(ownerAccount);
     
    // looking up this NFT, using address and tokenId, in the MonkeyIdPositionsMapping
    const positionFound = await findNFTPositionJS(ownerAccount, assertAllIndex);

    //console.log('Token ID', assertAllIndex, 'should be found in this position:', positionFound);

    // checking the _owners2tokenIdArrayMapping at the position that was found in the MonkeyIdPositionsMapping
    const tokenFound = arrayOfFoundNFTs[positionFound];    
    
    assert.equal(tokenFound, assertAllIndex);    
    //console.log('Token ID', assertAllIndex, 'was in the correct position');
    //console.log('-------------------------');
  }
}

// deep comparing an array of Token IDs to the queried array in the _owners2tokenIdArrayMapping
// for now must have "let collectingArray = []; " state variable, can't send list that will be kept, only 1 arg per run
let collectingArray = []; // put into global scope
async function deepCompareNFTArray (accountToTest, expectedArray) {

  // the collecting array in global scope receives the incoming expectedArray
  collectingArray = expectedArray;
  
  // looking up the accounts NFT array in the _owners2tokenIdArrayMapping 
  const queriedArray = await getNFTArrayOfAccount(accountToTest);

  // comparing both arrays
  assert.deepEqual(queriedArray, collectingArray);

  //console.log('NFT array of', findAccountForAddress(accountToTest), 'is exactly as expected.');

  // resetting the collectingArray to empty
  collectingArray = [];
}

// uses assertOwnerMapping to check _monkeyIdsAndTheirOwnersMapping 
// and assertPosOfSpecificNFTinArray to check MonkeyIdPositionsMapping 
async function assertNFTArrIntegrityWPositions(accountToTest, expectedArray) {

  // looping through the incoming expectedArray 
  for (let index = 0; index < expectedArray.length; index++) {

    const tokenIdFoundInExpectedArr = expectedArray[index];

    // skipping deleted entries, i.e. entries with Token ID 0 
    if (tokenIdFoundInExpectedArr !=0) {
      await assertOwnerMapping(tokenIdFoundInExpectedArr, accountToTest);
      await assertPosOfSpecificNFTinArray(accountToTest, tokenIdFoundInExpectedArr, expectedArray);
    }     
  }
}

// asserting correct MonkeyIdPositionsMapping entries
async function assertPosOfSpecificNFTinArray(accountToTest, tokenIdtoCheck, expectedArray) {

  const positionFound = await findNFTPositionJS(accountToTest,tokenIdtoCheck);  

  // checking the incoming array at the position that was found in the MonkeyIdPositionsMapping
  const tokenFound = expectedArray[positionFound];

  assert.equal(tokenFound, tokenIdtoCheck);

}

// asserts integrity between an owners _owners2tokenIdArrayMapping and their MonkeyIdPositionsMapping for a incoming tokenIdtoCheck
async function assertPositionIntegrityOfSpecificNFT(tokenIdtoCheck){

  let foundOwner = await monkeyContractHHInstance.ownerOf(tokenIdtoCheck);

  console.log('Token ID: ', tokenIdtoCheck, 'is owned by: ', findAccountForAddress(foundOwner)); 

  // using _owners2tokenIdArrayMapping as control variable to compare against
  // getting the owner's array of NFTs (without 0 entries, and converted to normal numbers) from: _owners2tokenIdArrayMapping
  let arrayOfFoundNFTs = await getNFTArrayOfAccount(foundOwner);
  console.log('This is their _owners2tokenIdArrayMapping: ', findAccountForAddress(foundOwner));
  console.log('Looking up position in MonkeyIdPositionsMapping for Token ID:', tokenIdtoCheck);

  // looking up this NFT, using address and tokenId, in the MonkeyIdPositionsMapping
  const positionFound = await findNFTPositionJS(foundOwner,tokenIdtoCheck);  

  // checking the _owners2tokenIdArrayMapping at the position that was found in the MonkeyIdPositionsMapping
  const tokenFound = arrayOfFoundNFTs[positionFound];

  assert.equal(tokenFound, tokenIdtoCheck);
}

// asserting correct entry in all 4 NFT trackers
async function assertAllFourTrackersCorrect (accToQuery, expectedAmount, expectedArray) {

  // asserts correct amount entry in _numberOfNFTsOfAddressMapping
  await assertAmountofNFTs(accToQuery, expectedAmount);

  // asserts exactly same array as expectedArray in _owners2tokenIdArrayMapping
  await deepCompareNFTArray (accToQuery, expectedArray);

  // asserts correct ownership entry in _monkeyIdsAndTheirOwnersMapping 
  // asserts correct position in MonkeyIdPositionsMapping 
  await assertNFTArrIntegrityWPositions(accToQuery, expectedArray);  
} 

// asserting ownership entry in _monkeyIdsAndTheirOwnersMapping via ownerOf 
async function assertOwnerMapping(tokenIdTocheck, expectedOwnerAcc){
 const checkedTokenIdOwner = await monkeyContractHHInstance.ownerOf(tokenIdTocheck);
 assert.equal(checkedTokenIdOwner, expectedOwnerAcc);
}

// querying an accounts NFT array entry in _owners2tokenIdArrayMapping via findMonkeyIdsOfAddress
async function getNFTArrayOfAccount(acc){
  // outer array holds 1 element: the inner array with BN elements
  const bigNrAccOutArr = [];
  bigNrAccOutArr.push(await monkeyContractHHInstance.findMonkeyIdsOfAddress(acc));

  // inner array holds BN elements
  const bigNrAccInArr = bigNrAccOutArr[0];    
  const convertedNumArr = [];

  // converting BN to numbers and pushing to array convertedNumArr
  for (let testC = 0; testC < bigNrAccInArr.length; testC++) {                   
           
    const bigNrToConvert = bigNrAccInArr[testC];
    const convertedNrToPush = parseInt(bigNrToConvert);
    convertedNumArr.push( convertedNrToPush ); 
    
  }      
  //console.log(findAccountForAddress(acc)  +' has this NFT array: ');
  //console.log(convertedNumArr);  

  return convertedNumArr;
}

// assert balance of account
async function assertBalanceAsBN(acc, expectedBalanceInWEIasBN) {

  const balanceInWEI = await web3.eth.getBalance(acc); 
  //const balanceInWEIasBN = new BN(balanceInWEI);

  const parsedExpected = parseInt(expectedBalanceInWEIasBN);
  console.log('Incoming parsed: parsedExpected:', parsedExpected);

  console.log('Incoming: expectedBalanceInWEIasBN', expectedBalanceInWEIasBN);
  console.log('Result: balanceInWEI:', balanceInWEI);
  //console.log('Result: balanceInWEIasBN:', balanceInWEIasBN);  

  assert.equal(balanceInWEI, expectedBalanceInWEIasBN);
}








// show X - functions to console.log

// for testing/debugging: shows all accounts and their addresses
// is querying the copied addresses in accountToAddressArray
async function showAllAccounts(){
  for (let ind = 0; ind < accountToAddressArray.length; ind++) {
    console.log("accounts[" +`${ind}`+ "] is: " + accountToAddressArray[ind])
  }  
};

// for testing/debugging: looking up the accounts[] variable for an address
function findAccountForAddress(addressToLookup){
  for (let findInd = 0; findInd < accountToAddressArray.length; findInd++) {
    if (accountToAddressArray[findInd] == addressToLookup) {
      return "accounts[" +`${findInd}`+ "]"
    } else if (addressToLookup== '0x0000000000000000000000000000000000000000' ) {
      return "Zero address: 0x0000000000000000000000000000000000000000 => i.e. it was burnt"      
    }       
  }  
};

// for testing/debugging: show the NFT array of an account
async function showArrayOfAccount(acc){

  const readableAcc = findAccountForAddress(acc);

  const amountOfTestingAcc = parseInt( await monkeyContractHHInstance.balanceOf(acc));

  console.log(readableAcc , 'has this many NFTs:', amountOfTestingAcc);
        
  // this will receive the incoming array
  const bigNrAccOutArr = [];

  // outer array holds 1 element, at index 0: the inner array with BN elements
  bigNrAccOutArr.push(await monkeyContractHHInstance.findMonkeyIdsOfAddress(acc));

  // inner array holds BN elements at index 0
  const bigNrAccInArr = bigNrAccOutArr[0];    
  const convertedNumArr = [];

  // converting BN to numbers and pushing to array convertedNumArr
  for (let testC = 0; testC < bigNrAccInArr.length; testC++) {                   
          
    const bigNrToConvert = bigNrAccInArr[testC];
    const convertedNrToPush = parseInt(bigNrToConvert);
    convertedNumArr.push( convertedNrToPush ); 
    
  }      
  console.log( readableAcc +' has this NFT array: ');
  console.log(convertedNumArr);  
}

// for testing/debugging: show owner and generation for an NFT
async function showOwnerAndGeneration(tokenIdToTest){
  let testOwnAndGenDetails  = await monkeyContractHHInstance.getMonkeyDetails(tokenIdToTest); 
  console.log('NFT with Token ID: ' + tokenIdToTest);    
  console.log( 'is owned by: ' + findAccountForAddress(testOwnAndGenDetails.owner)); 
  console.log( 'and is gen' + parseInt(testOwnAndGenDetails.generation) );
  console.log('-------------------');
}

// for testing/debugging: show owner and generation for all NFTs
async function showAllNFTsWithOwnerAndGen() {
  let totalAmount = await monkeyContractHHInstance.totalSupply();
  for (let showAllInd = 0; showAllInd < totalAmount; showAllInd++) {          
    showOwnerAndGeneration(showAllInd);
  }
}

// for testing/debugging: shows active offer for Token ID, if one exists
async function showActiveOfferForTokenID(tokenId) {

  let offerTestingResult = await monkeyMarketplaceHHInstance.getOffer(tokenId);  
  let offerTRIndex = parseInt(offerTestingResult.index);      

  console.log('Offer Nr.: ' + offerTRIndex + ' Token ID: ' + parseInt(offerTestingResult.tokenId));
  console.log('Offer Nr.: ' + offerTRIndex + ' Active: ' + offerTestingResult.active);
  console.log('Offer Nr.: ' + offerTRIndex + ' Index: ' + offerTRIndex);
  console.log('Offer Nr.: ' + offerTRIndex + ' Seller: ' + findAccountForAddress(offerTestingResult.seller));

  let priceInWEITestingResult = parseInt(offerTestingResult.price); 
  console.log('Offer Nr.: ' + offerTRIndex + ' Price in WEI: ' + priceInWEITestingResult );  

  let priceInETHTestingResult = web3.utils.fromWei(priceInWEITestingResult.toString()); 
  console.log('Offer Nr.: ' + offerTRIndex + ' Price in ETH: ' + priceInETHTestingResult );  
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
async function assertAmountOfActiveOffersAndCount(expectedAmount, expectedTokensArray) {
  const actOffersBNArr = await monkeyMarketplaceHHInstance.getAllTokenOnSale();
  const activeOffersAmount = actOffersBNArr.length;

  const convertedNumArr = [];

  // converting BN to numbers and pushing to array convertedNumArr
  for (let counter = 0; counter < activeOffersAmount; counter++) {                   
          
    const bigNrToConvert = actOffersBNArr[counter];
    const convertedNrToPush = parseInt(bigNrToConvert);
    convertedNumArr.push( convertedNrToPush ); 
    
  }      
  assert.deepEqual(convertedNumArr, expectedTokensArray);
  
  assert.equal(activeOffersAmount, expectedAmount);
}

// Main contract Hardhat test with openzeppelin, Truffle and web3
contract('MonkeyContract with HH', accounts => {

  // deploying the main smart contract: MonkeyContract
  before(async()=> {    

    // making a copy of the account addresses to accountToAddressArray
    for (let accIndex = 0; accIndex < accounts.length ; accIndex++) {
      accountToAddressArray[accIndex] = accounts[accIndex];    
    }

    // deploying the main smart contract: MonkeyContract
    monkeyContractHHInstance = await MonkeyContract.new();    
    
  });

  describe('Testing correct deployment', () => {     

    
    it('Test 1: accounts[0] should be deployer of main contract', async () => {  
      
      const monkeyContractHHInstanceOwner = await monkeyContractHHInstance.contractOwner()
      
      assert.equal(monkeyContractHHInstanceOwner, accounts[0]);
    }) 

    it('Test 1A: getMonkeyContractAddress() should show the correct address of deployed main contract', async () => {  
      
      const callTestedAddress = await monkeyContractHHInstance.getMonkeyContractAddress();   
      assert.equal(callTestedAddress, monkeyContractHHInstance.address);

    })    
    
    it('Test 2: _name should be "Crypto Monkeys"', async () => {  
      // console.log(monkeyContractHHInstance._name)
      assert.equal(await monkeyContractHHInstance.name(), 'Crypto Monkeys')        
    })

    
    it('Test 3: _symbol should be "MONKEY"', async () => {
      assert.equal(await monkeyContractHHInstance.symbol(), 'MONKEY')      
    })              
    
    
    it('Test 4: GEN0_Limit should be 12', async() => {  
      //console.log('Console.log is available here')
      const limit = await monkeyContractHHInstance.GEN0_Limit();
      //console.log('GEN0_Limit is', Number(limit));
      assert.equal(limit, 12); 
    });

     
    it('Test 5: There should be one Zero Monkey in the array after deployment', async () => {  
      const totalSupplyAfterDeployment = await monkeyContractHHInstance.showTotalSupply();
      //const zeroMonkeytest1 = await monkeyContractHHInstance.getMonkeyDetails(0);
      //console.log(zeroMonkeytest1);
      assert.equal(totalSupplyAfterDeployment, 1);
    });
    
    
    it('Test 6: Zero Monkey should be owned by zero address', async () => {  
      const zeroMonkeytest2 = await monkeyContractHHInstance.ownerOf(0);      
      assert.equal(zeroMonkeytest2, 0x0000000000000000000000000000000000000000)  
    });

    
    it('Test 7: Zero Monkey should be over 9000', async () => { 
      const zeroMonkeytest3 = await monkeyContractHHInstance.getMonkeyDetails(0);
      const zeroGenesNumber = zeroMonkeytest3.genes.toNumber();
      // console.log(zeroGenesNumber);
      assert.equal(zeroGenesNumber, 1214131177989271)
      //console.log('Zero monkey is over 9000')
    }); 
  })

  describe('Testing main contract: NFT creation and transfers', () => {      

    
    it('Test 8: accounts[0] should create 9 gen0 monkeys with DNA matching their index/tokenId', async() => {  
         
      // this loop will create 9 gen0 NFTs, each with a DNA string consisting of repeated, concatted NFT tokenId
      // i.e. 1111111111111111 for the NFT with tokenId 1
      // it will also check the emitted MonkeyCreated event each time and check if the emitted DNA string is correct as well
      for (let i = 1; i < 10; i++) {
        
        const concattedIndexes = `${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}` 
        
        
        const receipt = await monkeyContractHHInstance.createGen0Monkey(concattedIndexes, {from: accounts[0]});        
        expectEvent(receipt, 'MonkeyCreated', { genes: `${concattedIndexes}` });
        
        const genesTestedDetails = await monkeyContractHHInstance.getMonkeyDetails(i);
        const genesTested = parseInt(genesTestedDetails.genes);
        const compareConcats = parseInt(concattedIndexes); 
        assert.equal(genesTested, compareConcats)       
        
        // checking how many NFTs are owned by accounts[0] after each loop
        const prepAmountNFTsForAccounts0 = await monkeyContractHHInstance.balanceOf(accounts[0]);
        const amountNFTsForAccounts0 = parseInt(prepAmountNFTsForAccounts0) ;        
        assert.equal(amountNFTsForAccounts0, i)
      }

      // checking total supply of NFTs, should be 10, one Zero Monkey plus 9 gen0
      const totalSupplyAfterCreating10 = await monkeyContractHHInstance.totalSupply();      
      assert.equal(totalSupplyAfterCreating10, 10);      
      
      const account0ArrayToAssert = [1, 2, 3, 4, 5, 6, 7, 8, 9 ];
      await assertAllFourTrackersCorrect (accounts[0], 9,  account0ArrayToAssert);

    });

    
    it('Test 9: accounts[0] should create 2 additional gen0 monkeys, bringing totalSupply to 12, of which 11 gen0', async() => { 

      // this loop will create 2 gen0 NFTs, each with a DNA string of 1111111111111111
      // it will also check the emitted MonkeyCreated event each time and check if the emitted DNA string is correct as well
      for (let i = 0; i < 2; i++) {              
        const receipt2 =  await monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]});  
        
        // checking if genes string is as expected in NFTs with Token ID 10 and 11
        const correctTokenID = i + 10
        const genesTestedDetails = await monkeyContractHHInstance.getMonkeyDetails(correctTokenID);
        const genesTested = parseInt(genesTestedDetails.genes); 
        const correctGenes = parseInt(1111111111111111)
        assert.equal(genesTested, correctGenes);        

        // checking if MonkeyCreated event was correctly triggered
        expectEvent(receipt2, 'MonkeyCreated', { genes: `${correctGenes}` }); 
        
        // checking how many NFTs are owned by accounts[0] after each loop
        const prepAmountNFTsForAccounts0 = await monkeyContractHHInstance.balanceOf(accounts[0]);
        const amountNFTsForAccounts0 = parseInt(prepAmountNFTsForAccounts0) ;
        //console.log(amountNFTsForAccounts0);
        assert.equal(amountNFTsForAccounts0, correctTokenID)
      }
      const totalSupplyAfterCreating12 = await monkeyContractHHInstance.totalSupply();      
      assert.equal(parseInt(totalSupplyAfterCreating12), 12);        
      
      const account0ArrayToAssert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
      await assertAllFourTrackersCorrect (accounts[0], 11,  account0ArrayToAssert);

    });
    
    it('Test 10: accounts[1] should try to create NFT, but is not authorized, should fail', async() => {             
        
      await expectRevert.unspecified(
        monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[1]})
      );      

      const account0ArrayToAssert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
      await assertAllFourTrackersCorrect (accounts[0], 11,  account0ArrayToAssert);
       
    });
    
    it('Test 11: accounts[0] should create NFT, filling gen0 limit (of 12), bringing totalSupply to 13 (incl. Zero Monkey)', async() => {         
      await monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]})      
      
      // checking how many NFTs are owned by accounts[0], should be 12
      const prepAmountNFTsForAccounts0 = await monkeyContractHHInstance.balanceOf(accounts[0]);
      const amountNFTsForAccounts0 = parseInt(prepAmountNFTsForAccounts0) ;
      
      assert.equal(amountNFTsForAccounts0, 12)

      const totalSupplynow2 = await monkeyContractHHInstance.showTotalSupply();    
      assert.equal(parseInt(totalSupplynow2), 13);

      const account0ArrayToAssert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ];
      await assertAllFourTrackersCorrect (accounts[0], 12,  account0ArrayToAssert);

    });
    
    it('Test 12: Limit is reached, creating another NFT should fail', async() => {             
        
      await expectRevert.unspecified(
        monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]})
      );      

      const account0ArrayToAssert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ];
      await assertAllFourTrackersCorrect (accounts[0], 12,  account0ArrayToAssert);
      
    });
    
    it('Test 13: accounts[0] should give accounts[1] operator status', async() => {  
      
      // Giving operator status 
      await monkeyContractHHInstance.setApprovalForAll(accounts[1], true, {from: accounts[0]});

      const operatorGivenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
       
      assert.equal(operatorGivenApprovalTesting, true);
     
    });

    it('Test 14: accounts[0] should take operator status away from accounts[1]', async() => {  
      await monkeyContractHHInstance.setApprovalForAll(accounts[1], false, {from: accounts[0]});
      
      const operatorTakenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
           
      // console.log('operator status for accounts[1] is:', operatorTakenApprovalTesting);    
      
      assert.equal(operatorTakenApprovalTesting, false);
    });

    it('Test 15: accounts[0] should give accounts[1] operator status again', async() => {  

      // Giving operator status 
      await monkeyContractHHInstance.setApprovalForAll(accounts[1], true, {from: accounts[0]});

      const operatorGivenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
        
      assert.equal(operatorGivenApprovalTesting, true);     
    });

    it('Test 15A: accounts[0] should use safeTransferFrom with sending data to move Token ID 1 from itself to accounts[2]', async() => {  
      
      await monkeyContractHHInstance.safeTransferFrom(accounts[0], accounts[2], 1, '0xa1234');      

      const testingMonkey = await monkeyContractHHInstance.getMonkeyDetails(1);
      
      assert.equal(testingMonkey.owner, accounts[2]);      

      await assertPosIntegrAllNFTs();

      const account0ArrayToAssert = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ];
      await assertAllFourTrackersCorrect (accounts[0], 11, account0ArrayToAssert);

      const account2ArrayToAssert = [1];
      await assertAllFourTrackersCorrect (accounts[2], 1, account2ArrayToAssert);
      
    });


    it('Test 16: as operator, accounts[1] should use transferFrom to move 4 NFTs with Token IDs 2-5 from accounts[0] to accounts[2]', async() => {  
      
      for (let index = 2; index <= 5; index++) {
        await monkeyContractHHInstance.transferFrom(accounts[0], accounts[2], `${index}`, { 
          from: accounts[1],
        });

        const testingMonkey = await monkeyContractHHInstance.getMonkeyDetails(index);
      
        assert.equal(testingMonkey.owner, accounts[2]);        
      }

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 6, 7, 8, 9, 10, 11, 12 ];
      await assertAllFourTrackersCorrect (accounts[0], 7,  account0ArrayToAssert);

      const account1ArrayToAssert = [];
      await assertAllFourTrackersCorrect (accounts[1], 0,  account1ArrayToAssert);

      const account2ArrayToAssert = [1, 2, 3, 4, 5];
      await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);
      
    });

    it('Test 16A: as operator, accounts[1] should use transferFrom to take 7 NFTs with Token IDs 6-12 from accounts[0]', async() => {  
      
      for (let index = 6; index <= 12; index++) {
        await monkeyContractHHInstance.transferFrom(accounts[0], accounts[1], `${index}`, { 
          from: accounts[1],
        });

        const testingMonkey = await monkeyContractHHInstance.getMonkeyDetails(index);
      
        assert.equal(testingMonkey.owner, accounts[1]);        
      }

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [6, 7, 8, 9, 10, 11, 12];
      await assertAllFourTrackersCorrect (accounts[1], 7,  account1ArrayToAssert);

      const account2ArrayToAssert = [1, 2, 3, 4, 5];
      await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);
      
    });

    it('Test 17: accounts[1] should give exclusive allowance for the NFT with Token ID 7 to accounts[2]', async() => {  
      const receipt = await monkeyContractHHInstance.approve(accounts[2], 7, {from: accounts[1]});
      const testingMonkeyNr7 = await monkeyContractHHInstance.getMonkeyDetails(7);

      assert.equal(testingMonkeyNr7.approvedAddress, accounts[2]);

    });

    it('Test 18: getApproved should confirm exclusive allowance for NFT with Token ID 7', async() => { 

      const testingAllowedAddressForMonkeyId7 = await monkeyContractHHInstance.getApproved(7);

      assert.equal(testingAllowedAddressForMonkeyId7, accounts[2]);

    });
    
    
    it('Test 19: accounts[2] should use transferFrom to take the allowed NFT with Token ID 7 from accounts[1]', async() => {       
      await monkeyContractHHInstance.transferFrom(accounts[1], accounts[2], 7, {from: accounts[2]});

      const testingMonkeyNr7 = await monkeyContractHHInstance.getMonkeyDetails(7);

      assert.equal(testingMonkeyNr7.owner, accounts[2]);

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [6, 0, 8, 9, 10, 11, 12];
      await assertAllFourTrackersCorrect (accounts[1], 6,  account1ArrayToAssert);

      const account2ArrayToAssert = [1, 2, 3, 4, 5, 7];
      await assertAllFourTrackersCorrect (accounts[2], 6,  account2ArrayToAssert);

    });

    
    it('Test 20: accounts[1] should use transfer to send NFT with Token ID 6 to accounts[3]' , async() => {       
      await monkeyContractHHInstance.transfer(accounts[3], 6, { 
        from: accounts[1],
      });

      const testingMonkeyNr6 = await monkeyContractHHInstance.getMonkeyDetails(6);
      
      assert.equal(testingMonkeyNr6.owner, accounts[3]);

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
      await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

      const account2ArrayToAssert = [1, 2, 3, 4, 5, 7];
      await assertAllFourTrackersCorrect (accounts[2], 6,  account2ArrayToAssert);

      const account3ArrayToAssert = [6];
      await assertAllFourTrackersCorrect (accounts[3], 1,  account3ArrayToAssert);

    });
    
    // 21 is skipped, 15A does a simpler version, via default call being from accounts[0], i.e. needing 1 less argument
    // might be due to hardhat, truffle, etc being so new
    // accepts 4 arguments (either without data or targeting an instance with predefined {from: accounts[PREDEFINED_ARRAY_INDEX]})
    // but when given 5 (i.e.  with data plus custom defined account in contract call) throws and says: "Error: Invalid number of parameters for "safeTransferFrom". Got 5 expected 3!"
    // complicating factor maybe: two functions exist under the name "safeTransferFrom", one accepting 4 arguments, the other only 3, setting the fourth to ''
    it.skip('Test 21: accounts[2] should use safeTransferFrom to move NFT with Token ID 5 from accounts[2] to accounts[3] and also send in data', async() => {       
      await monkeyContractHHInstance.safeTransferFrom(accounts[2], accounts[3], 5, '0xa1234', { 
        from: accounts[2],
      });

      const testingMonkey5 = await monkeyContractHHInstance.getMonkeyDetails(5);

      //console.log('accounts[3] is', accounts[3]) 
      //console.log('testingMonkey5.owner is', testingMonkey5.owner);

      assert.equal(testingMonkey5.owner, accounts[3]);
    });
    
    it('Test 21Placeholder: accounts[2] should use safeTransferFrom to move NFT with Token ID 5 from accounts[2] to accounts[3] (test cant send data atm, fix test 21)', async() => {       
      await monkeyContractHHInstance.safeTransferFrom(accounts[2], accounts[3], 5, { 
        from: accounts[2],
      });

      const testingMonkey5 = await monkeyContractHHInstance.getMonkeyDetails(5);

      //console.log('accounts[3] is', accounts[3]) 
      //console.log('testingMonkey5.owner is', testingMonkey5.owner);

      assert.equal(testingMonkey5.owner, accounts[3]);

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
      await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

      const account2ArrayToAssert = [1, 2, 3, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);

      const account3ArrayToAssert = [6, 5];
      await assertAllFourTrackersCorrect (accounts[3], 2,  account3ArrayToAssert);


    });

  })

  describe('Testing main contract: Breeding', () => {     
   
    it('Test 22: accounts[3] should breed NFT monkeys (Token IDs:5,6) 14 times. ', async() => {  
            
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
         
        
          // comparing first 2 digits of genes
          //let stringOfNFTGenesNow = newMonkeyTokenIdTestingDetails.genes.toString();
          //console.log('Breed Nr.' + index + ' genes are ' + stringOfNFTGenesNow);  
          /*firstTwoDigitsNFTNow = parseInt(stringOfNFTGenesNow.charAt(0)+stringOfNFTGenesNow.charAt(1));
          //console.log('Breed Nr.' + index + ' first 2 gene digits LAST are ' + firstTwoDigitsNFTLast); 
          //console.log('Breed Nr.' + index + ' first 2 gene digits NOW are ' + firstTwoDigitsNFTNow);  
          assert.notEqual(firstTwoDigitsNFTNow, firstTwoDigitsNFTLast);

          // the 'NFT to check now' becomes the 'last NFT checked' for next loop
          firstTwoDigitsNFTLast = firstTwoDigitsNFTNow;*/
        

        // checking if contract owner is owner of NFT
        assert.equal(newMonkeyTokenIdTestingDetails.owner, accounts[3]); 
        
        // checking how many NFTs are owned by accounts[3] at the start, should be increasing, starting with 3, go up to 16
        const loopPrepAmountNFTsForAccounts3 = await monkeyContractHHInstance.balanceOf(accounts[3]);
        const loopAmountNFTsForAccounts3 = parseInt(loopPrepAmountNFTsForAccounts3);        
        assert.equal(loopAmountNFTsForAccounts3, index + 2);
      }
      
      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
      await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

      const account2ArrayToAssert = [1, 2, 3, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);

      const account3ArrayToAssert = [6,5,13,14,15,16,17,18,19,20,21,22,23,24,25,26];
      await assertAllFourTrackersCorrect (accounts[3], 16,  account3ArrayToAssert);


    });

    it('Test 22A: accounts[3] should use safeTransferFrom to move 4 NFTs from itself to accounts[4]. Token IDs 5 and 6 (gen0) and Token IDs 14 and 15 (gen1)' , async() => {       
      // transferring Token ID 5
      await monkeyContractHHInstance.safeTransferFrom(accounts[3], accounts[4], 5, { 
        from: accounts[3],
      });  
      // querying Token details and comparing owenership to new account
      const testingMonkeyNr5 = await monkeyContractHHInstance.getMonkeyDetails(5);        
      assert.equal(testingMonkeyNr5.owner, accounts[4]);

      // repeat for Token ID 6
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


      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
      await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

      const account2ArrayToAssert = [1, 2, 3, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);

      // accounts[3], should have 12 (2 gen0 have been sent, also Token IDs 14 and 15, i.e. 12 left of 14 bred)
      const account3ArrayToAssert = [0,0,13,0,0,16,17,18,19,20,21,22,23,24,25,26];
      await assertAllFourTrackersCorrect (accounts[3], 12,  account3ArrayToAssert);

      // accounts[4] should have 4 NFTs at this point: 5, 6, 14, 15
      const account4ArrayToAssert = [5, 6, 14, 15];
      await assertAllFourTrackersCorrect (accounts[4], 4,  account4ArrayToAssert);



    });   

    
    it('Test 22B: accounts[4] should use breed to create 2 NFTs each of gen2, gen3, gen4, gen5, gen6 and gen7, i.e. should have 16 NFTs at the end (2x gen0 - 2x gen7) ' , async() => { 

      // breeding NFTs with Token IDs 14 and 15, creating gen2: Token IDs 27 and 28       
      for (let index22B1 = 14; index22B1 <= 15; index22B1++) {
        await monkeyContractHHInstance.breed(14, 15, {from: accounts[4]}); 
        
      }        
      
      assertOwnerAndGeneration(accounts[4], 27, 2);
      assertOwnerAndGeneration(accounts[4], 28, 2);

      // starting with gen2 for breeding NFTs with Token IDs 27 and 28 
      let test22Bgeneration = 3;
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

        /*console.log('test22BFirstParentIdCounter ' + test22BFirstParentIdCounter);
        console.log('test22BSecondParentIdCounter ' + test22BSecondParentIdCounter);

        console.log('first child ID: ' + (test22BFirstParentIdCounter+2));
        console.log('second child ID: ' + (test22BSecondParentIdCounter+2));

        console.log('test22Bgeneration of children: ' + test22Bgeneration);
        console.log('-------------------- ' );*/
        
        await assertOwnerAndGeneration(accounts[4], test22BFirstParentIdCounter+2, test22Bgeneration);
        await assertOwnerAndGeneration(accounts[4], test22BSecondParentIdCounter+2, test22Bgeneration) ;   
        
        test22Bgeneration++;          
        test22BFirstParentIdCounter = test22BFirstParentIdCounter +2;    
        test22BSecondParentIdCounter = test22BFirstParentIdCounter+1;    
      }      

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
      await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

      const account2ArrayToAssert = [1, 2, 3, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);

      const account3ArrayToAssert = [0,0,13,0,0,16,17,18,19,20,21,22,23,24,25,26];
      await assertAllFourTrackersCorrect (accounts[3], 12,  account3ArrayToAssert);

      // expecting 16 NFTs, 4 from before (5,6,14,15) plus 2 bred gen2 (27,28) plus 10 bred gen3-gen7 (5 loops of 2)
      const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];
      await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);
      
    });
  });

});

// Market contract Hardhat test with openzeppelin, Truffle and web3
contract("MonkeyContract + MonkeyMarketplace with HH", accounts => {

  // Before running the tests, deploying a new MonkeyMarketplace 
  before(async()=> {
    // deploying the marketplace smart contract: MonkeyMarketplace and getting the address of the MonkeyContract for the marketplace constructor
    monkeyMarketplaceHHInstance = await MonkeyMarketplace.new(monkeyContractHHInstance.address);    
   
  });

  describe('Testing correct deployment', () => {
    
    it('Test 23: Market should know main contract address', async () => {        
      const mainContractAddressSavedInMarket = await monkeyMarketplaceHHInstance.returnMonkeyContract();      
      assert.equal(mainContractAddressSavedInMarket, monkeyContractHHInstance.address);     
    }) 
 
    it('Test 24: accounts[0] should be deployer of main contract', async () => {        
      const monkeyContractHHInstanceOwner = await monkeyContractHHInstance.contractOwner()      
      assert.equal(monkeyContractHHInstanceOwner, accounts[0]);
    }) 
    
    it('Test 25: accounts[0] should be deployer of market contract', async () => {        
      const marketContractHHInstanceOwner = await monkeyMarketplaceHHInstance.contractOwner()     
      assert.equal(marketContractHHInstanceOwner, accounts[0]);
    }) 

  });

  describe('Testing creating and deleting offers', () => {
    
    it('Test 26: accounts[2] and accounts[4] should give market contract operator status', async () => {    

      giveMarketOperatorAndAssertAndCount(accounts[2]);
      giveMarketOperatorAndAssertAndCount(accounts[4]);
    }) 

    it('Test 27: accounts[2] should create 4 offers, all gen0 (Token IDs: 1,2,3,4), prices in ETH same as Token ID', async () => {    

      for (let test27Counter = 1; test27Counter <= 4; test27Counter++) {        

        let priceInETHTest27 = test27Counter.toString(); 

        let priceInWEIForCallingTest27 = web3.utils.toWei(priceInETHTest27); 

        await monkeyMarketplaceHHInstance.setOffer(priceInWEIForCallingTest27, test27Counter, {from: accounts[2]});        

        await assertOfferDetailsForTokenID(test27Counter, true, accounts[2], priceInETHTest27 );        
      }

      const offersArray = [1, 2, 3, 4];
      await assertAmountOfActiveOffersAndCount(4, offersArray);
     
    }) 

    it('Test 28: accounts[4] should create 4 offers, 2x gen6 (Token IDs: 35, 36) and 2x gen7 (Token IDs: 37, 38)', async () => {  
      for (let test28Counter = 35; test28Counter <= 38; test28Counter++) {        
        await createOfferAndAssert (test28Counter, test28Counter, accounts[4]);         
      }     
      const offersArray = [1, 2, 3, 4, 35, 36, 37, 38];
      await assertAmountOfActiveOffersAndCount(8, offersArray);
    }) 

    it('Test 29: accounts[2] should delete 1 active offer (Token ID: 4), now 7 active offers should exist (Token IDs: 1,2,3 and 35,36,37,38) ', async () => {  
      await monkeyMarketplaceHHInstance.removeOffer(4, {from: accounts[2]});
      await expectNoActiveOfferAndCount(4); 
      const offersArray = [1, 2, 3, 35, 36, 37, 38];
      await assertAmountOfActiveOffersAndCount(7, offersArray);
    }) 

    it('Test 30: accounts[4] should delete 1 active offer (Token ID: 35), now 6 active offers should exist (Token IDs: 1,2,3 and 36,37,38)', async () => {  
      await monkeyMarketplaceHHInstance.removeOffer(35, {from: accounts[4]});
      await expectNoActiveOfferAndCount(35);    
      const offersArray = [1, 2, 3, 36, 37, 38];
      await assertAmountOfActiveOffersAndCount(6, offersArray);
    }) 
  });

  describe('Testing buying and full market functionality', () => { 

    it('Test 31: accounts[5] should buy 3 NFTs (Token IDs: 1,2,3) from accounts[2], now 3 active offers should exist (Token IDs: 36,37,38)', async () => {  
        for (let buyCountT31 = 1; buyCountT31 <= 3; buyCountT31++) { 

        // balance in WEI before buy
        const balanceInWEIBefore = await web3.eth.getBalance(accounts[5]);       
        //console.log('accounts[5] has', parseInt(balanceInWEIBefore), 'WEI before buying Token ID', buyCountT31) 

        // balance in ETH before buy
        //const balanceInETHBefore = web3.utils.fromWei(await web3.eth.getBalance(accounts[5]), 'ether'); 
        //console.log('accounts[5] has', parseInt(balanceInETHBefore), 'ether before buying Token ID', buyCountT31)          

        // setting Token ID to price in ETH (1=>1), calculated into WEI
        let buyCountT31asString = buyCountT31.toString();
        let t31priceToPayInWEI = web3.utils.toWei(buyCountT31asString);  
        
        console.log('loop and tokenID', buyCountT31, 'has the price in WEI:', t31priceToPayInWEI, 'and this balance:', balanceInWEIBefore);
        
        await monkeyMarketplaceHHInstance.buyMonkey(buyCountT31, {from: accounts[5], value: t31priceToPayInWEI});  
        
        const balanceBeforeInWEIasBN = new BN(balanceInWEIBefore);
        const priceInWEIasBN = new BN(t31priceToPayInWEI);
        const expectedBalanceAfterInWEIasBN = balanceBeforeInWEIasBN.sub(priceInWEIasBN);

        //console.log('loop and tokenID', buyCountT31, 'has the expectedBalanceAfterInWEI:', expectedBalanceAfterInWEI);
        //console.log('loop and tokenID', buyCountT31, 'has the balanceBeforeInWEIasBN:');
        //console.log(balanceBeforeInWEIasBN);

        //console.log('loop and tokenID', buyCountT31, 'has the priceInWEIasBN:');
        //console.log(priceInWEIasBN);        
        /*
        console.log('priceInWEIasBN');
        console.log(priceInWEIasBN);

        console.log('balanceBeforeInWEIasBN');
        console.log(balanceBeforeInWEIasBN);

        console.log('expectedBalanceAfterInWEIasBN');
        console.log(expectedBalanceAfterInWEIasBN);*/

        //console.log('parseInt of it is:');
        //const expectedBalanceAfterInWEIParsed = Number(expectedBalanceAfterInWEIasBN)
        //console.log(expectedBalanceAfterInWEIParsed);

        //const expectedBalanceAfterInWEIasString = expectedBalanceAfterInWEI.toString();       
        
        await assertBalanceAsBN(accounts[5], expectedBalanceAfterInWEIasBN);

        // balance after buy
        //const balanceInWEIAfter = await web3.eth.getBalance(accounts[5]); 
        //console.log('accounts[5] has', parseInt(balanceInWEIAfter), 'WEI after buying Token ID', buyCountT31)       
        //console.log('accounts[5] has', parseInt(balanceInETHAfter), 'ether after buying Token ID', buyCountT31)
        
      }      
      const offersArray = [36,37,38];
      await assertAmountOfActiveOffersAndCount(3, offersArray);

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
      await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

      const account2ArrayToAssert = [0,0,0, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

      const account3ArrayToAssert = [0,0,13,0,0,16,17,18,19,20,21,22,23,24,25,26];
      await assertAllFourTrackersCorrect (accounts[3], 12,  account3ArrayToAssert);
      
      const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];
      await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);

      const account5ArrayToAssert = [1, 2, 3];
      await assertAllFourTrackersCorrect (accounts[5], 3,  account5ArrayToAssert);


    })   

    it('Test 32: accounts[1] should buy 2 NFTs (Token IDs: 36, 37) from accounts[4], now 1 active offer should exist (Token ID: 38)', async () => {  
      for (let buyCountT32 = 36; buyCountT32 <= 37; buyCountT32++) { 
        let largeCountingNrT32 = buyCountT32.toString();
        let t32priceToPayInWEI = web3.utils.toWei(largeCountingNrT32);
        await monkeyMarketplaceHHInstance.buyMonkey(buyCountT32, {from: accounts[1], value: t32priceToPayInWEI});
      }
      const offersArray = [38];
      await assertAmountOfActiveOffersAndCount(1, offersArray);

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 36, 37];
      await assertAllFourTrackersCorrect (accounts[1], 7,  account1ArrayToAssert);

      const account2ArrayToAssert = [0,0,0, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

      const account3ArrayToAssert = [0,0,13,0,0,16,17,18,19,20,21,22,23,24,25,26];
      await assertAllFourTrackersCorrect (accounts[3], 12,  account3ArrayToAssert);
      
      const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38];
      await assertAllFourTrackersCorrect (accounts[4], 14,  account4ArrayToAssert);

      const account5ArrayToAssert = [1, 2, 3];
      await assertAllFourTrackersCorrect (accounts[5], 3,  account5ArrayToAssert);
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
      const offersArray = [38,39,40,41];
      await assertAmountOfActiveOffersAndCount(4, offersArray);

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 36, 37];
      await assertAllFourTrackersCorrect (accounts[1], 7,  account1ArrayToAssert);

      const account2ArrayToAssert = [0,0,0, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

      const account3ArrayToAssert = [0,0,13,0,0,16,17,18,19,20,21,22,23,24,25,26, 39, 40, 41];
      await assertAllFourTrackersCorrect (accounts[3], 15,  account3ArrayToAssert);
      
      const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38];
      await assertAllFourTrackersCorrect (accounts[4], 14,  account4ArrayToAssert);

      const account5ArrayToAssert = [1, 2, 3];
      await assertAllFourTrackersCorrect (accounts[5], 3,  account5ArrayToAssert);
    }) 
    
    it('Test 34: accounts[1] should create 2 offers (Token IDs:36,37) and accounts[5] 2 offers (Token IDs:1,2), now 8 active offers (Token IDs: 38,39,40,41,36,37,1,2)', async () => {  
      
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
    
      const offersArray = [38,39,40,41,36,37,1,2];
      await assertAmountOfActiveOffersAndCount(8, offersArray);
    }) 
    
    it('Test 35: accounts[4] should buy back 2 NFTs (Token IDs: 36, 37) from accounts[1], now 6 active offers should exist (Token IDs: 1,2,38,39,40,41)', async () => {  
      for (let buyCountT35 = 36; buyCountT35 <= 37; buyCountT35++) { 

        let largeCountingNrT35 = buyCountT35.toString();
        let t35priceToPayInWEI = web3.utils.toWei(largeCountingNrT35);
        await monkeyMarketplaceHHInstance.buyMonkey(buyCountT35, {from: accounts[4], value: t35priceToPayInWEI});
      }
      const offersArray = [38,39,40,41, 1,2];
      await assertAmountOfActiveOffersAndCount(6, offersArray);

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 0, 0];
      await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

      const account2ArrayToAssert = [0, 0, 0, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

      const account3ArrayToAssert = [0, 0, 13, 0, 0, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 39, 40, 41];
      await assertAllFourTrackersCorrect (accounts[3], 15,  account3ArrayToAssert);
      
      const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38, 36, 37];
      await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);

      const account5ArrayToAssert = [1, 2, 3];
      await assertAllFourTrackersCorrect (accounts[5], 3,  account5ArrayToAssert);
    })     
    
    it('Test 36: accounts[6] (Token IDs 1) and accounts[7] (Token ID 2) should buy from accounts[5], now 4 active offers (Token IDs: 38,39,40,41) ', async () => {  
      await monkeyMarketplaceHHInstance.buyMonkey(1, {from: accounts[6], value: web3.utils.toWei('1')});   
      await monkeyMarketplaceHHInstance.buyMonkey(2, {from: accounts[7], value: web3.utils.toWei('2')});   
      const offersArray = [38,39,40,41];
      await assertAmountOfActiveOffersAndCount(4, offersArray);
      
      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 0, 0];
      await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

      const account2ArrayToAssert = [0, 0, 0, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

      const account3ArrayToAssert = [0, 0, 13, 0, 0, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 39, 40, 41];
      await assertAllFourTrackersCorrect (accounts[3], 15,  account3ArrayToAssert);
      
      const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38, 36, 37];
      await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);

      const account5ArrayToAssert = [0, 0, 3];
      await assertAllFourTrackersCorrect (accounts[5], 1,  account5ArrayToAssert);

      const account6ArrayToAssert = [1];
      await assertAllFourTrackersCorrect (accounts[6], 1,  account6ArrayToAssert);

      const account7ArrayToAssert = [2];
      await assertAllFourTrackersCorrect (accounts[7], 1,  account7ArrayToAssert);
    }) 
    
    it('Test 37: accounts[6] creates 1 offer with decimal amount for Token ID 1, which is then bought by accounts[8], now still 4 active offers (Token IDs: 38,39,40,41) ', async () => {  
      // Giving operator status 
      giveMarketOperatorAndAssertAndCount(accounts[6]);   
      await createOfferAndAssert(2.456, 1, accounts[6]);
      await monkeyMarketplaceHHInstance.buyMonkey(1, {from: accounts[8], value: web3.utils.toWei('2.456')});         
      const offersArray = [38,39,40,41];
      await assertAmountOfActiveOffersAndCount(4, offersArray);

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 0, 0];
      await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

      const account2ArrayToAssert = [0, 0, 0, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

      const account3ArrayToAssert = [0, 0, 13, 0, 0, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 39, 40, 41];
      await assertAllFourTrackersCorrect (accounts[3], 15,  account3ArrayToAssert);
      
      const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38, 36, 37];
      await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);

      const account5ArrayToAssert = [0, 0, 3];
      await assertAllFourTrackersCorrect (accounts[5], 1,  account5ArrayToAssert);

      const account6ArrayToAssert = [0];
      await assertAllFourTrackersCorrect (accounts[6], 0,  account6ArrayToAssert);

      const account7ArrayToAssert = [2];
      await assertAllFourTrackersCorrect (accounts[7], 1,  account7ArrayToAssert);

      const account8ArrayToAssert = [1];
      await assertAllFourTrackersCorrect (accounts[8], 1,  account8ArrayToAssert);


    }) 
    
    it('Test 38: accounts[7] creates 1 offer with decimal amount under 1 for Token ID 1, which is then bought by accounts[8], now still 4 active offers (Token IDs: 38,39,40,41) ', async () => {  
      // Giving operator status 
      giveMarketOperatorAndAssertAndCount(accounts[7]);   
      await createOfferAndAssert(0.21, 2, accounts[7]);
      const offersArrayBetween = [38,39,40,41,2];
      await assertAmountOfActiveOffersAndCount(5, offersArrayBetween);
      await monkeyMarketplaceHHInstance.buyMonkey(2, {from: accounts[8], value: web3.utils.toWei('0.21')});  
      // showArrayOfAccount(accounts[8]);  
      const offersArray = [38,39,40,41];
      await assertAmountOfActiveOffersAndCount(4, offersArray);

      const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

      const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 0, 0];
      await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

      const account2ArrayToAssert = [0, 0, 0, 4, 0, 7];
      await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

      const account3ArrayToAssert = [0, 0, 13, 0, 0, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 39, 40, 41];
      await assertAllFourTrackersCorrect (accounts[3], 15,  account3ArrayToAssert);
      
      const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38, 36, 37];
      await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);

      const account5ArrayToAssert = [0, 0, 3];
      await assertAllFourTrackersCorrect (accounts[5], 1,  account5ArrayToAssert);

      const account6ArrayToAssert = [0];
      await assertAllFourTrackersCorrect (accounts[6], 0,  account6ArrayToAssert);

      const account7ArrayToAssert = [0];
      await assertAllFourTrackersCorrect (accounts[7], 0,  account7ArrayToAssert);

      const account8ArrayToAssert = [1, 2];
      await assertAllFourTrackersCorrect (accounts[8], 2,  account8ArrayToAssert);
    }); 

    it('Test 39makeLast: should verify the intergrity between trackers _monkeyIdsAndTheirOwnersMapping and MonkeyIdPositionsMapping for all NFTs', async () => {  
      
      await assertPosIntegrAllNFTs();
    }); 
    

    it('Test 40: should ', async () => {  

      const testnum = new BN(10);
      console.log(testnum);

      const testnum2 = new BN(20);
      console.log(testnum2);

      const testnum3 = testnum.add(testnum2);
      console.log(testnum3);



      /*
      const testnumber40 = 31254365376342362423467374;  
      const testnumber40String = testnumber40.toString();
      //const testnumber40ToNumber = testnumber40.toNumber();
      const testnumber40Number = Number(testnumber40);
      const testnumber40parseInt = parseInt(testnumber40);

      const tryingManualConverFactor = 10**21;
      const manualTest= testnumber40 / tryingManualConverFactor;


      console.log('testnumber40', testnumber40);
      console.log('testnumber40String', testnumber40String);
      //console.log('testnumber40ToNumber', testnumber40ToNumber);
      console.log('testnumber40Number', testnumber40Number);
      console.log('testnumber40parseInt', testnumber40parseInt);
      console.log('tryingManualConverFactor', tryingManualConverFactor);

      testnumber40*/      

    }); 

    
  });

});