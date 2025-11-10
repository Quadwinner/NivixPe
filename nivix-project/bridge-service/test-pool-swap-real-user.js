const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { 
    createTransferInstruction, 
    getAssociatedTokenAddress,
    createMintToInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const fs = require('fs');

async function testPoolSwapWithRealUser() {
    try {
        console.log('🧪 Testing Pool Swap with Real User Wallet...');
        
        // Initialize connection
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        
        // Load bridge wallet (treasury)
        const walletPath = '/media/shubham/OS/for linux work/blockchain solana/nivix-project/bridge-service/wallet/bridge-wallet.json';
        const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
        const treasuryKeypair = Keypair.fromSecretKey(Uint8Array.from(walletData));
        
        // Create a test user wallet
        const userKeypair = Keypair.generate();
        console.log('👤 User wallet:', userKeypair.publicKey.toString());
        console.log('🏦 Treasury wallet:', treasuryKeypair.publicKey.toString());
        
        // Load mint accounts
        const mintAccountsPath = '/media/shubham/OS/for linux work/blockchain solana/nivix-project/bridge-service/data/mint-accounts.json';
        const mintAccounts = JSON.parse(fs.readFileSync(mintAccountsPath, 'utf8'));
        
        const usdMint = new PublicKey(mintAccounts.usdMint);
        const eurMint = new PublicKey(mintAccounts.eurMint);
        
        // Get token accounts
        const userUsdAccount = await getAssociatedTokenAddress(usdMint, userKeypair.publicKey);
        const userEurAccount = await getAssociatedTokenAddress(eurMint, userKeypair.publicKey);
        const treasuryUsdAccount = await getAssociatedTokenAddress(usdMint, treasuryKeypair.publicKey);
        const treasuryEurAccount = await getAssociatedTokenAddress(eurMint, treasuryKeypair.publicKey);
        
        console.log('👤 User USD Account:', userUsdAccount.toString());
        console.log('👤 User EUR Account:', userEurAccount.toString());
        console.log('🏦 Treasury USD Account:', treasuryUsdAccount.toString());
        console.log('🏦 Treasury EUR Account:', treasuryEurAccount.toString());
        
        // Check balances before operations
        console.log('\n📊 Checking balances BEFORE operations...');
        const userUsdBefore = await connection.getTokenAccountBalance(userUsdAccount).catch(() => ({ value: { uiAmount: 0 } }));
        const userEurBefore = await connection.getTokenAccountBalance(userEurAccount).catch(() => ({ value: { uiAmount: 0 } }));
        const treasuryUsdBefore = await connection.getTokenAccountBalance(treasuryUsdAccount);
        const treasuryEurBefore = await connection.getTokenAccountBalance(treasuryEurAccount);
        
        console.log('👤 User USD Balance:', userUsdBefore.value.uiAmount);
        console.log('👤 User EUR Balance:', userEurBefore.value.uiAmount);
        console.log('🏦 Treasury USD Balance:', treasuryUsdBefore.value.uiAmount);
        console.log('🏦 Treasury EUR Balance:', treasuryEurBefore.value.uiAmount);
        
        // Step 1: Create user token accounts and mint some USD tokens to user
        console.log('\n🪙 Step 1: Creating user token accounts and minting 100 USD...');
        const mintAmount = 100 * Math.pow(10, 6); // 100 USD tokens
        
        const setupTransaction = new Transaction();
        
        // Create user USD token account
        setupTransaction.add(
            createAssociatedTokenAccountInstruction(
                treasuryKeypair.publicKey, // payer
                userUsdAccount, // associated token account
                userKeypair.publicKey, // owner
                usdMint // mint
            )
        );
        
        // Create user EUR token account
        setupTransaction.add(
            createAssociatedTokenAccountInstruction(
                treasuryKeypair.publicKey, // payer
                userEurAccount, // associated token account
                userKeypair.publicKey, // owner
                eurMint // mint
            )
        );
        
        // Mint USD tokens to user
        setupTransaction.add(
            createMintToInstruction(
                usdMint, // mint
                userUsdAccount, // destination
                treasuryKeypair.publicKey, // mint authority
                mintAmount // amount
            )
        );
        
        const { blockhash: setupBlockhash } = await connection.getLatestBlockhash();
        setupTransaction.recentBlockhash = setupBlockhash;
        setupTransaction.feePayer = treasuryKeypair.publicKey;
        setupTransaction.sign(treasuryKeypair);
        
        const setupSignature = await connection.sendTransaction(setupTransaction, [treasuryKeypair]);
        console.log('🪙 Setup transaction:', setupSignature);
        
        // Wait for confirmation
        await connection.confirmTransaction(setupSignature);
        
        // Check balances after setup
        console.log('\n📊 Checking balances AFTER setup...');
        const userUsdAfterSetup = await connection.getTokenAccountBalance(userUsdAccount);
        const userEurAfterSetup = await connection.getTokenAccountBalance(userEurAccount);
        const treasuryUsdAfterSetup = await connection.getTokenAccountBalance(treasuryUsdAccount);
        const treasuryEurAfterSetup = await connection.getTokenAccountBalance(treasuryEurAccount);
        
        console.log('👤 User USD Balance:', userUsdAfterSetup.value.uiAmount);
        console.log('👤 User EUR Balance:', userEurAfterSetup.value.uiAmount);
        console.log('🏦 Treasury USD Balance:', treasuryUsdAfterSetup.value.uiAmount);
        console.log('🏦 Treasury EUR Balance:', treasuryEurAfterSetup.value.uiAmount);
        
        // Step 2: Test the swap API
        console.log('\n🔄 Step 2: Testing swap API...');
        const swapResponse = await fetch('http://localhost:3003/api/simple-pool/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: userKeypair.publicKey.toString(),
                fromCurrency: 'USD',
                toCurrency: 'EUR',
                amount: '10'
            })
        });
        
        const swapResult = await swapResponse.json();
        console.log('🔄 Swap Result:', swapResult);
        
        if (swapResult.success) {
            // Wait for transaction confirmation
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('\n📊 Checking balances AFTER swap...');
            const userUsdAfterSwap = await connection.getTokenAccountBalance(userUsdAccount);
            const userEurAfterSwap = await connection.getTokenAccountBalance(userEurAccount);
            const treasuryUsdAfterSwap = await connection.getTokenAccountBalance(treasuryUsdAccount);
            const treasuryEurAfterSwap = await connection.getTokenAccountBalance(treasuryEurAccount);
            
            console.log('👤 User USD Balance:', userUsdAfterSwap.value.uiAmount);
            console.log('👤 User EUR Balance:', userEurAfterSwap.value.uiAmount);
            console.log('🏦 Treasury USD Balance:', treasuryUsdAfterSwap.value.uiAmount);
            console.log('🏦 Treasury EUR Balance:', treasuryEurAfterSwap.value.uiAmount);
            
            console.log('\n📈 Balance Changes:');
            console.log('👤 User USD Change:', (userUsdAfterSwap.value.uiAmount - userUsdAfterSetup.value.uiAmount));
            console.log('👤 User EUR Change:', (userEurAfterSwap.value.uiAmount - userEurAfterSetup.value.uiAmount));
            console.log('🏦 Treasury USD Change:', (treasuryUsdAfterSwap.value.uiAmount - treasuryUsdAfterSetup.value.uiAmount));
            console.log('🏦 Treasury EUR Change:', (treasuryEurAfterSwap.value.uiAmount - treasuryEurAfterSetup.value.uiAmount));
            
            // Check if the swap worked correctly
            const userUsdDecreased = userUsdAfterSwap.value.uiAmount < userUsdAfterSetup.value.uiAmount;
            const userEurIncreased = userEurAfterSwap.value.uiAmount > userEurAfterSetup.value.uiAmount;
            const treasuryUsdIncreased = treasuryUsdAfterSwap.value.uiAmount > treasuryUsdAfterSetup.value.uiAmount;
            const treasuryEurDecreased = treasuryEurAfterSwap.value.uiAmount < treasuryEurAfterSetup.value.uiAmount;
            
            if (userUsdDecreased && userEurIncreased && treasuryUsdIncreased && treasuryEurDecreased) {
                console.log('✅ SUCCESS: Pool swap worked correctly!');
                console.log('✅ User USD decreased (sent to treasury)');
                console.log('✅ User EUR increased (received from treasury)');
                console.log('✅ Treasury USD increased (received from user)');
                console.log('✅ Treasury EUR decreased (sent to user)');
            } else {
                console.log('❌ FAILED: Pool swap did not work as expected');
                console.log('User USD decreased:', userUsdDecreased);
                console.log('User EUR increased:', userEurIncreased);
                console.log('Treasury USD increased:', treasuryUsdIncreased);
                console.log('Treasury EUR decreased:', treasuryEurDecreased);
            }
        } else {
            console.log('❌ Swap failed:', swapResult.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testPoolSwapWithRealUser();




