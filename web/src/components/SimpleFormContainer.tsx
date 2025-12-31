import React, { ReactNode } from "react";
import { Paper, Grid } from "@mui/material";
import { styles } from "../styles/styles";

interface SimpleFormContainerProps {
    children: ReactNode;
}

export default function SimpleFormContainer({ children }: SimpleFormContainerProps) {
    return (
        <Grid container justifyContent="center" sx={{ py: 4 }}>
            <Grid item xs={12} sm={10} md={6} lg={5} xl={4}>
                <Paper sx={{
                    ...styles.containers.authCard,
                    backgroundColor: "#FFFFFE",
                }}>
                    {children}
                </Paper>
            </Grid>
        </Grid>
    );
}