import React from "react";
import { Web3AuthOptionProps } from "../types/auth";
import AuthOption from "./AuthOption";
import useAccount from "../hooks/useAccount";
import { useNavigate } from "react-router-dom";

export default function Web3AuthOption({ avatar, name, connectionType }: Web3AuthOptionProps) {
    const { web3ReactLogin } = useAccount();
    const navigate = useNavigate();

    const handleLogin = async () => {
        await web3ReactLogin(connectionType);
        navigate("/");
    };

    return (
        <AuthOption 
            avatar={avatar} 
            name={name} 
            onClick={handleLogin}
        />
    );
}