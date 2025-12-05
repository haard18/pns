import { ethers } from 'ethers';

// Debug script to check what's actually in the event
async function debugEvent() {
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

    // Check each log
    for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`\n--- Log ${i} ---`);
        console.log('Address:', log.address);
        console.log('Topics:', log.topics);
        console.log('Data:', log.data);

        // Try to decode as NameRegistered event
        const eventAbi = ['event NameRegistered(bytes32 indexed nameHash, string name, address indexed owner, address indexed resolver, uint64 expiration)'];
        const iface = new ethers.Interface(eventAbi);

        try {
            const decoded = iface.parseLog({
                topics: log.topics as string[],
                data: log.data,
            });

            if (decoded) {
                console.log('\n✅ Decoded as NameRegistered:');
                console.log('  nameHash:', decoded.args.nameHash);
                console.log('  name:', decoded.args.name);
                console.log('  owner:', decoded.args.owner);
                console.log('  resolver:', decoded.args.resolver);
                console.log('  expiration:', decoded.args.expiration.toString());
            }
        } catch (e) {
            // Not this event type
        }
    }
}

debugEvent().catch(console.error);
