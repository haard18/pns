import { ethers } from 'ethers';

// Test if we can actually fetch Registrar logs
async function testRegistrarLogs() {
    const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/0VQfnmMu5gZ4ohIpCRPOSwNl4U3MetcH');

    const registrarAddress = '0x31ac529Be6F2d51c42dd1C9D1DDcC95910D788f6';

    // Event signature for Registrar NameRegistered
    const eventSignature = ethers.id('NameRegistered(bytes32,string,address,uint256,uint64)');

    console.log('\n🔍 Fetching Registrar logs...');
    console.log('Registrar Address:', registrarAddress);
    console.log('Event Signature:', eventSignature);

    // Fetch logs from block range that includes our test transactions
    const logs = await provider.getLogs({
        address: registrarAddress,
        topics: [[eventSignature]], // Array of arrays for topic0
        fromBlock: 79905000,
        toBlock: 79906200,
    });

    console.log('\n📊 Found', logs.length, 'Registrar NameRegistered events');

    // Decode each log
    const registrarEventAbi = ['event NameRegistered(bytes32 indexed nameHash, string name, address indexed owner, uint256 price, uint64 expiration)'];
    const iface = new ethers.Interface(registrarEventAbi);

    for (const log of logs) {
        const decoded = iface.parseLog({
            topics: log.topics as string[],
            data: log.data,
        });

        if (decoded) {
            console.log('\n✅ Event found:');
            console.log('  Block:', log.blockNumber);
            console.log('  Tx:', log.transactionHash);
            console.log('  nameHash:', decoded.args.nameHash);
            console.log('  name:', decoded.args.name);
            console.log('  owner:', decoded.args.owner);
            console.log('  price:', decoded.args.price.toString());
        }
    }
}

testRegistrarLogs().catch(console.error);
