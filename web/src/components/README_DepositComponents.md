# Deposit Interface Components

This directory contains a complete set of React components for handling deposit functionality with real-time status updates in the Thurman lending platform.

## Components Overview

### 1. DepositSection.tsx
**Purpose**: Handles deposit requests with real-time validation and form submission.

**Features**:
- Amount input with real-time validation
- Validates against pool min/max limits and user balance
- "Request Deposit" button with loading states
- Integration with POST /api/deposits/request endpoint
- Clear error messages and success feedback
- Auto-format currency amounts

**Props**:
```typescript
interface DepositSectionProps {
  poolId: number;
  poolName: string;
  minDeposit?: number;
  maxDeposit?: number;
  userBalance?: number;
  onDepositSuccess?: (transactionId: string) => void;
  onDepositError?: (error: string) => void;
}
```

### 2. DepositStatusCard.tsx
**Purpose**: Displays real-time deposit status with pending, claimable, and claimed amounts.

**Features**:
- Shows current status: pending, claimable, claimed amounts
- "Claim Shares" button when claimable amount > 0
- Calls POST /api/deposits/claim when user clicks claim
- Transaction status indicators and progress
- Loading states and error handling
- Color-coded status indicators

**Props**:
```typescript
interface DepositStatusCardProps {
  depositStatus: DepositStatus | null;
  loading?: boolean;
  poolId: number;
  poolName: string;
  onClaimSuccess?: (transactionId: string) => void;
  onClaimError?: (error: string) => void;
}
```

### 3. UserBalanceCard.tsx
**Purpose**: Displays user's current USDC balance with refresh functionality.

**Features**:
- Displays user's current USDC balance
- Shows available balance for deposits
- Refresh button for manual balance updates
- Loading states and error handling
- Balance status indicators (empty, low, moderate, good)
- Color-coded status messages

**Props**:
```typescript
interface UserBalanceCardProps {
  userAddress?: string;
  onBalanceUpdate?: (balance: number) => void;
}
```

### 4. DepositInterface.tsx
**Purpose**: Main orchestrator component that combines all deposit components with real-time polling.

**Features**:
- Combines all three deposit components
- Real-time status polling using usePolling hook
- Global notification system
- Automatic status updates
- Error handling and retry logic
- Responsive grid layout

**Props**:
```typescript
interface DepositInterfaceProps {
  poolId: number;
  poolName: string;
  minDeposit?: number;
  maxDeposit?: number;
}
```

## Usage Examples

### Basic Integration
```tsx
import DepositInterface from './components/DepositInterface';

function PoolDetailsPage() {
  const pool = {
    id: 1,
    name: "Spring 2024 Small Business Pool",
    config: {
      minDepositAmount: '100',
      maxDepositAmount: '100000'
    }
  };

  return (
    <div>
      <h1>{pool.name}</h1>
      <DepositInterface
        poolId={pool.id}
        poolName={pool.name}
        minDeposit={parseFloat(pool.config.minDepositAmount)}
        maxDeposit={parseFloat(pool.config.maxDepositAmount)}
      />
    </div>
  );
}
```

### Individual Component Usage
```tsx
import DepositSection from './components/DepositSection';
import DepositStatusCard from './components/DepositStatusCard';
import UserBalanceCard from './components/UserBalanceCard';

function CustomDepositPage() {
  const [userBalance, setUserBalance] = useState(0);
  const [depositStatus, setDepositStatus] = useState(null);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <UserBalanceCard
          userAddress="0x123..."
          onBalanceUpdate={setUserBalance}
        />
      </Grid>
      
      <Grid item xs={12} md={8}>
        <DepositStatusCard
          depositStatus={depositStatus}
          poolId={1}
          poolName="Test Pool"
        />
      </Grid>
      
      <Grid item xs={12}>
        <DepositSection
          poolId={1}
          poolName="Test Pool"
          userBalance={userBalance}
          minDeposit={100}
          maxDeposit={100000}
        />
      </Grid>
    </Grid>
  );
}
```

## Real-time Polling Integration

The components use the `usePolling` hook for real-time updates:

```tsx
import { usePolling } from '../hooks/usePolling';

// In DepositInterface.tsx
const { 
  data: depositStatus, 
  loading: depositLoading,
  error: depositError,
  refetch: refetchDepositStatus
} = usePolling<DepositStatus>(
  userAddress && poolId ? `/api/deposits/status/${poolId}/${userAddress}` : '',
  {
    interval: 5000,
    enabled: !!userAddress && !!poolId,
    requiresAuth: true,
    onDataChange: (prev, current) => {
      // Handle status changes
      if (prev?.claimable === 0 && current?.claimable > 0) {
        // Show notification when deposit becomes claimable
      }
    }
  }
);
```

## API Endpoints

The components integrate with these backend endpoints:

- `POST /api/deposits/request` - Submit deposit request
- `POST /api/deposits/claim` - Claim shares from fulfilled deposits
- `GET /api/deposits/status/:poolId/:userAddress` - Get deposit status (polling)

## Styling

All components use Material-UI with consistent styling:
- Border radius: 1.25em for cards, 0.75em for inner elements
- Color scheme: #FFFFFE (white), #29262a (dark text), #725aa2 (primary)
- Box shadows: 0 0.125em 0.25em rgba(0, 0, 0, 0.08)
- Responsive design with Grid system

## Error Handling

Components include comprehensive error handling:
- Network errors with retry options
- Validation errors with clear messages
- Loading states during API calls
- User-friendly error messages
- Automatic error recovery

## Notifications

The interface includes a global notification system:
- Success notifications for completed actions
- Error notifications for failed operations
- Info notifications for status updates
- Auto-dismissing with manual close option

## Dependencies

Required dependencies:
- React 18+
- Material-UI (MUI) 5+
- Axios for API calls
- usePolling hook (custom)
- useAccount hook (custom)

## Testing

Components are designed to be easily testable:
- Props-based configuration
- Clear separation of concerns
- Mock data support
- Error boundary compatibility 