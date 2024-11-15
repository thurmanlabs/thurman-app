import React from "react";
import { Avatar, Button, Grid } from "@mui/material";
import { styles } from "../styles/styles";

export interface AuthOptionProps {
    avatar: string;
    name: string;
    onClick: () => void;
}

export default function AuthOption({ avatar, name, onClick }: AuthOptionProps) {
    return (
        <Grid container justifyContent="center">
            <Grid item xs={8} justifyContent="center">
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Avatar src={avatar} sx={styles.avatar.small} />}
                    onClick={onClick}
                    sx={styles.button.authOption}
                >
                    {name}
                </Button>
            </Grid>
        </Grid>
    );
}