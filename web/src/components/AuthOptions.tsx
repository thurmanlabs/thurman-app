import React from "react";
import { Grid, Typography, Avatar, IconButton } from "@mui/material";
import { AuthOptionProps } from "../types/auth";
import useMultiStep from "../hooks/useMultiStep";
import Web3AuthOption from "./Web3AuthOption";
import EmailAuthOption from "./EmailAuthOption";
import { styles } from "../styles/styles" ;
import thurman from "../assets/images/thurman.png";
import EmailAuthForm from "./EmailAuthForm";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface AuthOptionsProps {
    authType: string;
    options: AuthOptionProps[];
}

function StepOne({ options, onNext }: { options: AuthOptionProps[], onNext: () => void }) {
    return (
        <>
            {options.map((option, index) => (
                <Grid key={index} container>
                    {option.type === "web3" ? (
                        <Web3AuthOption {...option} />
                    ) : (
                        <EmailAuthOption {...option} next={onNext} />
                    )}
                </Grid>
            ))}
        </>
    );
}

function StepTwo() {
    return <EmailAuthForm />;
}

const authSteps = [
    StepOne,
    StepTwo
];

export default function AuthOptions({ authType, options }: AuthOptionsProps) {
    const { currentStepIndex, step, steps, next, back, goTo } = useMultiStep(authSteps);
    
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
                {currentStepIndex > 0 && (
                    <Grid container sx={{ width: '100%' }}>
                        <IconButton 
                            onClick={back}
                            sx={{
                                backgroundColor: "#f5f5f5",
                                '&:hover': {
                                    backgroundColor: "#e0e0e0"
                                }
                            }}
                        >
                            <ArrowBackIcon sx={{ fontSize: "0.8em" }} />
                        </IconButton>
                    </Grid>
                )}
                <Avatar
                    src={thurman}
                    sx={styles.avatar.large}
                />
                <Typography variant="h6" sx={{ marginTop: "0.5em" }}>
                    {authType}
                </Typography>
            </Grid>
            {step({ options, onNext: next })}
        </Grid>
    );
}
