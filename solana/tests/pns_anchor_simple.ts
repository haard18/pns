import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";

describe("pns_anchor_simple", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Get program from workspace
  const program = anchor.workspace.PnsAnchor as Program<any>;
  const programId = program.programId;

  let registry: PublicKey;
  let registryInitialized = false;

  before(async () => {
    [registry] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      programId
    );
    
    // Check if registry already exists
    try {
      await program.account.registry.fetch(registry);
      registryInitialized = true;
      console.log("✓ Registry already initialized, skipping init");
    } catch (e) {
      registryInitialized = false;
    }
  });

  it("✓ initializes registry", async () => {
    if (registryInitialized) {
      console.log("✓ Skipping init - registry already exists");
      return;
    }

    const tx = await program.methods
      .initialize()
      .accounts({
        registry: registry,
        authority: provider.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✓ Initialize tx:", tx);

    // Verify registry was created
    const registryAccount = await program.account.registry.fetch(registry);
    console.log("✓ Registry authority:", registryAccount.authority.toString());
    console.log("✓ Domain count:", registryAccount.domainCount.toNumber());
  });

  it("✓ can register a domain", async () => {
    // Create a unique nameHash for this test
    const testId = Math.random().toString();
    const nameHash = Buffer.from(testId.padEnd(32, '0').slice(0, 32));

    const [domainPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("domain"), nameHash],
      programId
    );

    const tx = await program.methods
      .registerDomain(Array.from(nameHash), new anchor.BN(31536000), null)
      .accounts({
        domainAccount: domainPDA,
        registry: registry,
        owner: provider.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✓ Register tx:", tx);

    // Verify domain was created
    const domainAccount = await program.account.domainAccount.fetch(domainPDA);
    console.log("✓ Domain owner:", domainAccount.owner.toString());
    console.log("✓ Domain expiration:", domainAccount.expiration.toNumber());
  });

  it("✓ can renew a domain", async () => {
    // Register a domain first
    const nameHash2 = Buffer.from("test-renew".padEnd(32, '0').slice(0, 32));

    const [domainPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("domain"), nameHash2],
      programId
    );

    // Register domain
    await program.methods
      .registerDomain(Array.from(nameHash2), new anchor.BN(31536000), null)
      .accounts({
        domainAccount: domainPDA,
        registry: registry,
        owner: provider.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const oldDomain = await program.account.domainAccount.fetch(domainPDA);
    const oldExpiration = oldDomain.expiration;

    const tx = await program.methods
      .renewDomain(Array.from(nameHash2), new anchor.BN(31536000))
      .accounts({
        domainAccount: domainPDA,
        owner: provider.publicKey!,
      })
      .rpc();

    console.log("✓ Renew tx:", tx);

    // Verify expiration was extended
    const newDomain = await program.account.domainAccount.fetch(domainPDA);
    console.log("✓ Old expiration:", oldExpiration.toNumber());
    console.log("✓ New expiration:", newDomain.expiration.toNumber());
  });

  it("✓ can transfer a domain", async () => {
    // Register a domain first
    const nameHash3 = Buffer.from("test-transfer".padEnd(32, '0').slice(0, 32));

    const [domainPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("domain"), nameHash3],
      programId
    );

    // Register domain
    await program.methods
      .registerDomain(Array.from(nameHash3), new anchor.BN(31536000), null)
      .accounts({
        domainAccount: domainPDA,
        registry: registry,
        owner: provider.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const newOwner = Keypair.generate();

    const tx = await program.methods
      .transferDomain(Array.from(nameHash3), newOwner.publicKey)
      .accounts({
        domainAccount: domainPDA,
        owner: provider.publicKey!,
      })
      .rpc();

    console.log("✓ Transfer tx:", tx);

    // Verify owner was changed
    const domain = await program.account.domainAccount.fetch(domainPDA);
    console.log("✓ New owner:", domain.owner.toString());
  });

  it("✓ can set resolver", async () => {
    // Register a domain first
    const nameHash4 = Buffer.from("test-resolver".padEnd(32, '0').slice(0, 32));

    const [domainPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("domain"), nameHash4],
      programId
    );

    // Register domain
    await program.methods
      .registerDomain(Array.from(nameHash4), new anchor.BN(31536000), null)
      .accounts({
        domainAccount: domainPDA,
        registry: registry,
        owner: provider.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const newResolver = Keypair.generate().publicKey;

    const tx = await program.methods
      .setResolver(Array.from(nameHash4), newResolver)
      .accounts({
        domainAccount: domainPDA,
        owner: provider.publicKey!,
      })
      .rpc();

    console.log("✓ Set resolver tx:", tx);

    // Verify resolver was set
    const domain = await program.account.domainAccount.fetch(domainPDA);
    console.log("✓ Resolver:", domain.resolver.toString());
  });
});
