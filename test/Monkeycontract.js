const MonkeyContract = artifacts.require("MonkeyContract");
const MonkeyMarketplace = artifacts.require("MonkeyMarketplace");


// Truffle test with Hardhat
contract("MonkeyContract with HH", accounts => {
  it("Should console.log succesfully", async function() {
    const monkeyContractHHInstance = await MonkeyContract.new();
    // console.log(monkeyContractHHInstance);
    console.log("So far very good");

    // assert.equal(await monkeyContractHHInstance.greet(), "Hello, world!");

    const monkeyMarketplaceHHInstance = await MonkeyMarketplace.new(monkeyContractHHInstance.address);
    // console.log(monkeyMarketplaceHHInstance);
    const mainContractAddressSavedInMarket = await monkeyMarketplaceHHInstance.returnMonkeyContract();

    console.log("monkeyContractHHInstance.address: ");
    console.log(monkeyContractHHInstance.address);

    console.log("mainContractAddressSavedInMarket: ");
    console.log(mainContractAddressSavedInMarket);

    console.log("Both correct?");

    
    
  });




});

