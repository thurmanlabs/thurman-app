import React, { useState, useEffect } from "react";
import { Web3ReactProvider } from "@web3-react/core";
import { useWeb3React } from "@web3-react/core";
import { 
    tryActivateConnector,
    tryDeactivateConnector,
    getConnection, 
    ConnectionType,
    PRIORITIZED_CONNECTORS
} from "../web3react/connections";
import { AccountContext, User } from "../context/AccountContext";
import { IEmailAuthFormInput } from "../components/EmailAuthForm";
import axios from "axios";

export default function AccountProvider({ children }: { children: React.ReactNode }) {
    return (
        <Web3ReactProvider
            connectors={Object.values(PRIORITIZED_CONNECTORS).map((connector) => [connector.connector, connector.hooks])}
        >
            <AccountProviderInner>
                {children}
            </AccountProviderInner>
        </Web3ReactProvider>
    );
}

function AccountProviderInner({ children }: { children: React.ReactNode }) {
    let { account, chainId, connector, isActive } = useWeb3React();
    const [connectionType, setConnectionType] = useState<ConnectionType | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (connector && isActive) {
            setConnectionType(getConnection(connector).type);
            if (account) {
                setUser({
                    id: null,
                    email: null,
                    account: account,
                    walletName: null,
                    custodyType: "EOA",
                    chainId: chainId,
                    accountType: null
                });
            } else {
                setUser(null);
            }
        }
    }, [connector, isActive, account, chainId]);

    const emailSignup = async (data: IEmailAuthFormInput) => {
        try {
            const response = await axios.post("/signup", {
                email: data.emailValue,
                password: data.passwordValue,
                accountType: "SCA",
                blockchains: ["MATIC", "MATIC-AMOY"]
            });
            setUser(response.data.user);
        } catch (error) {
            console.error("Signup error:", error);
            throw error;
        }
    };

    const emailLogin = async (data: IEmailAuthFormInput) => {
        try {
            const response = await axios.post("/login", {
                email: data.emailValue,
                password: data.passwordValue
            });
            setUser(response.data.user);
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const emailLogout = async () => {
        try {
            await axios.post("/logout");
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const web3ReactLogin = async (c: ConnectionType) => {
        try {
            let walletConnectionType = await tryActivateConnector(getConnection(c).connector);
            if (!walletConnectionType) {
                return;
        }
            setConnectionType(walletConnectionType);
        } catch (err) {
            console.error(err);
        }
    }

    const web3ReactLogout = async (c: ConnectionType) => {
        try {
            let walletConnectionType = await tryDeactivateConnector(getConnection(c).connector);
            if (walletConnectionType === undefined) {
                return;
            }
            setConnectionType(walletConnectionType);
            setUser(null);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <AccountContext.Provider value={{
            connectionType: connectionType,
            user: user,
            userAccount: account || null,
            userChainId: chainId,
            emailSignup: emailSignup,
            emailLogin: emailLogin,
            emailLogout: emailLogout,
            web3ReactLogin: web3ReactLogin,
            web3ReactLogout: web3ReactLogout
        }}>
            {children}
    </AccountContext.Provider>
    );
}