require('dotenv').config();
const RazorpayXPayouts = require('./src/payments/razorpayx-payouts');

/**
 * Test RazorpayX Payout Integration
 * 
 * This script tests the complete RazorpayX payout flow:
 * 1. Check account balance
 * 2. Create Contact
 * 3. Create Fund Account
 * 4. Create Payout
 * 5. Check Payout Status
 */

async function testRazorpayXPayout() {
    console.log('🧪 Starting RazorpayX Payout Test\n');
    console.log('='.repeat(60));
    
    try {
        // Initialize RazorpayX Payouts
        const razorpayx = new RazorpayXPayouts();
        
        // Check credentials
        console.log('\n📋 Configuration Check:');
        console.log('   API Key:', razorpayx.apiKey ? `${razorpayx.apiKey.substring(0, 15)}...` : '❌ NOT SET');
        console.log('   API Secret:', razorpayx.apiSecret ? '✅ SET' : '❌ NOT SET');
        console.log('   Account Number:', razorpayx.accountNumber || '❌ NOT SET');
        
        if (!razorpayx.apiKey || !razorpayx.apiSecret) {
            throw new Error('RazorpayX API credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
        }
        
        if (!razorpayx.accountNumber) {
            throw new Error('RazorpayX account number not configured. Set RAZORPAY_ACCOUNT_NUMBER in .env');
        }
        
        console.log('\n✅ Configuration valid\n');
        
        // Step 1: Check Account Balance
        console.log('='.repeat(60));
        console.log('STEP 1: Checking Account Balance');
        console.log('='.repeat(60));
        
        try {
            const balance = await razorpayx.getAccountBalance();
            if (balance.note) {
                console.log(`\n⚠️  ${balance.note}`);
                console.log(`   Account Number: ${balance.account_number}`);
                console.log('   Continuing with payout test...');
            } else {
                console.log(`\n💰 Account Balance: ₹${(balance.balance / 100).toFixed(2)}`);
                console.log(`   Currency: ${balance.currency}`);
                console.log(`   Account Number: ${balance.account_number}`);
                
                if (balance.balance === 0) {
                    console.log('\n⚠️  WARNING: Account balance is zero. Add funds to RazorpayX account for testing.');
                }
            }
        } catch (error) {
            console.warn('⚠️  Could not fetch balance:', error.message);
            console.log('   Continuing with payout test (balance check optional)...');
        }
        
        // Step 2: Test Beneficiary Data
        console.log('\n' + '='.repeat(60));
        console.log('STEP 2: Preparing Test Beneficiary');
        console.log('='.repeat(60));
        
        const testBeneficiary = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '9876543210',
            bank_account: {
                account_number: '1234567890',
                ifsc_code: 'SBIN0000001',
                account_holder_name: 'Test User'
            }
        };
        
        console.log('\n📝 Test Beneficiary Details:');
        console.log('   Name:', testBeneficiary.name);
        console.log('   Email:', testBeneficiary.email);
        console.log('   Phone:', testBeneficiary.phone);
        console.log('   Account Number:', testBeneficiary.bank_account.account_number);
        console.log('   IFSC Code:', testBeneficiary.bank_account.ifsc_code);
        
        // Step 3: Test Complete Payout Flow
        console.log('\n' + '='.repeat(60));
        console.log('STEP 3: Testing Complete Payout Flow');
        console.log('='.repeat(60));
        
        const testAmount = 1; // ₹1 for testing (minimum amount)
        const referenceId = `test_${Date.now()}`;
        
        console.log(`\n💸 Test Payout Amount: ₹${testAmount}`);
        console.log(`   Reference ID: ${referenceId}`);
        console.log('\n⏳ Processing payout...\n');
        
        const result = await razorpayx.processCompletePayout(
            testBeneficiary,
            testAmount,
            'payout',
            referenceId
        );
        
        if (result.success) {
            console.log('\n✅ PAYOUT TEST SUCCESSFUL!\n');
            console.log('📊 Payout Details:');
            console.log('   Payout ID:', result.payoutId);
            console.log('   Contact ID:', result.contactId);
            console.log('   Fund Account ID:', result.fundAccountId);
            console.log('   Status:', result.status);
            console.log('   Amount:', `₹${result.amount}`);
            console.log('   Currency:', result.currency);
            console.log('   Mode:', result.mode);
            console.log('   Estimated Completion:', result.estimatedCompletion.toLocaleString());
            
            // Step 4: Check Payout Status
            console.log('\n' + '='.repeat(60));
            console.log('STEP 4: Checking Payout Status');
            console.log('='.repeat(60));
            
            try {
                const status = await razorpayx.getPayoutStatus(result.payoutId);
                console.log('\n📊 Current Payout Status:');
                console.log('   Payout ID:', status.id);
                console.log('   Status:', status.status);
                console.log('   Amount:', `₹${(status.amount / 100).toFixed(2)}`);
                console.log('   Currency:', status.currency);
                console.log('   Mode:', status.mode);
                console.log('   UTR:', status.utr || 'N/A');
                console.log('   Created At:', new Date(status.created_at * 1000).toLocaleString());
                
                if (status.failure_reason) {
                    console.log('   Failure Reason:', status.failure_reason);
                }
            } catch (error) {
                console.warn('⚠️  Could not fetch payout status:', error.message);
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('✅ ALL TESTS PASSED!');
            console.log('='.repeat(60));
            console.log('\n🎉 RazorpayX Payout integration is working correctly!');
            console.log('\n💡 Next Steps:');
            console.log('   1. Check RazorpayX Dashboard for payout details');
            console.log('   2. Verify account balance deduction');
            console.log('   3. Test with real beneficiary data on your website');
            
        } else {
            console.log('\n❌ PAYOUT TEST FAILED!\n');
            console.log('Error:', result.error);
            console.log('Status:', result.status);
            
            console.log('\n' + '='.repeat(60));
            console.log('❌ TEST FAILED');
            console.log('='.repeat(60));
            console.log('\n🔍 Troubleshooting:');
            console.log('   1. Check account balance in RazorpayX Dashboard');
            console.log('   2. Verify account number is correct');
            console.log('   3. Ensure account is activated and KYC verified');
            console.log('   4. Check API keys are valid');
            console.log('   5. Review error message above for details');
            
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ TEST ERROR');
        console.error('='.repeat(60));
        console.error('\nError:', error.message);
        console.error('\nStack:', error.stack);
        
        console.log('\n🔍 Common Issues:');
        console.log('   1. Missing environment variables in .env file');
        console.log('   2. Invalid API credentials');
        console.log('   3. Account number not configured');
        console.log('   4. Network connectivity issues');
        console.log('   5. RazorpayX API errors (check error message above)');
        
        process.exit(1);
    }
}

// Run the test
console.log('🚀 RazorpayX Payout Test Script');
console.log('📅 Started at:', new Date().toLocaleString());
console.log('');

testRazorpayXPayout()
    .then(() => {
        console.log('\n✅ Test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    });

