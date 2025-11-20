#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

declare_id!("EB6pbr3ZRnZv1bhgffQuuER5armxMRNauNWRabzuiaNj");

#[program]
pub mod pns_anchor {
    use super::*;

    /// Initialize the global registry PDA
    pub fn initialize(
        ctx: Context<Initialize>,
        polygon_registry: [u8; 20],
        conflict_policy: ConflictPolicy,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.authority = ctx.accounts.authority.key();
        registry.polygon_registry = polygon_registry;
        registry.domain_count = 0;
        registry.conflict_policy = conflict_policy;
        registry.bump = ctx.bumps.registry;
        registry.version = REGISTRY_VERSION;

        msg!(
            "Registry initialized with conflict policy {:?}",
            conflict_policy
        );
        Ok(())
    }

    /// Deprecated user-facing registration (kept for backward compatibility).
    /// Backend should use `mirror_domain`.
    pub fn register_domain(
        ctx: Context<RegisterDomain>,
        name_hash: [u8; 32],
        duration: u64,
        resolver: Option<Pubkey>,
    ) -> Result<()> {
        let domain = &mut ctx.accounts.domain_account;
        let registry = &mut ctx.accounts.registry;
        let clock = Clock::get()?;

        require!(duration > 0, PnsError::InvalidDuration);
        require!(duration <= TEN_YEARS_IN_SECONDS, PnsError::InvalidDuration);

        if domain.owner != Pubkey::default() {
            require!(
                clock.unix_timestamp as u64 >= domain.expiration,
                PnsError::DomainNotAvailable
            );
        }

        domain.name_hash = name_hash;
        domain.owner = ctx.accounts.owner.key();
        domain.resolver = resolver;
        domain.expiration = clock.unix_timestamp as u64 + duration;
        domain.polygon_owner = [0u8; 20];
        domain.last_polygon_tx = [0u8; 32];
        domain.nft_mint = None;
        domain.wrap_state = WrapState::None;
        domain.record_count = 0;
        domain.bump = ctx.bumps.domain_account;

        registry.domain_count = registry.domain_count.saturating_add(1);

        msg!(
            "Legacy domain registered: delegate={} expires={}",
            domain.owner,
            domain.expiration
        );

        Ok(())
    }

    /// Renew an existing domain via legacy flow.
    pub fn renew_domain(
        ctx: Context<RenewDomain>,
        _name_hash: [u8; 32],
        duration: u64,
    ) -> Result<()> {
        let domain = &mut ctx.accounts.domain_account;

        require!(duration > 0, PnsError::InvalidDuration);
        require!(duration <= TEN_YEARS_IN_SECONDS, PnsError::InvalidDuration);
        require!(
            domain.owner == ctx.accounts.owner.key(),
            PnsError::Unauthorized
        );

        domain.expiration = domain.expiration.saturating_add(duration);

        msg!("Domain renewed via legacy flow: {}", domain.expiration);
        Ok(())
    }

    /// Transfer delegate ownership (legacy).
    pub fn transfer_domain(
        ctx: Context<TransferDomain>,
        _name_hash: [u8; 32],
        new_owner: Pubkey,
    ) -> Result<()> {
        let domain = &mut ctx.accounts.domain_account;
        let clock = Clock::get()?;

        require!(
            domain.owner != Pubkey::default(),
            PnsError::DomainNotAvailable
        );
        require!(
            (clock.unix_timestamp as u64) < domain.expiration,
            PnsError::DomainExpired
        );
        require!(
            domain.owner == ctx.accounts.owner.key(),
            PnsError::Unauthorized
        );

        domain.owner = new_owner;

        msg!("Domain delegate transferred to {}", new_owner);
        Ok(())
    }

    /// Update resolver (legacy/local convenience).
    pub fn set_resolver(
        ctx: Context<SetResolver>,
        _name_hash: [u8; 32],
        resolver: Option<Pubkey>,
    ) -> Result<()> {
        let domain = &mut ctx.accounts.domain_account;
        require!(
            domain.owner == ctx.accounts.owner.key(),
            PnsError::Unauthorized
        );
        domain.resolver = resolver;
        msg!("Resolver updated via legacy flow");
        Ok(())
    }

    /// Mirrors Polygon state into a deterministic Domain PDA.
    pub fn mirror_domain(
        ctx: Context<MirrorDomain>,
        name_hash: [u8; 32],
        polygon_owner: [u8; 20],
        solana_delegate: Option<Pubkey>,
        expiration: u64,
        resolver: Option<Pubkey>,
        polygon_tx: [u8; 32],
    ) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        let domain = &mut ctx.accounts.domain_account;

        require_keys_eq!(
            registry.authority,
            ctx.accounts.authority.key(),
            PnsError::Unauthorized
        );

        let was_uninitialized = domain.owner == Pubkey::default();

        domain.name_hash = name_hash;
        domain.owner = solana_delegate.unwrap_or(registry.authority);
        domain.polygon_owner = polygon_owner;
        domain.resolver = resolver;
        domain.expiration = expiration;
        domain.last_polygon_tx = polygon_tx;
        domain.bump = ctx.bumps.domain_account;
        if was_uninitialized {
            domain.wrap_state = WrapState::None;
            domain.record_count = 0;
            registry.domain_count = registry.domain_count.saturating_add(1);
        }

        emit!(DomainMirrored {
            name_hash,
            solana_delegate: domain.owner,
            polygon_owner,
            expiration,
        });

        Ok(())
    }

    /// Updates the Solana delegate allowed to co-sign record writes.
    pub fn update_delegate(
        ctx: Context<UpdateDelegate>,
        _name_hash: [u8; 32],
        new_delegate: Pubkey,
    ) -> Result<()> {
        let domain = &mut ctx.accounts.domain_account;
        let registry = &ctx.accounts.registry;

        require_keys_eq!(
            registry.authority,
            ctx.accounts.authority.key(),
            PnsError::Unauthorized
        );

        domain.owner = new_delegate;

        emit!(DelegateUpdated {
            name_hash: domain.name_hash,
            delegate: new_delegate,
        });

        Ok(())
    }

    /// Upserts a record PDA (address/text/content/custom).
    pub fn upsert_record(
        ctx: Context<UpsertRecord>,
        name_hash: [u8; 32],
        key_hash: [u8; 32],
        record_type: RecordType,
        data: Vec<u8>,
        source_chain: ChainSource,
        version: u64,
    ) -> Result<()> {
        let registry = &ctx.accounts.registry;
        let domain = &mut ctx.accounts.domain_account;
        let record = &mut ctx.accounts.record_account;
        let signer = ctx.accounts.authority.key();

        require!(
            signer == registry.authority || signer == domain.owner,
            PnsError::Unauthorized
        );
        require!(data.len() <= MAX_RECORD_LENGTH, PnsError::RecordTooLarge);

        if registry.conflict_policy == ConflictPolicy::PolygonPriority
            && record.version > 0
            && source_chain == ChainSource::Solana
        {
            require!(version >= record.version, PnsError::ConflictViolation);
        }

        let now_slot = Clock::get()?.slot;
        let was_empty = record.domain == Pubkey::default();

        record.domain = domain.key();
        record.key_hash = key_hash;
        record.record_type = record_type;
        record.source_chain = source_chain;
        record.version = version;
        record.last_updated_slot = now_slot;
        record.data = data;
        record.bump = ctx.bumps.record_account;

        if was_empty {
            domain.record_count = domain.record_count.saturating_add(1);
        }

        emit!(RecordUpdated {
            name_hash,
            key_hash,
            record_type,
            source_chain,
            version,
        });

        Ok(())
    }

    /// Deletes a record PDA and frees rent.
    pub fn delete_record(
        ctx: Context<DeleteRecord>,
        name_hash: [u8; 32],
        key_hash: [u8; 32],
    ) -> Result<()> {
        let registry = &ctx.accounts.registry;
        let domain = &mut ctx.accounts.domain_account;
        let signer = ctx.accounts.authority.key();

        require!(
            signer == registry.authority || signer == domain.owner,
            PnsError::Unauthorized
        );

        domain.record_count = domain.record_count.saturating_sub(1);

        emit!(RecordDeleted {
            name_hash,
            key_hash,
        });

        Ok(())
    }

    /// Marks wrap state/NFT mint pointer (used during wrap/unwrap flows).
    pub fn set_wrap_state(
        ctx: Context<SetWrapState>,
        _name_hash: [u8; 32],
        nft_mint: Option<Pubkey>,
        wrap_state: WrapState,
    ) -> Result<()> {
        let registry = &ctx.accounts.registry;
        let domain = &mut ctx.accounts.domain_account;

        require_keys_eq!(
            registry.authority,
            ctx.accounts.authority.key(),
            PnsError::Unauthorized
        );

        domain.nft_mint = nft_mint;
        domain.wrap_state = wrap_state;

        emit!(WrapStateChanged {
            name_hash: domain.name_hash,
            wrap_state,
            nft_mint,
        });

        Ok(())
    }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TEN_YEARS_IN_SECONDS: u64 = 10 * 365 * 24 * 60 * 60;
const MAX_RECORD_LENGTH: usize = 512;
const REGISTRY_VERSION: u8 = 2;

// ============================================================================
// ACCOUNTS
// ============================================================================

#[account]
pub struct Registry {
    pub authority: Pubkey,               // 32
    pub polygon_registry: [u8; 20],      // 20
    pub domain_count: u64,               // 8
    pub conflict_policy: ConflictPolicy, // 1
    pub bump: u8,                        // 1
    pub version: u8,                     // 1
}

impl Registry {
    pub const SPACE: usize = 8 + 32 + 20 + 8 + 1 + 1 + 1;
}

#[account]
pub struct DomainAccount {
    pub name_hash: [u8; 32],       // 32
    pub owner: Pubkey,             // 32 (Solana delegate)
    pub resolver: Option<Pubkey>,  // 33
    pub expiration: u64,           // 8
    pub polygon_owner: [u8; 20],   // 20
    pub last_polygon_tx: [u8; 32], // 32
    pub nft_mint: Option<Pubkey>,  // 33
    pub wrap_state: WrapState,     // 1
    pub record_count: u16,         // 2
    pub bump: u8,                  // 1
}

impl DomainAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 33 + 8 + 20 + 32 + 33 + 1 + 2 + 1;
}

#[account]
pub struct RecordAccount {
    pub domain: Pubkey,            // 32
    pub key_hash: [u8; 32],        // 32
    pub record_type: RecordType,   // 1
    pub source_chain: ChainSource, // 1
    pub version: u64,              // 8
    pub last_updated_slot: u64,    // 8
    pub data: Vec<u8>,             // 4 + len
    pub bump: u8,                  // 1
}

impl RecordAccount {
    pub const BASE_SIZE: usize = 8 + 32 + 32 + 1 + 1 + 8 + 8 + 4 + 1;

    pub fn space(data_len: usize) -> usize {
        Self::BASE_SIZE + data_len
    }
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
        seeds = [b"domain", name_hash.as_ref()],
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
        seeds = [b"domain", name_hash.as_ref()],
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
        seeds = [b"domain", name_hash.as_ref()],
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
        seeds = [b"domain", name_hash.as_ref()],
        bump = domain_account.bump
    )]
    pub domain_account: Account<'info, DomainAccount>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(name_hash: [u8; 32])]
pub struct MirrorDomain<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = DomainAccount::SPACE,
        seeds = [b"domain", name_hash.as_ref()],
        bump
    )]
    pub domain_account: Account<'info, DomainAccount>,
    #[account(mut, seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name_hash: [u8; 32], key_hash: [u8; 32])]
pub struct UpsertRecord<'info> {
    #[account(
        mut,
        seeds = [b"domain", name_hash.as_ref()],
        bump = domain_account.bump
    )]
    pub domain_account: Account<'info, DomainAccount>,
    #[account(
        init_if_needed,
        payer = authority,
        space = RecordAccount::space(MAX_RECORD_LENGTH),
        seeds = [b"record", domain_account.key().as_ref(), key_hash.as_ref()],
        bump
    )]
    pub record_account: Account<'info, RecordAccount>,
    #[account(seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name_hash: [u8; 32], key_hash: [u8; 32])]
pub struct DeleteRecord<'info> {
    #[account(
        mut,
        seeds = [b"domain", name_hash.as_ref()],
        bump = domain_account.bump
    )]
    pub domain_account: Account<'info, DomainAccount>,
    #[account(
        mut,
        close = authority,
        seeds = [b"record", domain_account.key().as_ref(), key_hash.as_ref()],
        bump = record_account.bump
    )]
    pub record_account: Account<'info, RecordAccount>,
    #[account(seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(name_hash: [u8; 32])]
pub struct UpdateDelegate<'info> {
    #[account(
        mut,
        seeds = [b"domain", name_hash.as_ref()],
        bump = domain_account.bump
    )]
    pub domain_account: Account<'info, DomainAccount>,
    #[account(seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(name_hash: [u8; 32])]
pub struct SetWrapState<'info> {
    #[account(
        mut,
        seeds = [b"domain", name_hash.as_ref()],
        bump = domain_account.bump
    )]
    pub domain_account: Account<'info, DomainAccount>,
    #[account(seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

// ============================================================================
// ENUMS
// ============================================================================

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, Default)]
pub enum RecordType {
    #[default]
    Address = 0,
    Text = 1,
    ContentHash = 2,
    Custom = 3,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, Default)]
pub enum ChainSource {
    #[default]
    Polygon = 0,
    Solana = 1,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, Default)]
pub enum WrapState {
    #[default]
    None = 0,
    Polygon = 1,
    Solana = 2,
}

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, Default)]
pub enum ConflictPolicy {
    #[default]
    PolygonPriority = 0,
    LatestWriteWins = 1,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct DomainMirrored {
    pub name_hash: [u8; 32],
    pub solana_delegate: Pubkey,
    pub polygon_owner: [u8; 20],
    pub expiration: u64,
}

#[event]
pub struct RecordUpdated {
    pub name_hash: [u8; 32],
    pub key_hash: [u8; 32],
    pub record_type: RecordType,
    pub source_chain: ChainSource,
    pub version: u64,
}

#[event]
pub struct RecordDeleted {
    pub name_hash: [u8; 32],
    pub key_hash: [u8; 32],
}

#[event]
pub struct WrapStateChanged {
    pub name_hash: [u8; 32],
    pub wrap_state: WrapState,
    pub nft_mint: Option<Pubkey>,
}

#[event]
pub struct DelegateUpdated {
    pub name_hash: [u8; 32],
    pub delegate: Pubkey,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum PnsError {
    #[msg("Unauthorized - caller is not allowed")]
    Unauthorized,
    #[msg("Domain is expired")]
    DomainExpired,
    #[msg("Domain is not available")]
    DomainNotAvailable,
    #[msg("Invalid duration - must be between 1 second and 10 years")]
    InvalidDuration,
    #[msg("Invalid domain name")]
    InvalidName,
    #[msg("Record payload exceeds maximum length")]
    RecordTooLarge,
    #[msg("Conflict policy prevented the write")]
    ConflictViolation,
}
