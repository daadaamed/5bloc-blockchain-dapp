use anchor_lang::prelude::*;

declare_id!("DWfqXY9yuAEkU7MK2tcWxNGFqtuQyc2GMN64AmDebv8g");

const IPFS_HASH_RESIDENTIAL: &str = "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH";
const IPFS_HASH_COMMERCIAL: &str = "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH";  
const IPFS_HASH_LUXIRIOUS: &str = "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH";    

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

    // Initialise un nouveau compte utilisateur.
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_account = &mut ctx.accounts.user;
        user_account.properties = Vec::new();
        user_account.last_transaction = 0;
        Ok(())
    }

    // Crée un nouveau token de propriété avec une vérification basique d'IPFS.
    pub fn mint_property(ctx: Context<MintProperty>, metadata: Metadata) -> Result<()> {
        let clock = Clock::get()?.unix_timestamp;
        let user_account = &mut ctx.accounts.user;

        // Vérifie la limite maximale de propriétés (4 propriétés maximum).
        if user_account.properties.len() >= 4 {
            return Err(ErrorCode::MaxPropertiesReached.into());
        }

        // Vérification  de l'IPFS hash pour valider le type de propriété.
        if metadata.ipfs_hash == IPFS_HASH_RESIDENTIAL {
            if metadata.property_type != "residential" {
                msg!("Warning: The provided IPFS hash indicates a residential property, but the property type is '{}'.", metadata.property_type);
            } else {
                msg!("Residential property IPFS hash verified.");
            }
        } else if metadata.ipfs_hash == IPFS_HASH_COMMERCIAL {
            if metadata.property_type != "commercial" {
                msg!("Warning: The provided IPFS hash indicates a commercial property, but the property type is '{}'.", metadata.property_type);
            } else {
                msg!("Commercial property IPFS hash verified.");
            }
        } else if metadata.ipfs_hash == IPFS_HASH_LUXIRIOUS {
            if metadata.property_type != "luxirious" {
                msg!("Warning: The provided IPFS hash indicates an luxirious property, but the property type is '{}'.", metadata.property_type);
            } else {
                msg!("luxirious property IPFS hash verified.");
            }
        } else {
            msg!("IPFS hash does not match any predefined type. Proceeding without type-specific verification.");
        }

        // Initialise le compte de propriété.
        let property_account = &mut ctx.accounts.property;
        property_account.owner = ctx.accounts.user_signer.key();
        property_account.metadata = metadata.clone();
        property_account.created_at = clock;
        property_account.last_transfer_at = clock;
        property_account.previous_owners = Vec::new();

        // Ajoute la propriété à la liste du propriétaire.
        user_account.properties.push(property_account.key());

        // Met à jour le timestamp de la dernière transaction de l'utilisateur.
        user_account.last_transaction = clock;

        Ok(())
    }

    // Échange une propriété entre l'expéditeur et le destinataire.
    pub fn exchange_property(ctx: Context<ExchangeProperty>) -> Result<()> {
        let clock = Clock::get()?.unix_timestamp;
        let sender = &mut ctx.accounts.sender;
        let receiver = &mut ctx.accounts.receiver;
        let property_account = &mut ctx.accounts.property;

        // Vérifie que le destinataire ne dépasse pas la limite de propriétés.
        if receiver.properties.len() >= 4 {
            return Err(ErrorCode::MaxPropertiesReached.into());
        }

        // Extrait la clé publique de la propriété.
        let property_pubkey = property_account.key();

        // Sauvegarde le propriétaire actuel.
        let current_owner = property_account.owner;

        // Met à jour les détails de la propriété.
        property_account.previous_owners.push(current_owner);
        property_account.owner = ctx.accounts.receiver_signer.key();
        property_account.last_transfer_at = clock;

        // Met à jour les listes de propriétés des utilisateurs.
        sender.properties.retain(|&x| x != property_pubkey);
        receiver.properties.push(property_pubkey);

        // Met à jour les timestamps des transactions.
        sender.last_transaction = clock;
        receiver.last_transaction = clock;

        Ok(())
    }

    // Nouvelle fonction: Vérifie la validité des métadonnées de propriété.
    pub fn verify_property_metadata(ctx: Context<VerifyPropertyMetadata>, metadata: Metadata) -> Result<()> {
        // Vérification de l'IPFS hash et du type associé.
        if metadata.ipfs_hash == IPFS_HASH_RESIDENTIAL {
            if metadata.property_type != "residential" {
                msg!("Verification failed: IPFS hash for residential does not match property type: {}", metadata.property_type);
            } else {
                msg!("Verification succeeded: Residential property metadata is valid.");
            }
        } else if metadata.ipfs_hash == IPFS_HASH_COMMERCIAL {
            if metadata.property_type != "commercial" {
                msg!("Verification failed: IPFS hash for commercial does not match property type: {}", metadata.property_type);
            } else {
                msg!("Verification succeeded: Commercial property metadata is valid.");
            }
        } else if metadata.ipfs_hash == IPFS_HASH_LUXIRIOUS {
            if metadata.property_type != "LIPFS_HASH_LUXIRIOUS" {
                msg!("Verification failed: IPFS hash for LIPFS_HASH_LUXIRIOUS does not match property type: {}", metadata.property_type);
            } else {
                msg!("Verification succeeded: LIPFS_HASH_LUXIRIOUS property metadata is valid.");
            }
        } else {
            msg!("Verification warning: IPFS hash not recognized. Unable to verify property metadata.");
        }
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

// Pour la fonction de vérification des métadonnées, on nécessite une signature pour autoriser la vérification.
#[derive(Accounts)]
pub struct VerifyPropertyMetadata<'info> {
    #[account(mut)]
    pub user_signer: Signer<'info>,
}

#[account]
pub struct User {
    pub properties: Vec<Pubkey>,
    pub last_transaction: i64,
    pub penalty_cooldown: bool,
}

impl User {
    // Taille estimée (ajuster si nécessaire).
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
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
