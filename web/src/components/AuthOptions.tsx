import React from "react";
import { Grid, Typography, Avatar } from "@mui/material";
import AuthOption, { AuthOptionProps } from "./AuthOption";
import { styles } from "../styles/styles" ;
import thurman from "../assets/images/thurman.png";

interface AuthOptionsProps {
    authType: string;
    options: AuthOptionProps[];
}

export default function AuthOptions({ authType, options }: AuthOptionsProps) {
    return (
        <Grid 
            container 
            direction="column"
            spacing={2}
        >
            <Grid
                container
                direction="column"
                alignItems="center"
                sx={styles.containers.authOptionHeader}
            >
                <Avatar
                    src={thurman}
                    sx={styles.avatar.large}
                />
                <Typography variant="h6" sx={{ marginTop: "0.5em" }}>
                    {authType}
                </Typography>
            </Grid>
            {options.map((option, index) => (
                <Grid key={index} container>
                    <AuthOption
                        avatar={option.avatar}
                        name={option.name}
                        connectionType={option.connectionType}
                    />
                </Grid>
            ))}
        </Grid>
    );
}
