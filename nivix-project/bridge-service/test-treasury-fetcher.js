const RealTreasuryFetcher = require('./src/admin/real-treasury-fetcher');

async function testTreasuryFetcher() {
    console.log('🧪 Testing Real Treasury Fetcher...');
    console.log('');

    const fetcher = new RealTreasuryFetcher();

    try {
        // Test initialization
        console.log('1️⃣ Testing initialization...');
        const initResult = await fetcher.initialize();
        console.log('Initialization result:', initResult);
        console.log('');

        if (!initResult) {
            console.error('❌ Initialization failed, cannot continue test');
            return;
        }

        // Test fetching real balances
        console.log('2️⃣ Testing real treasury balance fetching...');
        const balances = await fetcher.getRealTreasuryBalances();
        console.log('');
        console.log('📊 Treasury Balance Results:');
        console.log('═'.repeat(50));
        console.log(`Treasury Wallet: ${balances.treasury_wallet}`);
        console.log(`Total Liquidity: $${balances.total_liquidity_usd.toLocaleString()}`);
        console.log(`Source: ${balances.source}`);
        console.log(`Last Updated: ${balances.last_updated}`);
        console.log('');

        console.log('Currency Balances:');
        for (const [currency, balance] of Object.entries(balances.balances)) {
            if (balance.error) {
                console.log(`❌ ${currency}: Error - ${balance.error}`);
            } else {
                console.log(`✅ ${currency}: ${balance.balance.toLocaleString()} tokens ($${balance.usd_value.toLocaleString()})`);
            }
        }

        console.log('');

        // Test individual token balance
        console.log('3️⃣ Testing individual token balance (USD)...');
        const usdBalance = await fetcher.getTokenBalance('USD');
        console.log('USD Balance:', usdBalance);
        console.log('');

        // Test treasury stats
        console.log('4️⃣ Testing treasury statistics...');
        const stats = await fetcher.getTreasuryStats();
        console.log('Treasury Stats:', stats);
        console.log('');

        // Test connection
        console.log('5️⃣ Testing blockchain connection...');
        const connectionTest = await fetcher.testConnection();
        console.log('Connection Test:', connectionTest);
        console.log('');

        // Summary
        console.log('🎉 Treasury Fetcher Test Complete!');
        console.log('');

        if (balances.total_liquidity_usd > 0) {
            console.log('✅ SUCCESS: Treasury has liquidity');
            console.log('✅ Dashboard should now show correct treasury balance');
        } else {
            console.log('⚠️ WARNING: Treasury liquidity still shows as zero');
            console.log('⚠️ Check if treasury token accounts were created correctly');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testTreasuryFetcher();