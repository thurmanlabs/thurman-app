import React from "react";
import { AuthOptionProps } from "../types/auth";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import SimpleFormContainer from "../components/SimpleFormContainer";
import AuthOptions from "../components/AuthOptions";

const options: AuthOptionProps[] = [
    { avatar: "", name: "Sign up with email", type: "email", next: () => {}},
];

export default function SignUp() {
    return (
        <BackgroundContainer>
            <ContentContainer>
                <SimpleFormContainer>
                    <AuthOptions authType="Sign up" options={options} />
                </SimpleFormContainer>
            </ContentContainer>
        </BackgroundContainer>
    );
}