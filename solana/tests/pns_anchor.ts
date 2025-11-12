import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { PnsAnchor } from "../target/types/pns_anchor";

describe("pns_anchor", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PnsAnchor as Program<PnsAnchor>;

  let registry: PublicKey;
  let registryBump: number;
  let testKeypair: Keypair;

  before(async () => {
    testKeypair = anchor.web3.Keypair.generate();
    [registry, registryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );
  });

  it("Initializes registry", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        registry: registry,
        authority: program.provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize tx:", tx);

    // Verify registry was created
    const registryAccount = await program.account.registry.fetch(registry);
    console.log("Registry authority:", registryAccount.authority.toString());
    console.log("Domain count:", registryAccount.domainCount.toNumber());
  });

  it("Registers a domain", async () => {
    // Create a fake nameHash for testing
    const nameHash = Buffer.from(
      "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      "hex"
    );

    const [domainPDA, domainBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("domain"), nameHash],
      program.programId
    );

    const duration = BigInt(365 * 24 * 60 * 60); // 1 year in seconds

    const tx = await program.methods
      .registerDomain(
        Array.from(nameHash),
        duration,
        null // resolver (optional)
      )
      .accounts({
        domainAccount: domainPDA,
        registry: registry,
        owner: program.provider.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Register domain tx:", tx);

    // Verify domain was registered
    const domainAccount = await program.account.domainAccount.fetch(
      domainPDA
    );
    console.log("Domain owner:", domainAccount.owner.toString());
    console.log("Domain expiration:", domainAccount.expiration.toNumber());
  });

  it("Renews a domain", async () => {
    const nameHash = Buffer.from(
      "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      "hex"
    );

    const [domainPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("domain"), nameHash],
      program.programId
    );

    const duration = BigInt(365 * 24 * 60 * 60); // 1 year

    const tx = await program.methods
      .renewDomain(duration)
      .accounts({
        domainAccount: domainPDA,
        owner: program.provider.publicKey,
      })
      .rpc();

    console.log("Renew domain tx:", tx);

    // Verify domain was renewed
    const domainAccount = await program.account.domainAccount.fetch(
      domainPDA
    );
    console.log("New expiration:", domainAccount.expiration.toNumber());
  });

  it("Transfers a domain", async () => {
    const newOwner = anchor.web3.Keypair.generate();
    const nameHash = Buffer.from(
      "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      "hex"
    );

    const [domainPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("domain"), nameHash],
      program.programId
    );

    const tx = await program.methods
      .transferDomain(newOwner.publicKey)
      .accounts({
        domainAccount: domainPDA,
        owner: program.provider.publicKey,
      })
      .rpc();

    console.log("Transfer domain tx:", tx);

    // Verify domain was transferred
    const domainAccount = await program.account.domainAccount.fetch(
      domainPDA
    );
    console.log("New owner:", domainAccount.owner.toString());
  });

  it("Sets resolver", async () => {
    const resolver = anchor.web3.Keypair.generate().publicKey;
    const nameHash = Buffer.from(
      "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      "hex"
    );

    const [domainPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("domain"), nameHash],
      program.programId
    );

    const tx = await program.methods
      .setResolver(resolver)
      .accounts({
        domainAccount: domainPDA,
        owner: program.provider.publicKey,
      })
      .rpc();

    console.log("Set resolver tx:", tx);

    // Verify resolver was set
    const domainAccount = await program.account.domainAccount.fetch(
      domainPDA
    );
    console.log("Resolver:", domainAccount.resolver.toString());
  });
});
