use anchor_lang::prelude::*;

declare_id!("DWfqXY9yuAEkU7MK2tcWxNGFqtuQyc2GMN64AmDebv8g");

const IPFS_HASH_RESIDENTIAL: &str = "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH";
const IPFS_HASH_COMMERCIAL: &str = "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH";
const IPFS_HASH_LUXURIOUS: &str = "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH";

#[cfg(feature = "test-mode")]
const COOLDOWN_PERIOD: i64 = 2; // 2 seconds for testing
#[cfg(feature = "test-mode")]
const LOCK_PERIOD: i64 = 3; // 3 seconds for testing
#[cfg(not(feature = "test-mode"))]
const COOLDOWN_PERIOD: i64 = 2; // should be  5 minutes for production
#[cfg(not(feature = "test-mode"))]
const LOCK_PERIOD: i64 = 3; // should be 10 minutes for production

#[program]
pub mod propertytoken {
    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_account = &mut ctx.accounts.user;
        user_account.properties = Vec::new();
        user_account.last_transaction = 0;
        user_account.penalty_cooldown = false;
        Ok(())
    }

    pub fn mint_property(ctx: Context<MintProperty>, metadata: Metadata) -> Result<()> {
        let clock = Clock::get()?.unix_timestamp;
        let user_account = &mut ctx.accounts.user;
        user_account.check_cooldown(clock)?;

        if user_account.properties.len() >= 4 {
            return Err(ErrorCode::MaxPropertiesReached.into());
        }

        let expected_hash = match metadata.property_type.to_lowercase().as_str() {
            "residential" => IPFS_HASH_RESIDENTIAL,
            "commercial" => IPFS_HASH_COMMERCIAL,
            "luxurious" => IPFS_HASH_LUXURIOUS,
            _ => return Err(ErrorCode::InvalidIpfsHash.into()),
        };

        if metadata.ipfs_hash != expected_hash {
            return Err(ErrorCode::InvalidIpfsHash.into());
        } else {
            msg!("{} property IPFS hash verified.", metadata.property_type);
        }

        let property_account = &mut ctx.accounts.property;
        property_account.owner = ctx.accounts.user_signer.key();
        property_account.metadata = metadata.clone();
        property_account.created_at = clock;
        property_account.last_transfer_at = clock;
        property_account.previous_owners = Vec::new();
        property_account.for_sale = false;
        property_account.price = 0;

        user_account.properties.push(property_account.key());
        user_account.last_transaction = clock;
        Ok(())
    }

    pub fn exchange_property(ctx: Context<ExchangeProperty>) -> Result<()> {
        let clock = Clock::get()?.unix_timestamp;
        let sender = &mut ctx.accounts.sender;
        let receiver = &mut ctx.accounts.receiver;
        let property_account = &mut ctx.accounts.property;

        if receiver.properties.len() >= 4 {
            return Err(ErrorCode::MaxPropertiesReached.into());
        }

        sender.check_cooldown(clock)?;

        let property_pubkey = property_account.key();
        let current_owner = property_account.owner;

        property_account.previous_owners.push(current_owner);
        property_account.owner = ctx.accounts.receiver_signer.key();
        property_account.last_transfer_at = clock;

        sender.properties.retain(|&x| x != property_pubkey);
        receiver.properties.push(property_pubkey);

        sender.last_transaction = clock;
        receiver.last_transaction = clock;
        Ok(())
    }

    pub fn verify_property_metadata(ctx: Context<VerifyPropertyMetadata>, metadata: Metadata) -> Result<()> {
        let expected_hash = match metadata.property_type.to_lowercase().as_str() {
            "residential" => IPFS_HASH_RESIDENTIAL,
            "commercial" => IPFS_HASH_COMMERCIAL,
            "luxurious" => IPFS_HASH_LUXURIOUS,
            _ => return Err(ErrorCode::InvalidIpfsHash.into()),
        };

        if metadata.ipfs_hash != expected_hash {
            return Err(ErrorCode::InvalidIpfsHash.into());
        } else {
            msg!("Verification succeeded: {} property metadata is valid.", metadata.property_type);
        }
        Ok(())
    }

    pub fn get_property_datas(ctx: Context<GetPropertyDatas>) -> Result<()> {
        let property = &ctx.accounts.property;
        msg!("Owner: {}", property.owner);
        msg!("Name: {}", property.metadata.name);
        msg!("Type: {}", property.metadata.property_type);
        msg!("Value: {}", property.metadata.value);
        msg!("IPFS: {}", property.metadata.ipfs_hash);
        Ok(())
    }

    pub fn list_property_for_sale(ctx: Context<ListForSale>, price: u64) -> Result<()> {
        let property = &mut ctx.accounts.property;
        require!(property.owner == *ctx.accounts.owner.key, PropertyError::NotOwner);

        property.for_sale = true;
        property.price = price;
        msg!("Propriété listée en vente à {} SOL", price);
        Ok(())
    }

    pub fn buy_property(ctx: Context<BuyProperty>) -> Result<()> {
        let property = &mut ctx.accounts.property;
        let buyer = &ctx.accounts.buyer;
        let seller = &ctx.accounts.seller;

        require!(property.for_sale, PropertyError::NotForSale);
        require!(buyer.to_account_info().lamports() >= property.price, PropertyError::InsufficientFunds);

        **buyer.to_account_info().try_borrow_mut_lamports()? -= property.price;
        **seller.to_account_info().try_borrow_mut_lamports()? += property.price;

        property.previous_owners.push(property.owner);
        property.owner = *buyer.key;
        property.for_sale = false;
        property.price = 0;

        msg!("Propriété achetée par {}", buyer.key);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ListForSale<'info> {
    #[account(mut, has_one = owner)]
    pub property: Account<'info, Property>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct BuyProperty<'info> {
    #[account(mut, has_one = owner)]
    pub property: Account<'info, Property>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub seller: SystemAccount<'info>,
}

#[account]
pub struct Property {
    pub owner: Pubkey,
    pub metadata: Metadata,
    pub created_at: i64,
    pub last_transfer_at: i64,
    pub previous_owners: Vec<Pubkey>,
    pub for_sale: bool,
    pub price: u64,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Metadata {
    pub name: String,
    pub property_type: String,
    pub value: u64,
    pub ipfs_hash: String,
}

#[error_code]
pub enum PropertyError {
    #[msg("Vous n'êtes pas le propriétaire de cette propriété.")]
    NotOwner,
    #[msg("La propriété n'est pas à vendre.")]
    NotForSale,
    #[msg("Fonds insuffisants pour acheter cette propriété.")]
    InsufficientFunds,
}
