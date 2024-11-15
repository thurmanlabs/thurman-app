import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { styles } from "../styles/styles";

interface NavigateButtonProps {
    variant: "text" | "outlined" | "contained";
    to: string;
    children: React.ReactNode;
    sx?: typeof styles.button.primary | typeof styles.button.text;
}

export default function NavigateButton({ variant, to, children, sx }: NavigateButtonProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(to);
    };

    return (
        <Button
            variant={variant}
            onClick={handleClick}
            sx={sx}
        >
            {children}
        </Button>
    );
}
