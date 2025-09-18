#!/usr/bin/env node

const OnrampEngine = require('./src/onramp/onramp-engine');

async function testOnrampEngine() {
    console.log('🧪 Testing OnrampEngine initialization...');
    
    try {
        const onrampEngine = new OnrampEngine();
        console.log('✅ OnrampEngine created');
        console.log('🔍 Initial state - orderManager:', onrampEngine.orderManager ? 'exists' : 'null');
        console.log('🔍 Initial state - initialized:', onrampEngine.initialized);
        
        await onrampEngine.initialize();
        console.log('✅ OnrampEngine initialized successfully');
        console.log('🔍 After init - orderManager:', onrampEngine.orderManager ? 'exists' : 'null');
        console.log('🔍 After init - initialized:', onrampEngine.initialized);
        
        // Test getUserOrders method
        if (onrampEngine.orderManager) {
            const result = await onrampEngine.getUserOrders('6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5');
            console.log('✅ getUserOrders result success:', result.success);
            console.log('✅ getUserOrders orders count:', result.orders ? result.orders.length : 0);
        } else {
            console.error('❌ orderManager is still null after initialization');
        }
        
    } catch (error) {
        console.error('❌ OnrampEngine test failed:', error);
        console.error('❌ Error stack:', error.stack);
    }
}

testOnrampEngine();





