# 🏊 Nivix Protocol - Liquidity Pools Guide

## 📋 Overview

The Nivix Protocol supports multiple liquidity pools for different currency pairs, enabling users to swap between various currencies with different fee structures and exchange rates.

## 🎯 Key Features

- **Multiple Currency Pairs**: Support for USD, INR, EUR, SOL, USDC, and more
- **Pool-Specific Fees**: Each pool can have different fee rates
- **Dynamic Exchange Rates**: Admin can update rates based on market conditions
- **Liquidity Provision**: Users can add liquidity and earn fees
- **Comprehensive Tracking**: All swaps are recorded with unique IDs

## 🏗️ Pool Structure

### Pool Configuration
```rust
pub struct LiquidityPool {
    pub name: String,                    // Pool name (e.g., "USD-INR Pool")
    pub admin: Pubkey,                   // Pool administrator
    pub source_currency: String,         // Source currency (e.g., "USD")
    pub destination_currency: String,    // Destination currency (e.g., "INR")
    pub source_mint: Pubkey,            // Source token mint address
    pub destination_mint: Pubkey,       // Destination token mint address
    pub exchange_rate: u64,             // Exchange rate (scaled by 10,000)
    pub pool_fee_rate: u64,             // Pool-specific fee (basis points)
    pub total_swapped: u64,             // Total volume swapped
    pub total_volume: u64,              // Total liquidity volume
    pub last_updated: i64,              // Last rate update timestamp
    pub is_active: bool,                // Pool status
    pub created_at: i64,                // Creation timestamp
}
```

## 🚀 Creating Different Liquidity Pools

### 1. USD-INR Pool (Major Currency Pair)
```typescript
// 1 USD = 83.25 INR
const usdInrPool = {
    name: "USD-INR Pool",
    sourceCurrency: "USD",
    destinationCurrency: "INR",
    exchangeRate: new BN(832500),    // 83.25 * 10,000
    poolFeeRate: new BN(30),         // 0.3% fee
    description: "US Dollar to Indian Rupee exchange"
};
```

### 2. USD-EUR Pool (Major Currency Pair)
```typescript
// 1 USD = 0.92 EUR
const usdEurPool = {
    name: "USD-EUR Pool",
    sourceCurrency: "USD",
    destinationCurrency: "EUR",
    exchangeRate: new BN(92000),     // 0.92 * 10,000
    poolFeeRate: new BN(25),         // 0.25% fee
    description: "US Dollar to Euro exchange"
};
```

### 3. SOL-USD Pool (Crypto-Fiat)
```typescript
// 1 SOL = $95.00
const solUsdPool = {
    name: "SOL-USD Pool",
    sourceCurrency: "SOL",
    destinationCurrency: "USD",
    exchangeRate: new BN(9500),      // 95.00 * 100
    poolFeeRate: new BN(20),         // 0.2% fee
    description: "Solana to US Dollar exchange"
};
```

### 4. USDC-INR Pool (Stablecoin-Fiat)
```typescript
// 1 USDC = 83.25 INR
const usdcInrPool = {
    name: "USDC-INR Pool",
    sourceCurrency: "USDC",
    destinationCurrency: "INR",
    exchangeRate: new BN(832500),    // 83.25 * 10,000
    poolFeeRate: new BN(15),         // 0.15% fee (lower for stablecoins)
    description: "USDC stablecoin to Indian Rupee exchange"
};
```

### 5. INR-EUR Pool (Emerging Market)
```typescript
// 1 INR = 0.0011 EUR
const inrEurPool = {
    name: "INR-EUR Pool",
    sourceCurrency: "INR",
    destinationCurrency: "EUR",
    exchangeRate: new BN(110),       // 0.0011 * 100,000
    poolFeeRate: new BN(35),         // 0.35% fee (higher for emerging markets)
    description: "Indian Rupee to Euro exchange"
};
```

## 🔧 Pool Management Functions

### Create Pool
```typescript
await program.methods
    .createLiquidityPool(
        poolName,           // String
        sourceCurrency,     // String
        destinationCurrency, // String
        exchangeRate,       // u64 (scaled by 10,000)
        poolFeeRate         // u64 (basis points)
    )
    .accounts({
        liquidityPool: poolKeypair.publicKey,
        platform: platformKeypair.publicKey,
        admin: admin.publicKey,
        sourceMint: sourceMint.publicKey,
        destinationMint: destinationMint.publicKey,
        payer: admin.publicKey,
        systemProgram: SystemProgram.programId,
    })
    .signers([poolKeypair, admin, sourceMint, destinationMint])
    .rpc();
```

### Update Exchange Rate
```typescript
await program.methods
    .updatePoolRate(newExchangeRate)
    .accounts({
        liquidityPool: poolAddress,
        admin: admin.publicKey,
    })
    .rpc();
```

### Add Liquidity
```typescript
await program.methods
    .addLiquidity(sourceAmount, destinationAmount)
    .accounts({
        liquidityPool: poolAddress,
        user: userAccount,
        userSourceAccount: userSourceTokenAccount,
        userDestinationAccount: userDestTokenAccount,
        poolSourceAccount: poolSourceTokenAccount,
        poolDestinationAccount: poolDestTokenAccount,
        liquidityMint: liquidityMint,
        userLiquidityAccount: userLiquidityAccount,
        poolAuthority: poolAuthority,
        owner: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
```

## 💰 Fee Structure Examples

### Platform Fees vs Pool Fees
- **Platform Fee**: 0.5% (applied to all transactions)
- **Pool Fees**: Vary by pool (0.15% to 0.35%)

### Fee Calculation Example
```typescript
// For a $100 USD → INR swap in USD-INR pool:
const amountIn = 10000; // $100 in smallest units
const platformFee = (amountIn * 50) / 10000;    // 0.5% = $0.50
const poolFee = (amountIn * 30) / 10000;        // 0.3% = $0.30
const totalFee = platformFee + poolFee;         // Total = $0.80

// User receives: $100 - $0.80 = $99.20 worth of INR
```

## 📊 Pool Discovery and Information

### Get Pool Info
```typescript
// View function to get pool information
await program.methods
    .getPoolInfo()
    .accounts({
        liquidityPool: poolAddress,
    })
    .rpc();
```

### Pool Statistics
- **Total Swapped**: Volume of all swaps in the pool
- **Total Volume**: Total liquidity provided to the pool
- **Exchange Rate**: Current exchange rate
- **Pool Fee Rate**: Pool-specific fee percentage
- **Last Updated**: When the rate was last modified

## 🎯 Best Practices

### 1. Pool Naming Convention
```
{SourceCurrency}-{DestinationCurrency} Pool
Examples: USD-INR Pool, SOL-USD Pool, EUR-INR Pool
```

### 2. Fee Rate Strategy
- **Major Pairs** (USD-EUR): 0.20% - 0.30%
- **Emerging Markets** (INR-EUR): 0.30% - 0.40%
- **Crypto-Fiat** (SOL-USD): 0.15% - 0.25%
- **Stablecoins** (USDC-INR): 0.10% - 0.20%

### 3. Exchange Rate Scaling
- **Standard**: Scale by 10,000 for most currencies
- **Small Values**: Scale by 100,000 for very small exchange rates
- **Example**: 1 INR = 0.0011 EUR → 110 (scaled by 100,000)

### 4. Liquidity Management
- Start with reasonable initial liquidity
- Monitor pool usage and adjust fees accordingly
- Provide incentives for liquidity providers
- Regular rate updates based on market conditions

## 🚀 Advanced Features

### 1. Multi-Hop Swaps
Users can swap through multiple pools:
```
USD → EUR → INR (using USD-EUR and EUR-INR pools)
```

### 2. Dynamic Fee Adjustment
Admin can adjust pool fees based on:
- Market volatility
- Liquidity depth
- Competition
- Regulatory requirements

### 3. Pool Analytics
Track:
- Volume trends
- Fee revenue
- User behavior
- Market impact

## 🔒 Security Considerations

### 1. Admin Controls
- Only platform admin can create pools
- Pool admin can update rates and fees
- Multi-signature support for critical operations

### 2. Rate Validation
- Exchange rates must be within reasonable bounds
- Sudden rate changes are logged and monitored
- Circuit breakers for extreme market conditions

### 3. Liquidity Protection
- Slippage protection for large swaps
- Minimum liquidity requirements
- Emergency pause functionality

## 📈 Future Enhancements

### 1. Automated Market Making (AMM)
- Dynamic fee adjustment based on volatility
- Liquidity curve optimization
- Flash loan protection

### 2. Cross-Chain Pools
- Bridge integration with other blockchains
- Cross-chain liquidity provision
- Unified fee structure

### 3. Governance
- DAO-based pool management
- Community fee voting
- Protocol upgrades

---

## 🎉 Conclusion

The Nivix Protocol's liquidity pool system provides a robust foundation for multi-currency operations with:

- **Flexibility**: Support for any currency pair
- **Efficiency**: Pool-specific optimization
- **Security**: Comprehensive validation and controls
- **Scalability**: Easy addition of new pools
- **Transparency**: Full audit trail and tracking

This system enables the Nivix Protocol to serve as a comprehensive cross-border payment solution with competitive exchange rates and transparent fee structures.




