const MonkeyContract = artifacts.require("MonkeyContract");
const MonkeyMarketplace = artifacts.require("MonkeyMarketplace");


module.exports = async function() {
 
  try {
  
    const monkeyContractHHInstance = await MonkeyContract.new();
    MonkeyContract.setAsDeployed(monkeyContractHHInstance);    
    
    const monkeyMarketplaceHHInstance = await MonkeyMarketplace.new(monkeyContractHHInstance.address);
    MonkeyMarketplace.setAsDeployed(monkeyMarketplaceHHInstance);

  }

  catch (err) {
    console.log("Error: " + err)
  }  

};
