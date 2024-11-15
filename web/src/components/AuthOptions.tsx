import React from "react";
import { Grid } from "@mui/material";
import AuthOption, { AuthOptionProps } from "./AuthOption";
import { styles } from "../styles/styles" ;

interface AuthOptionsProps {
    options: AuthOptionProps[];
}

export default function AuthOptions({ options }: AuthOptionsProps) {
    return (
        <Grid 
            container 
            direction="column"
            spacing={2}
        >
            {options.map((option, index) => (
                <Grid key={index} container>
                    <AuthOption
                        avatar={option.avatar}
                        name={option.name}
                        onClick={option.onClick}
                    />
                </Grid>
            ))}
        </Grid>
    );
}
