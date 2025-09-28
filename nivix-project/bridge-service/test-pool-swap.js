#!/usr/bin/env node

/**
 * Test Pool Swap Functionality
 * This simulates what should happen when pool swaps work correctly
 */

const axios = require('axios');

const BRIDGE_URL = 'http://localhost:3003';
const USER_ADDRESS = '6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5';

async function testPoolSwap() {
    try {
        console.log('🚀 Testing Pool Swap Functionality...\n');

        // Step 1: Check current treasury balances
        console.log('📊 Step 1: Checking current treasury balances...');
        const balancesResponse = await axios.get(`${BRIDGE_URL}/api/simple-pool/balances`);
        console.log('Current balances:', balancesResponse.data.balances);

        // Step 2: Test the old swap endpoint (should fail with signature error)
        console.log('\n🔄 Step 2: Testing old swap endpoint (should fail)...');
        try {
            const swapResponse = await axios.post(`${BRIDGE_URL}/api/simple-pool/swap`, {
                userAddress: USER_ADDRESS,
                fromCurrency: 'USD',
                toCurrency: 'EUR',
                amount: '10'
            });
            console.log('❌ Unexpected success:', swapResponse.data);
        } catch (error) {
            console.log('✅ Expected failure:', error.response?.data?.error || error.message);
        }

        // Step 3: Test the new create-swap-transaction endpoint
        console.log('\n🔄 Step 3: Testing new create-swap-transaction endpoint...');
        try {
            const createResponse = await axios.post(`${BRIDGE_URL}/api/simple-pool/create-swap-transaction`, {
                userAddress: USER_ADDRESS,
                fromCurrency: 'USD',
                toCurrency: 'EUR',
                amount: '10'
            });
            console.log('✅ Transaction created successfully!');
            console.log('Transaction details:', {
                fromAmount: createResponse.data.fromAmount,
                toAmount: createResponse.data.toAmount,
                feeAmount: createResponse.data.feeAmount,
                exchangeRate: createResponse.data.exchangeRate
            });
            console.log('Transaction size:', createResponse.data.transaction.length, 'characters');
        } catch (error) {
            console.log('❌ Failed to create transaction:', error.response?.data?.error || error.message);
        }

        // Step 4: Check balances again
        console.log('\n📊 Step 4: Checking balances again...');
        const balancesResponse2 = await axios.get(`${BRIDGE_URL}/api/simple-pool/balances`);
        console.log('Balances after test:', balancesResponse2.data.balances);

        console.log('\n🎉 Pool Swap Test Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testPoolSwap();