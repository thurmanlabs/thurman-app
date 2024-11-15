import React from "react";
import { Container } from "@mui/material";
import { styles } from "../styles/styles";

interface ContentContainerProps {
    children: React.ReactNode;
}

export default function ContentContainer({ children }: ContentContainerProps) {
    return (
        <Container
            maxWidth="lg"
            sx={styles.containers.content}
        >
            {children}
        </Container>
    );
}