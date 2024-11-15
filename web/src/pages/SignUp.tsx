import React from "react";
import BackgroundContainer from "../components/BackgroundContainer";
import SimpleFormContainer from "../components/SimpleFormContainer";
import AuthOptions from "../components/AuthOptions";
import coinbaseWallet from "../assets/images/coinbase-wallet.png";
import walletConnect from "../assets/images/wallet-connect.png";
import metaMask from "../assets/images/metamask.png";

const options = [
    { avatar: metaMask, name: "MetaMask", onClick: () => {} },
    { avatar: coinbaseWallet, name: "Coinbase Wallet", onClick: () => {} },
    { avatar: walletConnect, name: "WalletConnect", onClick: () => {} },
    { avatar: "", name: "Sign up with email", onClick: () => {} },
];

export default function SignUp() {
    return (
        <BackgroundContainer>
            <SimpleFormContainer>
                <AuthOptions authType="Sign up" options={options} />
            </SimpleFormContainer>
        </BackgroundContainer>
    );
}