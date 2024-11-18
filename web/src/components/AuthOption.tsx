import React from "react";
import { Avatar, Button, Grid } from "@mui/material";
import { styles } from "../styles/styles";
import useAccount from "../hooks/useAccount";
import { ConnectionType } from "../web3react/connections";
export interface AuthOptionProps {
    avatar: string;
    name: string;
    connectionType: ConnectionType;
}

export default function AuthOption({ avatar, name, connectionType }: AuthOptionProps) {
    const { login } = useAccount();

    return (
        <Grid container justifyContent="center">
            <Grid item xs={10} justifyContent="center">
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Avatar src={avatar} sx={styles.avatar.small} />}
                    onClick={() => login(connectionType)}
                    sx={styles.button.authOption}
                >
                    {name}
                </Button>
            </Grid>
        </Grid>
    );
}