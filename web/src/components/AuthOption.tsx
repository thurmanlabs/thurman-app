import React from "react";
import { Avatar, Button, Grid } from "@mui/material";
import { styles } from "../styles/styles";

export interface AuthOptionProps {
    avatar: string;
    name: string;
    onClick?: () => void;
    children?: React.ReactNode;
}

export default function AuthOption({ avatar, name, onClick, children }: AuthOptionProps) {
    return (
        <Grid container justifyContent="center">
            <Grid item xs={10} justifyContent="center">
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Avatar src={avatar} sx={styles.avatar.small} />}
                    onClick={onClick}
                    sx={styles.button.authOption}
                >
                    {name}
                </Button>
                {children}
            </Grid>
        </Grid>
    );
}