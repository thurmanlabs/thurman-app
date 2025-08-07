# Portfolio Service Documentation

## Overview

The Portfolio Service aggregates user portfolio data by querying real on-chain data using Circle SDK. It provides comprehensive portfolio analytics including current values, returns, and position details across all deployed lending pools.

## Features

### 🔍 Real On-Chain Data
- **Circle SDK Integration**: Queries actual vault contracts for share balances
- **Live Value Conversion**: Uses `convertToAssets()` for current USD values
- **Multi-Pool Support**: Aggregates data across all deployed pools
- **Real-time Calculations**: Current value, returns, and percentages

### 📊 Portfolio Analytics
- **Total Invested**: Sum of all claimed deposits
- **Current Value**: Real-time USD value of all positions
- **Total Return**: Current value minus total invested
- **Return Percentage**: Percentage gain/loss calculation
- **Position Details**: Per-pool breakdown with metrics

### ⚡ Performance Optimizations
- **30-second Caching**: Reduces API calls and improves response times
- **Error Handling**: Graceful degradation when individual pools fail
- **Memory Management**: Efficient cache cleanup and management
- **Concurrent Processing**: Processes multiple pools simultaneously

## API Endpoints

### GET /api/user/portfolio/:userAddress

**Authentication**: Required (user can only access own portfolio)

**Parameters**:
- `userAddress` (path): User's wallet address (0x format)

**Response**:
```json
{
  "success": true,
  "data": {
    "userAddress": "0x1234...",
    "totalInvested": 1000.00,
    "currentValue": 1050.00,
    "totalReturn": 50.00,
    "returnPercentage": 5.00,
    "totalPositions": 3,
    "activePositions": 2,
    "positions": [
      {
        "poolId": 1,
        "poolName": "USDC Lending Pool",
        "vaultAddress": "0x...",
        "assetAddress": "0x...",
        "sharesOwned": "1000000000000000000",
        "currentValue": 500.00,
        "totalInvested": 480.00,
        "totalClaimed": 480.00,
        "pendingAmount": 0,
        "claimableAmount": 0,
        "returnAmount": 20.00,
        "returnPercentage": 4.17,
        "lastUpdated": "2024-01-15T10:30:00Z"
      }
    ],
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "message": "Portfolio data retrieved successfully"
}
```

## Core Functions

### `getUserPortfolio(userAddress: string)`

Main function that aggregates complete portfolio data.

**Process**:
1. Check cache for existing data
2. Fetch all deployed pools
3. Query each pool for user's position
4. Calculate portfolio metrics
5. Cache results for 30 seconds

### `getPoolPosition(userAddress: string, pool: PoolData)`

Gets user's position in a specific pool.

**Queries**:
- `balanceOf(userAddress)` - User's share balance
- `convertToAssets(shares)` - Current USD value
- Deposit status from in-memory state

### `getShareBalance(userAddress: string, vaultAddress: string)`

Queries user's share balance using Circle SDK.

### `convertSharesToUSD(shares: string, vaultAddress: string)`

Converts share balance to current USD value.

## Circle SDK Integration

### Contract Queries

The service uses Circle SDK to query vault contracts:

```typescript
// Get user's share balance
const shares = await circleClient.queryContract({
  contractAddress: vaultAddress,
  functionName: 'balanceOf',
  functionArgs: [userAddress]
});

// Convert shares to USD value
const usdValue = await circleClient.queryContract({
  contractAddress: vaultAddress,
  functionName: 'convertToAssets',
  functionArgs: [shares]
});
```

### Supported Functions

- `balanceOf(address)` - Get user's share balance
- `convertToAssets(shares)` - Convert shares to assets
- `totalAssets()` - Get total assets in vault
- `totalSupply()` - Get total shares in vault

## Caching Strategy

### Cache Structure
```typescript
interface PortfolioCache {
  data: PortfolioSummary;
  timestamp: number;
  expiresAt: number;
}
```

### Cache Management
- **Duration**: 30 seconds
- **Key**: User address
- **Cleanup**: Automatic expiration
- **Manual Clear**: Available via `clearPortfolioCache()`

### Cache Benefits
- Reduces API calls to Circle SDK
- Improves response times
- Reduces server load
- Maintains data freshness

## Error Handling

### Graceful Degradation
- Individual pool failures don't break entire portfolio
- Fallback to cached data when available
- Clear error messages for debugging

### Error Types
- **Contract Query Errors**: Individual pool failures
- **Network Errors**: Circle SDK connectivity issues
- **Validation Errors**: Invalid user addresses
- **Authentication Errors**: Unauthorized access attempts

## Data Types

### PortfolioSummary
```typescript
interface PortfolioSummary {
  userAddress: string;
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  returnPercentage: number;
  totalPositions: number;
  activePositions: number;
  positions: PortfolioPosition[];
  lastUpdated: string;
}
```

### PortfolioPosition
```typescript
interface PortfolioPosition {
  poolId: number;
  poolName: string;
  vaultAddress: string;
  assetAddress: string;
  sharesOwned: string;
  currentValue: number;
  totalInvested: number;
  totalClaimed: number;
  pendingAmount: number;
  claimableAmount: number;
  returnAmount: number;
  returnPercentage: number;
  lastUpdated: string;
}
```

## Usage Examples

### Basic Portfolio Retrieval
```typescript
import { getUserPortfolio } from '../services/portfolioService';

const portfolio = await getUserPortfolio('0x1234...');
console.log(`Total Value: $${portfolio.currentValue}`);
console.log(`Return: ${portfolio.returnPercentage}%`);
```

### Cache Management
```typescript
import { clearPortfolioCache, getPortfolioCacheStats } from '../services/portfolioService';

// Clear specific user's cache
clearPortfolioCache('0x1234...');

// Get cache statistics
const stats = getPortfolioCacheStats();
console.log(`Cache size: ${stats.size}`);
```

### Error Handling
```typescript
try {
  const portfolio = await getUserPortfolio(userAddress);
  // Process portfolio data
} catch (error) {
  console.error('Portfolio error:', error.message);
  // Handle error appropriately
}
```

## Performance Considerations

### Optimization Strategies
- **Parallel Processing**: Query multiple pools concurrently
- **Selective Caching**: Cache only frequently accessed data
- **Lazy Loading**: Load position details on demand
- **Batch Queries**: Group related contract calls

### Monitoring
- **Response Times**: Track API performance
- **Cache Hit Rates**: Monitor cache effectiveness
- **Error Rates**: Track contract query failures
- **Memory Usage**: Monitor cache memory consumption

## Future Enhancements

### Planned Features
- **Historical Data**: Track portfolio performance over time
- **Risk Metrics**: Calculate portfolio risk indicators
- **Performance Attribution**: Analyze returns by pool
- **Real-time Updates**: WebSocket integration for live updates

### Technical Improvements
- **Advanced Caching**: Redis integration for distributed caching
- **Query Optimization**: Batch contract queries
- **Data Validation**: Enhanced input validation
- **Metrics Collection**: Detailed performance metrics 