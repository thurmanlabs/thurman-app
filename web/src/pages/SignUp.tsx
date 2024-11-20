import React from "react";
import { ConnectionType } from "../web3react/connections";
import { AuthOptionProps } from "../types/auth";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import SimpleFormContainer from "../components/SimpleFormContainer";
import AuthOptions from "../components/AuthOptions";
import coinbaseWallet from "../assets/images/coinbase-wallet.png";
import walletConnect from "../assets/images/wallet-connect.png";
import metaMask from "../assets/images/metamask.png";

const options: AuthOptionProps[] = [
    { avatar: metaMask, name: "MetaMask", type: "web3", connectionType: ConnectionType.INJECTED },
    { avatar: coinbaseWallet, name: "Coinbase Wallet", type: "web3", connectionType: ConnectionType.COINBASE_WALLET },
    { avatar: walletConnect, name: "WalletConnect", type: "web3", connectionType: ConnectionType .WALLET_CONNECT },
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