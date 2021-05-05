const MonkeyContract = artifacts.require("MonkeyContract");
// const MonkeyMarketplace = artifacts.require("MonkeyMarketplace");


module.exports = async function() {
 
  try {
  
    const monkeyContractHHInstance = await MonkeyContract.new();

    MonkeyContract.setAsDeployed(monkeyContractHHInstance);

    // await deployer.deploy(MonkeyMarketplace, instance.address);

    // const MonkeyMarketplaceInstance = await MonkeyMarketplace.deployed();   

  }

  catch (err) {
    console.log("Error: " + err)
  }  

};
