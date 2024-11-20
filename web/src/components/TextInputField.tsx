import React, { useState } from "react";
import {
    Grid,
    IconButton,
    InputAdornment,
    TextField
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
    Control,
    Controller,
    RegisterOptions
} from "react-hook-form";
import { styles } from "../styles/styles";

export type TextInputFieldProps = {
    control: Control<any>;
    name: string;
    rules: RegisterOptions;
    label: string;
    type: string;
}

type PasswordAdornmentProps = {
    handleClickShowPassword: () => void;
    showPassword: boolean;
}

function PasswordAdornment({ handleClickShowPassword, showPassword }: PasswordAdornmentProps) {
    return (
        <InputAdornment position="end">
            <IconButton
                onClick={
                    handleClickShowPassword
                }
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

export default function TextInputField({ control, name, rules, label, type }: TextInputFieldProps) {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const handleClickShowPassword = () => setShowPassword(showPassword => !showPassword);


    return (
        <Grid item xs={12}>
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field }) => (
                    <TextField
                        id="outlined-basic"
                        label={label}
                        variant="outlined"
                        size="small"
                        type={showPassword ? "text" : type}
                        sx={styles.forms.textField}
                        fullWidth
                        inputProps={{ style: { color: "darkGray" } }}
                        InputProps={{
                            endAdornment:
                                <>
                                    {type === "password" && (
                                        <PasswordAdornment
                                            handleClickShowPassword={handleClickShowPassword}
                                            showPassword={showPassword}
                                        />
                                    )}
                                </>
                        }}
                        InputLabelProps={{ style: { color: "darkGray" } }}
                        {...field}
                    />
                )}
            />
        </Grid>
    )
}