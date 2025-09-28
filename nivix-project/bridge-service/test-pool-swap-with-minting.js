const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { 
    createTransferInstruction, 
    getAssociatedTokenAddress,
    createMintToInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const fs = require('fs');

async function testPoolSwapWithMinting() {
    try {
        console.log('🧪 Testing Pool Swap with Token Minting...');
        
        // Initialize connection
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        
        // Load bridge wallet (treasury)
        const walletPath = '/media/shubham/OS/for linux work/blockchain solana/nivix-project/bridge-service/wallet/bridge-wallet.json';
        const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
        const treasuryKeypair = Keypair.fromSecretKey(Uint8Array.from(walletData));
        
        console.log('🏦 Treasury wallet:', treasuryKeypair.publicKey.toString());
        
        // Load mint accounts
        const mintAccountsPath = '/media/shubham/OS/for linux work/blockchain solana/nivix-project/bridge-service/data/mint-accounts.json';
        const mintAccounts = JSON.parse(fs.readFileSync(mintAccountsPath, 'utf8'));
        
        const usdMint = new PublicKey(mintAccounts.usdMint);
        const eurMint = new PublicKey(mintAccounts.eurMint);
        
        console.log('💰 USD Mint:', usdMint.toString());
        console.log('💰 EUR Mint:', eurMint.toString());
        
        // Get treasury token accounts
        const treasuryUsdAccount = await getAssociatedTokenAddress(usdMint, treasuryKeypair.publicKey);
        const treasuryEurAccount = await getAssociatedTokenAddress(eurMint, treasuryKeypair.publicKey);
        
        console.log('🏦 Treasury USD Account:', treasuryUsdAccount.toString());
        console.log('🏦 Treasury EUR Account:', treasuryEurAccount.toString());
        
        // Check balances before any operations
        console.log('\n📊 Checking balances BEFORE operations...');
        const usdBalanceBefore = await connection.getTokenAccountBalance(treasuryUsdAccount);
        const eurBalanceBefore = await connection.getTokenAccountBalance(treasuryEurAccount);
        
        console.log('💰 Treasury USD Balance:', usdBalanceBefore.value.uiAmount);
        console.log('💰 Treasury EUR Balance:', eurBalanceBefore.value.uiAmount);
        
        // Step 1: Mint some USD tokens to the treasury (simulate user having tokens)
        console.log('\n🪙 Step 1: Minting 100 USD tokens to treasury...');
        const mintAmount = 100 * Math.pow(10, 6); // 100 USD tokens
        
        const mintTransaction = new Transaction();
        mintTransaction.add(
            createMintToInstruction(
                usdMint, // mint
                treasuryUsdAccount, // destination
                treasuryKeypair.publicKey, // mint authority
                mintAmount // amount
            )
        );
        
        const { blockhash: mintBlockhash } = await connection.getLatestBlockhash();
        mintTransaction.recentBlockhash = mintBlockhash;
        mintTransaction.feePayer = treasuryKeypair.publicKey;
        mintTransaction.sign(treasuryKeypair);
        
        const mintSignature = await connection.sendTransaction(mintTransaction, [treasuryKeypair]);
        console.log('🪙 Mint transaction:', mintSignature);
        
        // Wait for confirmation
        await connection.confirmTransaction(mintSignature);
        
        // Check balances after minting
        console.log('\n📊 Checking balances AFTER minting...');
        const usdBalanceAfterMint = await connection.getTokenAccountBalance(treasuryUsdAccount);
        const eurBalanceAfterMint = await connection.getTokenAccountBalance(treasuryEurAccount);
        
        console.log('💰 Treasury USD Balance:', usdBalanceAfterMint.value.uiAmount);
        console.log('💰 Treasury EUR Balance:', eurBalanceAfterMint.value.uiAmount);
        
        // Step 2: Now test the swap API
        console.log('\n🔄 Step 2: Testing swap API...');
        const swapResponse = await fetch('http://localhost:3003/api/simple-pool/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: treasuryKeypair.publicKey.toString(),
                fromCurrency: 'USD',
                toCurrency: 'EUR',
                amount: '10'
            })
        });
        
        const swapResult = await swapResponse.json();
        console.log('🔄 Swap Result:', swapResult);
        
        if (swapResult.success) {
            // Wait a moment for transaction to be confirmed
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('\n📊 Checking balances AFTER swap...');
            const usdBalanceAfterSwap = await connection.getTokenAccountBalance(treasuryUsdAccount);
            const eurBalanceAfterSwap = await connection.getTokenAccountBalance(treasuryEurAccount);
            
            console.log('💰 Treasury USD Balance:', usdBalanceAfterSwap.value.uiAmount);
            console.log('💰 Treasury EUR Balance:', eurBalanceAfterSwap.value.uiAmount);
            
            console.log('\n📈 Balance Changes:');
            console.log('USD Change:', (usdBalanceAfterSwap.value.uiAmount - usdBalanceAfterMint.value.uiAmount));
            console.log('EUR Change:', (eurBalanceAfterSwap.value.uiAmount - eurBalanceAfterMint.value.uiAmount));
            
            if (usdBalanceAfterSwap.value.uiAmount < usdBalanceAfterMint.value.uiAmount && 
                eurBalanceAfterSwap.value.uiAmount > eurBalanceAfterMint.value.uiAmount) {
                console.log('✅ SUCCESS: Treasury balances changed correctly!');
                console.log('✅ USD decreased (tokens sent to user)');
                console.log('✅ EUR increased (tokens received from user)');
            } else {
                console.log('❌ FAILED: Treasury balances did not change as expected');
            }
        } else {
            console.log('❌ Swap failed:', swapResult.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testPoolSwapWithMinting();




