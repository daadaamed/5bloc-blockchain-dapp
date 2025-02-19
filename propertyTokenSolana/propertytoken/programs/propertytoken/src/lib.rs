use anchor_lang::prelude::*;

declare_id!("DWfqXY9yuAEkU7MK2tcWxNGFqtuQyc2GMN64AmDebv8g");

#[cfg(feature = "test-mode")]
const COOLDOWN_PERIOD: i64 = 2; // 2 seconds for testing
#[cfg(feature = "test-mode")]
const LOCK_PERIOD: i64 = 3; // 3 seconds for testing

#[cfg(not(feature = "test-mode"))]
const COOLDOWN_PERIOD: i64 = 300; // 5 minutes for production
#[cfg(not(feature = "test-mode"))]
const LOCK_PERIOD: i64 = 600; // 10 minutes for production

#[program]
pub mod propertytoken {
    use super::*;

    // initialise un nouveau compte utilisateur
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_account = &mut ctx.accounts.user;
        user_account.properties = Vec::new();
        user_account.last_transaction = 0;
        Ok(())
    }

    // crée un nouveau token de propriété
    pub fn mint_property(ctx: Context<MintProperty>, metadata: Metadata) -> Result<()> {
        let clock = Clock::get()?.unix_timestamp;
        let user_account = &mut ctx.accounts.user;

        // vérifie la limite maximale de propriétés (4 propriétés maximum)
        if user_account.properties.len() >= 4 {
            return Err(ErrorCode::MaxPropertiesReached.into());
        }

        // Enforce cooldown on minting.
        if clock - user_account.last_transaction < COOLDOWN_PERIOD {
            return Err(ErrorCode::NormalCooldownActive.into());
        }

        // initialise le compte de propriété
        let property_account = &mut ctx.accounts.property;
        property_account.owner = ctx.accounts.user_signer.key();
        property_account.metadata = metadata.clone();
        property_account.created_at = clock;
        property_account.last_transfer_at = clock;
        property_account.previous_owners = Vec::new();

        // Add the property to the user's list.
        user_account.properties.push(property_account.key());

        // Update the user's transaction timestamps.
        user_account.last_transaction = clock;

        Ok(())
    }

    // échange une propriété entre l'expéditeur et le destinataire
    pub fn exchange_property(ctx: Context<ExchangeProperty>) -> Result<()> {
        let clock = Clock::get()?.unix_timestamp;
        let sender = &mut ctx.accounts.sender;
        let receiver = &mut ctx.accounts.receiver;
        let property_account = &mut ctx.accounts.property;

        // Only allow the property owner to initiate a transfer.
        if property_account.owner != ctx.accounts.sender_signer.key() {
            return Err(ErrorCode::NotOwner.into());
        }

        // vérifie que le destinataire ne dépasse pas la limite de propriétés
        if receiver.properties.len() >= 4 {
            return Err(ErrorCode::MaxPropertiesReached.into());
        }

        // Check that the receiver is not in cooldown.
        if clock - receiver.last_transaction < COOLDOWN_PERIOD {
            return Err(ErrorCode::NormalCooldownActive.into());
        }

        // Extract property public key.
        let property_pubkey = property_account.key();

        // Save current owner into a local variable.
        let current_owner = property_account.owner;

        // Update property details.
        property_account.previous_owners.push(current_owner);
        property_account.owner = ctx.accounts.receiver_signer.key();
        property_account.last_transfer_at = clock;

        // Update the sender's and receiver's property lists.
        sender.properties.retain(|&x| x != property_pubkey);
        receiver.properties.push(property_pubkey);

        // Update transaction timestamps.
        sender.last_transaction = clock;
        receiver.last_transaction = clock;

        Ok(())
    }

    // upgrade a property to a higher category based on conversion multipliers
    pub fn upgrade_property(ctx: Context<UpgradeProperty>, new_property_type: String) -> Result<()> {
        let clock = Clock::get()?.unix_timestamp;
        let user_account = &mut ctx.accounts.user;
        let property_account = &mut ctx.accounts.property;

        // Enforce cooldown on upgrade transactions.
        if clock - user_account.last_transaction < COOLDOWN_PERIOD {
            return Err(ErrorCode::NormalCooldownActive.into());
        }

        // Only allow the owner to upgrade.
        if property_account.owner != ctx.accounts.user_signer.key() {
            return Err(ErrorCode::NotOwner.into());
        }

        // Get the current property type and value.
        let current_type = property_account.metadata.property_type.clone();
        let current_value = property_account.metadata.value;
        let multiplier: f64 = if current_type == "Residential" && new_property_type == "Commercial" {
            1.2
        } else if current_type == "Commercial" && new_property_type == "Luxury" {
            1.5
        } else if current_type == "Residential" && new_property_type == "Luxury" {
            1.8
        } else {
            return Err(ErrorCode::InvalidUpgradeConversion.into());
        };

        // Update property details: new type and increased value.
        property_account.metadata.property_type = new_property_type;
        property_account.metadata.value = ((current_value as f64) * multiplier) as u64;
        property_account.last_transfer_at = clock;

        // Update the user's transaction timestamp.
        user_account.last_transaction = clock;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(init, payer = user_signer, space = 8 + User::SIZE)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub user_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintProperty<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(init, payer = user_signer, space = 8 + Property::SIZE)]
    pub property: Account<'info, Property>,
    #[account(mut)]
    pub user_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExchangeProperty<'info> {
    #[account(mut)]
    pub sender: Account<'info, User>,
    #[account(mut)]
    pub receiver: Account<'info, User>,
    #[account(mut)]
    pub property: Account<'info, Property>,
    #[account(mut)]
    pub sender_signer: Signer<'info>,
    #[account(mut)]
    pub receiver_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpgradeProperty<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub property: Account<'info, Property>,
    #[account(mut)]
    pub user_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct User {
    pub properties: Vec<Pubkey>,
    pub last_transaction: i64,
    pub penalty_cooldown: bool,
}

impl User {
    // Estimated size (adjust if needed)
    const SIZE: usize = 4 + (4 + 4 * 32) + 8 + 1;
}

#[account]
pub struct Property {
    pub owner: Pubkey,
    pub metadata: Metadata,
    pub created_at: i64,
    pub last_transfer_at: i64,
    pub previous_owners: Vec<Pubkey>,
}

impl Property {
    const SIZE: usize = 32 + Metadata::SIZE + 8 + 8 + 4 + (10 * 32);
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Metadata {
    pub name: String,
    pub property_type: String,
    pub value: u64,
    pub ipfs_hash: String,
}

impl Metadata {
    const SIZE: usize = 4 + 32 + 4 + 32 + 8 + 4 + 46;
}

#[error_code]
pub enum ErrorCode {
    #[msg("User already owns the maximum number of properties allowed.")]
    MaxPropertiesReached,
    #[msg("Must wait for normal cooldown period (5 minutes) to elapse.")]
    NormalCooldownActive,
    #[msg("Must wait for penalty cooldown period (10 minutes) to elapse.")]
    PenaltyCooldownActivated,
    #[msg("Only the property owner can perform this action.")]
    NotOwner,
    #[msg("Invalid upgrade conversion. The requested conversion is not allowed.")]
    InvalidUpgradeConversion,
}
