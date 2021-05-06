const MonkeyContract = artifacts.require("MonkeyContract");

// Truffle test with Hardhat
contract("MonkeyContract with HH", accounts => {
  it("Should console.log succesfully", async function() {
    const monkeyContractHHInstance = await MonkeyContract.new();
    console.log(monkeyContractHHInstance);
    console.log("So far very good");

    // assert.equal(await monkeyContractHHInstance.greet(), "Hello, world!");

    
  });
});

