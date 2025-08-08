import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  FormHelperText,
  Divider
} from "@mui/material";
import { AccountBalance as AccountBalanceIcon } from "@mui/icons-material";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import axios from "axios";
import { styles } from "../styles/styles";

interface DepositSectionProps {
  poolId: number;
  poolName: string;
  minDeposit?: number;
  maxDeposit?: number;
  userBalance?: number;
  onDepositSuccess?: (transactionId: string) => void;
  onDepositError?: (error: string) => void;
}

interface DepositFormData {
  amount: string;
}

interface ValidationState {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export default function DepositSection({
  poolId,
  poolName,
  minDeposit = 0.01,
  maxDeposit = 1000000,
  userBalance = 0,
  onDepositSuccess,
  onDepositError
}: DepositSectionProps): JSX.Element {
  const [validation, setValidation] = React.useState<ValidationState>({ isValid: false });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [notification, setNotification] = React.useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<DepositFormData>({
    defaultValues: {
      amount: ""
    },
    mode: "onChange"
  });

  const watchedAmount = watch("amount");

  // Real-time validation
  React.useEffect(() => {
    if (!watchedAmount) {
      setValidation({ isValid: false });
      return;
    }

    const numAmount = parseFloat(watchedAmount);
    
    // Check if it's a valid number
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidation({ 
        isValid: false, 
        error: "Please enter a valid amount greater than 0" 
      });
      return;
    }

    // Check minimum deposit
    if (numAmount < minDeposit) {
      setValidation({ 
        isValid: false, 
        error: `Minimum deposit amount is $${minDeposit.toLocaleString()}` 
      });
      return;
    }

    // Check maximum deposit
    if (numAmount > maxDeposit) {
      setValidation({ 
        isValid: false, 
        error: `Maximum deposit amount is $${maxDeposit.toLocaleString()}` 
      });
      return;
    }

    // Check user balance
    if (numAmount > userBalance) {
      setValidation({ 
        isValid: false, 
        error: `Insufficient balance. You have $${userBalance.toLocaleString()} USDC available` 
      });
      return;
    }

    // Check for warnings (high percentage of balance)
    if (userBalance > 0 && (numAmount / userBalance) > 0.9) {
      setValidation({ 
        isValid: true, 
        warning: "This deposit uses over 90% of your available balance" 
      });
    } else {
      setValidation({ isValid: true });
    }
  }, [watchedAmount, minDeposit, maxDeposit, userBalance]);

  // Handle deposit request
  const onSubmit: SubmitHandler<DepositFormData> = async (data): Promise<void> => {
    if (!validation.isValid || isSubmitting) return;

    setIsSubmitting(true);
    setNotification(null);

    try {
      const response = await axios.post("/api/deposits/request", {
        poolId,
        amount: parseFloat(data.amount).toString()
      });

      if (response.data.success) {
        const { approvalTransactionId, depositTransactionId } = response.data.data;
        
        setNotification({
          type: "success",
          message: `Deposit request submitted successfully! Transaction IDs: ${approvalTransactionId}, ${depositTransactionId}`
        });

        // Clear form
        setValue("amount", "");
        
        // Call success callback
        if (onDepositSuccess) {
          onDepositSuccess(depositTransactionId);
        }
      } else {
        throw new Error(response.data.error || "Deposit request failed");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Failed to submit deposit request";
      
      setNotification({
        type: "error",
        message: errorMessage
      });

      if (onDepositError) {
        onDepositError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear notification
  const clearNotification = (): void => {
    setNotification(null);
  };

  return (
    <Card sx={{ 
      borderRadius: "1.25em",
      backgroundColor: "#FFFFFE",
      boxShadow: "0 0.125em 0.25em rgba(0, 0, 0, 0.08)"
    }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#29262a" }}>
          Make a Deposit
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
          Deposit USDC into {poolName} to earn interest on your investment.
        </Typography>

        {/* Notification Alert */}
        {notification && (
          <Alert 
            severity={notification.type} 
            onClose={clearNotification}
            sx={{ mb: 3 }}
          >
            {notification.message}
          </Alert>
        )}

        {/* Amount Input */}
        <Box sx={{ mb: 3 }}>
          <Controller
            name="amount"
            control={control}
            rules={{
              required: "Amount is required",
              pattern: {
                value: /^\d*\.?\d{0,2}$/,
                message: "Please enter a valid amount (up to 2 decimal places)"
              },
              validate: (value) => {
                const numValue = parseFloat(value);
                if (isNaN(numValue) || numValue <= 0) {
                  return "Please enter a valid amount greater than 0";
                }
                if (numValue < minDeposit) {
                  return `Minimum deposit amount is $${minDeposit.toLocaleString()}`;
                }
                if (numValue > maxDeposit) {
                  return `Maximum deposit amount is $${maxDeposit.toLocaleString()}`;
                }
                if (numValue > userBalance) {
                  return `Insufficient balance. You have $${userBalance.toLocaleString()} USDC available`;
                }
                return true;
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Deposit Amount (USDC)"
                placeholder="0.00"
                variant="outlined"
                size="small"
                error={!!validation.error || !!errors.amount}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceIcon sx={{ color: "#725aa2" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: "1.25em",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: (validation.error || errors.amount) ? "#d32f2f" : "#D3D3D3"
                    }
                  }
                }}
                InputLabelProps={{
                  sx: { color: "#666" }
                }}
              />
            )}
          />
          
          {/* Validation Messages */}
          {(validation.error || errors.amount) && (
            <FormHelperText error sx={{ mt: 1, ml: 1 }}>
              {validation.error || errors.amount?.message}
            </FormHelperText>
          )}
          
          {validation.warning && (
            <FormHelperText sx={{ mt: 1, ml: 1, color: "#ed6c02" }}>
              {validation.warning}
            </FormHelperText>
          )}
        </Box>

        {/* Deposit Limits Info */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: "#f8f9fa", borderRadius: "0.75em" }}>
          <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
            Deposit Limits:
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Min: ${minDeposit.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Max: ${maxDeposit.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Your Balance: ${userBalance.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Submit Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={!validation.isValid || isSubmitting}
          sx={{
            ...styles.button.primary,
            height: "48px",
            fontSize: "1rem",
            fontWeight: 600
          }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: "#FFFFFE" }} />
              Processing Deposit...
            </>
          ) : (
            "Request Deposit"
          )}
        </Button>

        {/* Processing Info */}
        {isSubmitting && (
          <Typography variant="body2" sx={{ mt: 2, textAlign: "center", color: "#666" }}>
            This may take 5-10 minutes to process. You'll receive a notification when complete.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
} 