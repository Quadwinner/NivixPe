const { Connection, PublicKey } = require('@solana/web3.js');
const { getAccount } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Connection to Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function verifyTreasuryBalances() {
    try {
        console.log('🔍 Verifying treasury balances...');
        console.log('');

        // Load treasury token data
        const treasuryDataPath = path.join(__dirname, '../data/treasury-token-mints.json');

        if (!fs.existsSync(treasuryDataPath)) {
            console.error('❌ Treasury token data not found. Please run create-new-treasury-tokens.js first');
            return;
        }

        const treasuryData = JSON.parse(fs.readFileSync(treasuryDataPath, 'utf8'));

        console.log('Treasury Wallet:', treasuryData.treasuryWallet);
        console.log('Bridge Wallet (Mint Authority):', treasuryData.bridgeWallet);
        console.log('');

        const balances = {};
        let totalBalance = 0;

        for (const [currency, accountInfo] of Object.entries(treasuryData.treasuryAccounts)) {
            if (accountInfo.error) {
                console.log(`❌ ${currency}: ${accountInfo.error}`);
                continue;
            }

            try {
                console.log(`🪙 ${currency} Treasury Account:`);
                console.log(`   Account: ${accountInfo.account}`);
                console.log(`   Mint: ${accountInfo.mint}`);

                // Get current balance
                const tokenAccount = new PublicKey(accountInfo.account);
                const balance = await getAccount(connection, tokenAccount);
                const balanceAmount = Number(balance.amount) / Math.pow(10, 6);

                console.log(`   Balance: ${balanceAmount.toLocaleString()} tokens`);
                console.log(`   Owner: ${balance.owner.toString()}`);
                console.log(`   Mint: ${balance.mint.toString()}`);

                balances[currency] = {
                    account: accountInfo.account,
                    mint: accountInfo.mint,
                    balance: balanceAmount,
                    owner: balance.owner.toString(),
                    status: balanceAmount >= 100000 ? '✅ FUNDED' : '⚠️ UNDER-FUNDED'
                };

                totalBalance += balanceAmount;
                console.log(`   Status: ${balances[currency].status}`);
                console.log('');

            } catch (error) {
                console.error(`❌ Error checking ${currency} balance:`, error.message);
                balances[currency] = {
                    error: error.message,
                    status: '❌ ERROR'
                };
                console.log('');
            }
        }

        // Summary
        console.log('📊 Treasury Balance Summary:');
        console.log('═'.repeat(50));

        const currencies = Object.keys(balances);
        let fundedCount = 0;

        for (const currency of currencies) {
            const balance = balances[currency];
            if (balance.balance && balance.balance >= 100000) {
                fundedCount++;
                console.log(`✅ ${currency}: ${balance.balance.toLocaleString()} tokens (FUNDED)`);
            } else if (balance.balance) {
                console.log(`⚠️ ${currency}: ${balance.balance.toLocaleString()} tokens (UNDER-FUNDED)`);
            } else {
                console.log(`❌ ${currency}: ${balance.status}`);
            }
        }

        console.log('═'.repeat(50));
        console.log(`💰 Total Treasury Balance: ${totalBalance.toLocaleString()} tokens`);
        console.log(`✅ Successfully funded currencies: ${fundedCount}/${currencies.length}`);
        console.log(`🎯 Target per currency: 100,000 tokens`);

        if (fundedCount === currencies.length && totalBalance >= 700000) {
            console.log('');
            console.log('🎉 SUCCESS: Treasury is fully funded!');
            console.log('✅ All currencies have 100,000+ tokens');
            console.log('✅ Treasury balance is no longer zero');
            console.log('✅ Ready for bridge operations');
        } else {
            console.log('');
            console.log('⚠️ Treasury funding incomplete');
            console.log(`Expected: 700,000 total tokens (100k × 7 currencies)`);
            console.log(`Current: ${totalBalance.toLocaleString()} total tokens`);
        }

        // Save verification results
        const verificationResults = {
            treasuryWallet: treasuryData.treasuryWallet,
            bridgeWallet: treasuryData.bridgeWallet,
            balances,
            totalBalance,
            fundedCurrencies: fundedCount,
            totalCurrencies: currencies.length,
            verificationDate: new Date().toISOString(),
            status: fundedCount === currencies.length ? 'FULLY_FUNDED' : 'PARTIALLY_FUNDED'
        };

        const verificationPath = path.join(__dirname, '../data/treasury-balance-verification.json');
        const dataDir = path.dirname(verificationPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(verificationPath, JSON.stringify(verificationResults, null, 2));
        console.log('');
        console.log('📄 Verification results saved to:', verificationPath);

        return verificationResults;

    } catch (error) {
        console.error('❌ Error verifying treasury balances:', error);
        throw error;
    }
}

// Run verification
if (require.main === module) {
    verifyTreasuryBalances()
        .then((results) => {
            if (results && results.status === 'FULLY_FUNDED') {
                console.log('✅ Treasury verification completed successfully');
                process.exit(0);
            } else {
                console.log('⚠️ Treasury verification completed with issues');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('❌ Treasury verification failed:', error);
            process.exit(1);
        });
}

module.exports = { verifyTreasuryBalances };