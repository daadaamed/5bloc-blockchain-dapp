// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  // Set the provider from the workspace's configuration.
  anchor.setProvider(provider);

  // Load your program from the workspace.
  const program = anchor.workspace.PropertyToken;

  // Log the program ID to confirm the program is loaded.
  console.log("Program ID:", program.programId.toString());

  // You can add additional deployment or initialization logic here.

  console.log("Migration deploy script executed successfully.");
};
