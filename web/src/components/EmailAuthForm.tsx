import React from "react";
import {
    useForm,
    SubmitHandler
} from "react-hook-form";
import { Button, Grid } from "@mui/material";
import TextInputField from "./TextInputField";
import { styles } from "../styles/styles";

type IFormInput = {
    emailValue: string;
    passwordValue: string;
};

export default function EmailAuthForm() {
    const {
        watch,
        formState: { isValid, errors },
        control,
        handleSubmit
    } = useForm({
        mode: "onChange",
        defaultValues: {
            emailValue: "",
            passwordValue: ""
        }
    });
    return (
        <Grid container justifyContent="center" alignItems="center" direction="column">
            <Grid item xs={12} sm={6} md={4} sx={{ width: "60%", maxWidth: "25em" }}>
                <TextInputField
                    control={control}
                    name="emailValue"
                    rules={{
                        required: true,
                        pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                    }}
                    label="Email"
                    type="email"
                />
                <TextInputField
                    control={control}
                    name="passwordValue"
                    rules={{
                        required: true,
                        pattern: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/,
                    }}
                    label="Password"
                    type="password"                    
                />
                <Button
                    type="submit"
                    variant="contained"
                    disabled={!isValid}
                    sx={styles.button.primary}
                    fullWidth
                >
                    Sign up
                </Button>
            </Grid>
        </Grid>
    );
}