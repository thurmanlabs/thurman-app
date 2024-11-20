import React from "react";
import { EmailAuthOptionProps } from "../types/auth";
import AuthOption from "./AuthOption";

export default function EmailAuthOption({ avatar, name, next }: EmailAuthOptionProps) {
    return (
        <AuthOption 
            avatar={avatar} 
            name={name} 
            onClick={next} 
        />
    );
}