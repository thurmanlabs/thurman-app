import React from "react";
import { ConnectionType } from "../web3react/connections";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import SimpleFormContainer from "../components/SimpleFormContainer";
import AuthOptions from "../components/AuthOptions";
import metaMask from "../assets/images/metamask.png";
import coinbaseWallet from "../assets/images/coinbase-wallet.png";
import walletConnect from "../assets/images/wallet-connect.png";

const options = [
    { avatar: metaMask, name: "MetaMask", connectionType: ConnectionType.INJECTED },
    { avatar: coinbaseWallet, name: "Coinbase Wallet", connectionType: ConnectionType.COINBASE_WALLET },
    { avatar: walletConnect, name: "WalletConnect", connectionType: ConnectionType.WALLET_CONNECT },
    { avatar: "", name: "Log in with email", connectionType: ConnectionType.INJECTED },
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