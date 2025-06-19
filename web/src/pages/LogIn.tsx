import React from "react";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import SimpleFormContainer from "../components/SimpleFormContainer";
import AuthOptions from "../components/AuthOptions";
import { AuthOptionProps } from "../types/auth";

const options: AuthOptionProps[] = [
    { avatar: "", name: "Log in with email", type: "email", next: () => {}},
];

export default function LogIn() {
    return (
        <BackgroundContainer>  
            <ContentContainer>
                <SimpleFormContainer>
                    <AuthOptions authType="Login" options={options} />
                </SimpleFormContainer>
            </ContentContainer>
        </BackgroundContainer>
    );
}