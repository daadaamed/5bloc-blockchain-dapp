const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PropertyTokenModule", (m) => {
  // Deploy the PropertyToken contract
  const propertyToken = m.contract("PropertyToken");

  // Return the deployed contract for use in other modules or scripts
  return { propertyToken };
});
