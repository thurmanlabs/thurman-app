import React from "react";
import { Web3AuthOptionProps } from "../types/auth";
import AuthOption from "./AuthOption";
import useAccount from "../hooks/useAccount";

export default function Web3AuthOption({ avatar, name, connectionType }: Web3AuthOptionProps) {
    const { login } = useAccount();

    return (
        <AuthOption 
            avatar={avatar} 
            name={name} 
            onClick={() => login(connectionType)} 
        />
    );
}