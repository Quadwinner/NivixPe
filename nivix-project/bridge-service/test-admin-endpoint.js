const axios = require('axios');

async function testAdminDashboard() {
    try {
        console.log('🔍 Testing admin dashboard endpoint...');
        console.log('URL: http://localhost:3002/api/admin/dashboard');
        console.log('');

        const response = await axios.get('http://localhost:3002/api/admin/dashboard', {
            timeout: 10000,
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('✅ Request successful!');
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('');

        const data = response.data;

        // Check the structure - it might be data.dashboard.treasury
        const treasuryData = data.dashboard?.treasury || data.treasury;

        // Focus on treasury data
        if (treasuryData) {
            console.log('💰 Treasury Data from Dashboard:');
            console.log('═'.repeat(50));

            if (treasuryData.liquidity) {
                console.log(`Total Liquidity USD: $${treasuryData.liquidity.total_liquidity_usd?.toLocaleString() || '0'}`);
                console.log(`Utilization Rate: ${treasuryData.liquidity.utilization_rate || 'N/A'}%`);
                console.log(`Reserves Ratio: ${treasuryData.liquidity.reserves_ratio || 'N/A'}%`);
                console.log(`Last Updated: ${treasuryData.liquidity.last_updated || 'N/A'}`);
                console.log(`Data Source: ${treasuryData.liquidity.source || 'N/A'}`);
                console.log('');
            }

            if (treasuryData.balances) {
                console.log('Currency Balances:');
                for (const [currency, balance] of Object.entries(treasuryData.balances)) {
                    if (balance.error) {
                        console.log(`❌ ${currency}: Error - ${balance.error}`);
                    } else {
                        console.log(`${balance.balance > 0 ? '✅' : '⚪'} ${currency}: ${balance.balance?.toLocaleString() || '0'} tokens ($${balance.usd_value?.toLocaleString() || '0'})`);
                    }
                }
                console.log('');
            }

            if (treasuryData.wallets) {
                console.log('Wallet Information:');
                for (const [name, wallet] of Object.entries(treasuryData.wallets)) {
                    console.log(`🔑 ${name}: ${wallet.address || 'N/A'} (${wallet.status || 'unknown'})`);
                }
                console.log('');
            }

            if (treasuryData.error) {
                console.log('❌ Treasury Error:', treasuryData.error);
                console.log('');
            }

        } else {
            console.log('⚠️ No treasury data found in response');
        }

        // Check if total liquidity is greater than zero
        const totalLiquidity = treasuryData?.liquidity?.total_liquidity_usd || 0;

        if (totalLiquidity > 0) {
            console.log('🎉 SUCCESS: Dashboard now shows treasury liquidity!');
            console.log(`💰 Total Treasury Value: $${totalLiquidity.toLocaleString()}`);
        } else {
            console.log('⚠️ Dashboard still shows zero treasury liquidity');
            console.log('The service may need to be restarted to pick up the changes');
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Connection refused - is the bridge service running on port 3000?');
        } else if (error.response) {
            console.error('❌ HTTP Error:', error.response.status);
            console.error('Response:', error.response.data);
        } else {
            console.error('❌ Request failed:', error.message);
        }
    }
}

testAdminDashboard();