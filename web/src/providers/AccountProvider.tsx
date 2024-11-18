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
import { AccountContext } from "../context/AccountContext";

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

    useEffect(() => {
        if (connector && isActive) {
            setConnectionType(getConnection(connector).type);
        }
    }, [connector, isActive]);

    // const signup = async () => {};

    const login = async (c: ConnectionType) => {
        let walletConnectionType = await tryActivateConnector(getConnection(c).connector);
        if (!walletConnectionType) {
            return;
        }
        setConnectionType(walletConnectionType);
    }

    const logout = async (c: ConnectionType) => {
        let walletConnectionType = await tryDeactivateConnector(getConnection(c).connector);
        if (walletConnectionType === undefined) {
            return;
        }
        setConnectionType(walletConnectionType);
    }

    return (
        <AccountContext.Provider value={{
            connectionType: connectionType,
            userAccount: account || null,
            userChainId: chainId,
            signup: () => Promise.resolve(),
            login: login,
            logout: logout
        }}>
            {children}
    </AccountContext.Provider>
    );
}