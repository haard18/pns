use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("YOUR_PROGRAM_ID_HERE");

#[program]
pub mod pns_anchor {
    use super::*;

    /// Initialize the global registry PDA
    /// This should be called once at deployment
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.authority = ctx.accounts.authority.key();
        registry.domain_count = 0;
        registry.bump = ctx.bumps.registry;
        
        msg!("Registry initialized");
        Ok(())
    }

    /// Register a new domain
    /// Creates a DomainAccount PDA derived from nameHash
    pub fn register_domain(
        ctx: Context<RegisterDomain>,
        name_hash: [u8; 32],
        duration: u64,
        resolver: Option<Pubkey>,
    ) -> Result<()> {
        let domain = &mut ctx.accounts.domain_account;
        let registry = &mut ctx.accounts.registry;
        let clock = Clock::get()?;

        // Validate duration (minimum 1 second, maximum 10 years)
        require!(duration > 0, PnsError::InvalidDuration);
        require!(
            duration <= 10 * 365 * 24 * 60 * 60,
            PnsError::InvalidDuration
        );

        // Check if domain already exists and is not expired
        if domain.owner != Pubkey::default() {
            require!(
                clock.unix_timestamp as u64 >= domain.expiration,
                PnsError::DomainNotAvailable
            );
        }

        // Set domain data
        domain.name_hash = name_hash;
        domain.owner = ctx.accounts.owner.key();
        domain.resolver = resolver;
        domain.expiration = clock.unix_timestamp as u64 + duration;
        domain.bump = ctx.bumps.domain_account;

        // Increment domain counter
        registry.domain_count = registry.domain_count.saturating_add(1);

        msg!(
            "Domain registered: {} | Owner: {} | Expires: {}",
            hex::encode(&name_hash),
            domain.owner,
            domain.expiration
        );

        Ok(())
    }

    /// Renew an existing domain
    /// Extends the expiration time
    pub fn renew_domain(
        ctx: Context<RenewDomain>,
        duration: u64,
    ) -> Result<()> {
        let domain = &mut ctx.accounts.domain_account;
        let clock = Clock::get()?;

        // Validate duration
        require!(duration > 0, PnsError::InvalidDuration);
        require!(
            duration <= 10 * 365 * 24 * 60 * 60,
            PnsError::InvalidDuration
        );

        // Check if domain exists and owner is calling
        require!(domain.owner == ctx.accounts.owner.key(), PnsError::Unauthorized);

        // Extend expiration
        domain.expiration = domain.expiration.saturating_add(duration);

        msg!(
            "Domain renewed: {} | New expiration: {}",
            hex::encode(&domain.name_hash),
            domain.expiration
        );

        Ok(())
    }

    /// Transfer domain ownership
    pub fn transfer_domain(
        ctx: Context<TransferDomain>,
        new_owner: Pubkey,
    ) -> Result<()> {
        let domain = &mut ctx.accounts.domain_account;
        let clock = Clock::get()?;

        // Check if domain exists and is not expired
        require!(
            domain.owner != Pubkey::default(),
            PnsError::DomainNotAvailable
        );
        require!(
            clock.unix_timestamp as u64 < domain.expiration,
            PnsError::DomainExpired
        );
        require!(domain.owner == ctx.accounts.owner.key(), PnsError::Unauthorized);

        // Transfer ownership
        domain.owner = new_owner;

        msg!(
            "Domain transferred: {} | New owner: {}",
            hex::encode(&domain.name_hash),
            new_owner
        );

        Ok(())
    }

    /// Update resolver for a domain
    pub fn set_resolver(
        ctx: Context<SetResolver>,
        resolver: Option<Pubkey>,
    ) -> Result<()> {
        let domain = &mut ctx.accounts.domain_account;

        // Check if domain exists and owner is calling
        require!(domain.owner == ctx.accounts.owner.key(), PnsError::Unauthorized);

        domain.resolver = resolver;

        msg!(
            "Resolver updated for: {}",
            hex::encode(&domain.name_hash)
        );

        Ok(())
    }
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[account]
pub struct Registry {
    pub authority: Pubkey,           // 32 bytes
    pub domain_count: u64,           // 8 bytes
    pub bump: u8,                    // 1 byte
                                     // Total: 41 bytes
}

impl Registry {
    pub const SPACE: usize = 8 + 32 + 8 + 1;
}

#[account]
pub struct DomainAccount {
    pub name_hash: [u8; 32],         // 32 bytes - keccak256 hash of domain name
    pub owner: Pubkey,               // 32 bytes
    pub resolver: Option<Pubkey>,    // 1 + 32 = 33 bytes
    pub expiration: u64,             // 8 bytes
    pub bump: u8,                    // 1 byte
                                     // Total: 106 bytes
}

impl DomainAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 33 + 8 + 1;
}

// ============================================================================
// CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = Registry::SPACE,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, Registry>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name_hash: [u8; 32])]
pub struct RegisterDomain<'info> {
    #[account(
        init_if_needed,
        payer = owner,
        space = DomainAccount::SPACE,
        seeds = [b"domain", &name_hash],
        bump
    )]
    pub domain_account: Account<'info, DomainAccount>,
    
    #[account(mut, seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name_hash: [u8; 32])]
pub struct RenewDomain<'info> {
    #[account(
        mut,
        seeds = [b"domain", &name_hash],
        bump = domain_account.bump
    )]
    pub domain_account: Account<'info, DomainAccount>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(name_hash: [u8; 32])]
pub struct TransferDomain<'info> {
    #[account(
        mut,
        seeds = [b"domain", &name_hash],
        bump = domain_account.bump
    )]
    pub domain_account: Account<'info, DomainAccount>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(name_hash: [u8; 32])]
pub struct SetResolver<'info> {
    #[account(
        mut,
        seeds = [b"domain", &name_hash],
        bump = domain_account.bump
    )]
    pub domain_account: Account<'info, DomainAccount>,
    
    pub owner: Signer<'info>,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct DomainRegistered {
    pub name_hash: [u8; 32],
    pub owner: Pubkey,
    pub expiration: u64,
}

#[event]
pub struct DomainRenewed {
    pub name_hash: [u8; 32],
    pub new_expiration: u64,
}

#[event]
pub struct DomainTransferred {
    pub name_hash: [u8; 32],
    pub old_owner: Pubkey,
    pub new_owner: Pubkey,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum PnsError {
    #[msg("Unauthorized - caller is not domain owner")]
    Unauthorized,
    
    #[msg("Domain is expired")]
    DomainExpired,
    
    #[msg("Domain is not available")]
    DomainNotAvailable,
    
    #[msg("Invalid duration - must be between 1 second and 10 years")]
    InvalidDuration,
    
    #[msg("Invalid domain name")]
    InvalidName,
}
