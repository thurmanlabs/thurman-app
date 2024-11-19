import React from "react";
import { ConnectionType } from "../web3react/connections";
import BackgroundContainer from "../components/BackgroundContainer";
import SimpleFormContainer from "../components/SimpleFormContainer";
import AuthOptions from "../components/AuthOptions";
import coinbaseWallet from "../assets/images/coinbase-wallet.png";
import walletConnect from "../assets/images/wallet-connect.png";
import metaMask from "../assets/images/metamask.png";

const options = [
    { avatar: metaMask, name: "MetaMask", connectionType: ConnectionType.INJECTED },
    { avatar: coinbaseWallet, name: "Coinbase Wallet", connectionType: ConnectionType.COINBASE_WALLET },
    { avatar: walletConnect, name: "WalletConnect", connectionType: ConnectionType.WALLET_CONNECT },
    { avatar: "", name: "Sign up with email", connectionType: ConnectionType.INJECTED },
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