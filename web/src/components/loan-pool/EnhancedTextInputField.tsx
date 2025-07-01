import React, { useState } from "react";
import {
    Grid,
    IconButton,
    InputAdornment,
    TextField,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Controller } from "react-hook-form";
import { styles } from "../../styles/styles";
import { EnhancedTextInputFieldProps } from "../../types/loan-pool";

type PasswordAdornmentProps = {
    handleClickShowPassword: () => void;
    showPassword: boolean;
}

function PasswordAdornment({ handleClickShowPassword, showPassword }: PasswordAdornmentProps) {
    return (
        <InputAdornment position="end">
            <IconButton
                onClick={handleClickShowPassword}
            >
                {showPassword ? (
                    <Visibility />
                ) : (
                    <VisibilityOff />
                )}
            </IconButton>
        </InputAdornment>
    );
}

export default function EnhancedTextInputField({ 
    control, 
    name, 
    rules, 
    label, 
    type,
    helperText,
    multiline = false,
    rows = 4,
    startAdornment,
    endAdornment
}: EnhancedTextInputFieldProps) {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const handleClickShowPassword = () => setShowPassword(showPassword => !showPassword);

    // Build InputProps with adornments
    const buildInputProps = () => {
        const inputProps: any = {};
        
        // Add start adornment if provided
        if (startAdornment) {
            inputProps.startAdornment = (
                <InputAdornment position="start">
                    {startAdornment}
                </InputAdornment>
            );
        }
        
        // Add end adornment - either custom or password toggle
        if (endAdornment) {
            inputProps.endAdornment = (
                <InputAdornment position="end">
                    {endAdornment}
                </InputAdornment>
            );
        } else if (type === "password") {
            inputProps.endAdornment = (
                <PasswordAdornment
                    handleClickShowPassword={handleClickShowPassword}
                    showPassword={showPassword}
                />
            );
        }
        
        return inputProps;
    };

    return (
        <Grid item xs={12}>
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                    <>
                        <TextField
                            id={`${name}-field`}
                            label={label}
                            variant="outlined"
                            size="small"
                            type={showPassword ? "text" : type}
                            sx={styles.forms.textField}
                            fullWidth
                            multiline={multiline}
                            rows={multiline ? rows : undefined}
                            inputProps={{ style: { color: "darkGray" } }}
                            InputProps={buildInputProps()}
                            InputLabelProps={{ style: { color: "darkGray" } }}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message || helperText}
                            {...field}
                        />
                    </>
                )}
            />
        </Grid>
    );
} 