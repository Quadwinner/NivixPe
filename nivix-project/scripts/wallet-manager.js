#!/usr/bin/env node

/**
 * Nivix Wallet Manager
 * Safe utility for managing and displaying wallet information
 * 
 * Usage:
 *   node scripts/wallet-manager.js list              # List all wallets
 *   node scripts/wallet-manager.js info <wallet>     # Show wallet details
 *   node scripts/wallet-manager.js balance <wallet>  # Check wallet balance
 *   node scripts/wallet-manager.js export <wallet>   # Export private key (DANGEROUS)
 */

const fs = require('fs');
const path = require('path');

class WalletManager {
    constructor() {
        this.registryPath = path.join(__dirname, '../WALLETS_REGISTRY.json');
        this.registry = this.loadRegistry();
    }

    loadRegistry() {
        try {
            const data = fs.readFileSync(this.registryPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Failed to load wallet registry:', error.message);
            process.exit(1);
        }
    }

    listWallets() {
        console.log('\n🏦 NIVIX WALLET REGISTRY');
        console.log('=' .repeat(50));
        
        console.log('\n📋 Core Wallets:');
        Object.entries(this.registry.coreWallets).forEach(([key, wallet]) => {
            console.log(`  • ${wallet.name}`);
            console.log(`    Address: ${wallet.publicKey}`);
            console.log(`    Purpose: ${wallet.purpose}`);
            console.log(`    Security: ${wallet.securityLevel}`);
            console.log('');
        });

        console.log('💰 Mint Accounts:');
        Object.entries(this.registry.mintAccounts.currencies).forEach(([currency, mint]) => {
            console.log(`  • ${mint.name} (${mint.symbol})`);
            console.log(`    Mint: ${mint.mintAddress}`);
            console.log(`    Token Account: ${mint.tokenAccount}`);
            console.log('');
        });

        console.log('⚠️  Security Level: DEVELOPMENT ONLY');
        console.log('🚨 Production requires multi-signature wallets');
    }

    getWalletInfo(walletName) {
        const wallet = this.findWallet(walletName);
        if (!wallet) {
            console.error(`❌ Wallet '${walletName}' not found`);
            return;
        }

        console.log(`\n🔍 Wallet Information: ${wallet.name || walletName}`);
        console.log('=' .repeat(50));
        console.log(`Address: ${wallet.publicKey}`);
        console.log(`Purpose: ${wallet.purpose || 'Not specified'}`);
        console.log(`Security Level: ${wallet.securityLevel || 'Unknown'}`);
        
        if (wallet.responsibilities) {
            console.log('\nResponsibilities:');
            wallet.responsibilities.forEach(resp => {
                console.log(`  • ${resp}`);
            });
        }

        if (wallet.associatedTokenAccounts) {
            console.log('\nAssociated Token Accounts:');
            Object.entries(wallet.associatedTokenAccounts).forEach(([currency, account]) => {
                console.log(`  ${currency}: ${account}`);
            });
        }

        console.log(`\nSOL Balance: Use 'balance' command to check live balance`);
    }

    getWalletBalance(walletName) {
        const wallet = this.findWallet(walletName);
        if (!wallet) {
            console.error(`❌ Wallet '${walletName}' not found`);
            return;
        }

        console.log(`\n💰 Balance Information for ${wallet.name || walletName}`);
        console.log('=' .repeat(50));
        console.log(`Address: ${wallet.publicKey}`);
        console.log('\n📋 To check live balances, use:');
        console.log(`solana balance ${wallet.publicKey} --url devnet`);
        
        if (wallet.associatedTokenAccounts) {
            console.log('\n🪙 Token Account Addresses:');
            Object.entries(wallet.associatedTokenAccounts).forEach(([currency, tokenAccount]) => {
                console.log(`  ${currency}: ${tokenAccount}`);
                console.log(`    Check: spl-token balance ${tokenAccount} --url devnet`);
            });
        }
        
        console.log('\n💡 For automated balance checking, run the bridge service API:');
        console.log(`curl http://localhost:3002/api/treasury/status`);
    }

    exportPrivateKey(walletName) {
        console.log('\n⚠️  WARNING: EXPORTING PRIVATE KEY');
        console.log('🚨 This operation exposes sensitive information!');
        console.log('🔒 Only use for development purposes on devnet');
        
        const wallet = this.findWallet(walletName);
        if (!wallet) {
            console.error(`❌ Wallet '${walletName}' not found`);
            return;
        }

        if (!wallet.privateKey) {
            console.error(`❌ Private key not available for ${walletName}`);
            return;
        }

        console.log('\n📋 Wallet Export:');
        console.log(`Name: ${wallet.name || walletName}`);
        console.log(`Public Key: ${wallet.publicKey}`);
        console.log(`Private Key (Uint8Array): [${wallet.privateKey.join(',')}]`);
        
        // Also show as base64 for convenience
        try {
            const privateKeyBuffer = Buffer.from(wallet.privateKey);
            console.log(`Private Key (Base64): ${privateKeyBuffer.toString('base64')}`);
            console.log(`Private Key (Hex): ${privateKeyBuffer.toString('hex')}`);
        } catch (error) {
            console.log('Private Key (Base64/Hex): Unable to convert');
        }

        console.log('\n⚠️  Remember:');
        console.log('  • Never share private keys');
        console.log('  • Never use these keys on mainnet');
        console.log('  • Replace with multi-sig for production');
    }

    findWallet(walletName) {
        // Check core wallets
        if (this.registry.coreWallets[walletName]) {
            return this.registry.coreWallets[walletName];
        }

        // Check by name or public key
        for (const [key, wallet] of Object.entries(this.registry.coreWallets)) {
            if (wallet.name.toLowerCase().includes(walletName.toLowerCase()) ||
                wallet.publicKey === walletName ||
                key.toLowerCase() === walletName.toLowerCase()) {
                return wallet;
            }
        }

        return null;
    }

    showHelp() {
        console.log('\n🔧 Nivix Wallet Manager');
        console.log('Usage: node scripts/wallet-manager.js <command> [options]');
        console.log('\nCommands:');
        console.log('  list                    List all wallets');
        console.log('  info <wallet>          Show wallet details');
        console.log('  balance <wallet>       Check wallet balance');
        console.log('  export <wallet>        Export private key (DANGEROUS)');
        console.log('  help                   Show this help');
        console.log('\nWallet names:');
        console.log('  treasuryWallet        Treasury management wallet');
        console.log('  bridgeWallet          Bridge service wallet');
        console.log('  protocolWallet        Smart contract wallet');
        console.log('\nExample:');
        console.log('  node scripts/wallet-manager.js balance treasuryWallet');
    }
}

// CLI Interface
function main() {
    const walletManager = new WalletManager();
    const command = process.argv[2];
    const walletName = process.argv[3];

    switch (command) {
        case 'list':
            walletManager.listWallets();
            break;
        
        case 'info':
            if (!walletName) {
                console.error('❌ Please specify a wallet name');
                walletManager.showHelp();
                return;
            }
            walletManager.getWalletInfo(walletName);
            break;
        
        case 'balance':
            if (!walletName) {
                console.error('❌ Please specify a wallet name');
                walletManager.showHelp();
                return;
            }
            walletManager.getWalletBalance(walletName);
            break;
        
        case 'export':
            if (!walletName) {
                console.error('❌ Please specify a wallet name');
                walletManager.showHelp();
                return;
            }
            walletManager.exportPrivateKey(walletName);
            break;
        
        case 'help':
        default:
            walletManager.showHelp();
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = WalletManager;


