import React, { ReactNode } from "react";
import { Paper, Grid } from "@mui/material";
import { styles } from "../styles/styles";

interface SimpleFormContainerProps {
    children: ReactNode;
}

export default function SimpleFormContainer({ children }: SimpleFormContainerProps) {
    return (
        <Grid container justifyContent="center" sx={styles.containers.form}>
            <Grid item xs={12} md={6}>
                <Paper sx={styles.containers.form}>
                    {children}
                </Paper>
            </Grid>
        </Grid>
    );
}