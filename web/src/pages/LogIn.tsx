import React from "react";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import SimpleFormContainer from "../components/SimpleFormContainer";
import AuthOptions from "../components/AuthOptions";
import metaMask from "../assets/images/metamask.png";
import coinbaseWallet from "../assets/images/coinbase-wallet.png";
import walletConnect from "../assets/images/wallet-connect.png";

const options = [
    { avatar: metaMask, name: "MetaMask", onClick: () => { } },
    { avatar: coinbaseWallet, name: "Coinbase Wallet", onClick: () => { } },
    { avatar: walletConnect, name: "WalletConnect", onClick: () => { } },
    { avatar: "", name: "Sign up with email", onClick: () => { } },
];

export default function LogIn() {
    return (
        <BackgroundContainer>  
            <ContentContainer>
                <SimpleFormContainer>
                    <AuthOptions authType="Log in" options={options} />
                </SimpleFormContainer>
            </ContentContainer>
        </BackgroundContainer>
    );
}