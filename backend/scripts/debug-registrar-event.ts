import { ethers } from 'ethers';

// Debug script to check if we're parsing Registrar events correctly
async function debugRegistrarEvent() {
    const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/0VQfnmMu5gZ4ohIpCRPOSwNl4U3MetcH');

    // Get the transaction receipt for one of the events
    const txHash = '0x0743a4c27f4999a618a6f189f6883ef27790061bc9dbcc81d41b5d97d05b6dd8';

    console.log('\n🔍 Fetching transaction:', txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
        console.log('❌ Transaction not found');
        return;
    }

    console.log('\n📋 Transaction Receipt:');
    console.log('Block:', receipt.blockNumber);
    console.log('Logs count:', receipt.logs.length);

    // Try to decode as Registrar NameRegistered event
    const registrarEventAbi = ['event NameRegistered(bytes32 indexed nameHash, string name, address indexed owner, uint256 price, uint64 expiration)'];
    const registrarIface = new ethers.Interface(registrarEventAbi);

    // Check each log
    for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];

        try {
            const decoded = registrarIface.parseLog({
                topics: log.topics as string[],
                data: log.data,
            });

            if (decoded) {
                console.log(`\n✅ Log ${i} - Decoded as Registrar NameRegistered:`);
                console.log('  Contract:', log.address);
                console.log('  nameHash:', decoded.args.nameHash);
                console.log('  name:', decoded.args.name);
                console.log('  owner:', decoded.args.owner);
                console.log('  price:', decoded.args.price.toString());
                console.log('  expiration:', decoded.args.expiration.toString());
            }
        } catch (e) {
            // Not this event type
        }
    }
}

debugRegistrarEvent().catch(console.error);
