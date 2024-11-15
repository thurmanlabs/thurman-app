import React, { ReactNode } from "react";
import { Container } from "@mui/material";
import { styles } from "../styles/styles";
interface BackgroundContainerProps {
  children: ReactNode;
}

export default function BackgroundContainer({ children }: BackgroundContainerProps) {
  return (
    <Container
      maxWidth="xl"
      sx={styles.containers.backgroundContainer}
    >
      {children}
    </Container>
  );
}
