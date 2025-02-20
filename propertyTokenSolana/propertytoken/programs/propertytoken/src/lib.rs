use anchor_lang::prelude::*;

declare_id!("DWfqXY9yuAEkU7MK2tcWxNGFqtuQyc2GMN64AmDebv8g");
// should be the one got from the cmd ````ipfs add <json-file>
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

    // Initialise un nouveau compte utilisateur.
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_account = &mut ctx.accounts.user;
        user_account.properties = Vec::new();
        user_account.last_transaction = 0;
        user_account.penalty_cooldown = false;
        Ok(())
    }

    // Crée un nouveau token de propriété
    pub fn mint_property(ctx: Context<MintProperty>, metadata: Metadata) -> Result<()> {
        let clock = Clock::get()?.unix_timestamp;
        let user_account = &mut ctx.accounts.user;

        // Check cooldown period
        user_account.check_cooldown(clock)?;

        // Vérifie la limite maximale de propriétés (4 propriétés maximum).
        if user_account.properties.len() >= 4 {
            return Err(ErrorCode::MaxPropertiesReached.into());
        }

        // Vérification de l'IPFS hash pour valider le type de propriété.
        // On détermine le hash attendu en fonction du type de propriété fourni.
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
        
        // Check cooldowns
        sender.check_cooldown(clock)?;
        
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

    // Vérifie la validité des métadonnées de propriété (IPFS).
    pub fn verify_property_metadata(ctx: Context<VerifyPropertyMetadata>, metadata: Metadata) -> Result<()> {
        // Détermine le hash attendu en fonction du type de propriété (en ignorant la casse, min or maj).
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
    
    // Récupère et affiche les données d'une propriété.
    pub fn get_property_datas(ctx: Context<GetPropertyDatas>) -> Result<()> {
        let property = &ctx.accounts.property;
        msg!("Owner: {}", property.owner);
        msg!("Name: {}", property.metadata.name);
        msg!("Type: {}", property.metadata.property_type);
        msg!("Value: {}", property.metadata.value);
        msg!("IPFS: {}", property.metadata.ipfs_hash);
        Ok(())
    }
    pub fn display_property_owners(ctx: Context<GetPropertyOwners>) -> Result<()> {
        let property = &ctx.accounts.property;

        // Display the current owner.
        msg!("Current Owner: {}", property.owner);

        // Check if there are any previous owners.
        if property.previous_owners.is_empty() {
            msg!("No previous owners.");
        } else {
            msg!("Previous Owners:");
            for (i, owner) in property.previous_owners.iter().enumerate() {
                msg!("  {}: {}", i + 1, owner);
            }
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

#[derive(Accounts)]
pub struct GetPropertyDatas<'info> {
    pub property: Account<'info, Property>,
}

#[derive(Accounts)]
pub struct VerifyPropertyMetadata<'info> {
    #[account(mut)]
    pub user_signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetPropertyOwners<'info> {
    pub property: Account<'info, Property>,
}

#[account]
pub struct User {
    pub properties: Vec<Pubkey>,
    pub last_transaction: i64,
    pub penalty_cooldown: bool,
}

impl User {
    // Taille estimée.
    const SIZE: usize = 4 + (4 + 4 * 32) + 8 + 1;

    fn check_cooldown(&mut self, current_time: i64) -> Result<()> {
        let time_since_last = current_time - self.last_transaction;

        // Si aucune transaction précédente, autoriser immédiatement.
        if self.last_transaction == 0 {
            return Ok(());
        }

        // Si déjà en mode pénalité, appliquer la période de verrouillage plus longue.
        if self.penalty_cooldown {
            if time_since_last < LOCK_PERIOD {
                return Err(ErrorCode::PenaltyCooldownActivated.into());
            } else {
                self.penalty_cooldown = false;
            }
        }

        // Si dans le cooldown normal, activer le mode pénalité.
        if time_since_last < COOLDOWN_PERIOD {
            self.penalty_cooldown = true;
            return Err(ErrorCode::PenaltyCooldownActivated.into());
        }

        Ok(())
    }
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
    #[msg("Invalid IPFS hash for the given property type.")]
    InvalidIpfsHash,
}

