import { Web3ReactHooks } from "@web3-react/core";
import { Connector } from "@web3-react/types";
// import { buildCoinbaseWalletConnector } from "./coinbase";
import { buildInjectedConnector } from "./injected";
// import { buildWalletConnectConnector } from "./walletconnect";


export enum ConnectionType {
    // COINBASE_WALLET = "COINBASE_WALLET",
    INJECTED = "INJECTED",
    // WALLET_CONNECT = "WALLET_CONNECT"
};

export type Connection = {
    connector: Connector;
    hooks: Web3ReactHooks;
    type: ConnectionType;
};

// const getIsBraveWallet = (): boolean => {
//     return window.ethereum?.isBraveWallet ?? false;
// }

// export const getIsMetaMaskInstalled = (): boolean => {
//     return (window.ethereum?.isMetaMask ?? false) && !getIsBraveWallet();
// }

// export const getIsCoinbaseWalletInstalled = (): boolean => {
//     return (window.ethereum?.isCoinbaseWallet ?? false);
// }

export const onConnectionError = (err: Error) => {
    console.debug(`web3-react error: ${err}`);
}

export const PRIORITIZED_CONNECTORS: { [key in ConnectionType]: Connection } = {
    [ConnectionType.INJECTED]: buildInjectedConnector(),
    // [ConnectionType.COINBASE_WALLET]: buildCoinbaseWalletConnector(),
    // [ConnectionType.WALLET_CONNECT]: buildWalletConnectConnector()
}

export const getConnection = (c: Connector | ConnectionType): Connection => {
    if (c instanceof Connector) {
        const connection = Object.values(PRIORITIZED_CONNECTORS)
            .find((connection) => connection.connector === c)

        if (!connection) {
            throw Error('Unsupported Connector');
        }

        return connection
    } else {
        const getPrioritizedConnector: { [key: string]: Connection } = {
            [ConnectionType.INJECTED]: PRIORITIZED_CONNECTORS[ConnectionType.INJECTED],
            // [ConnectionType.COINBASE_WALLET]: PRIORITIZED_CONNECTORS[ConnectionType.COINBASE_WALLET],
            // [ConnectionType.WALLET_CONNECT]: PRIORITIZED_CONNECTORS[ConnectionType.WALLET_CONNECT]
        };

        return getPrioritizedConnector[c];
    }
}

export const tryActivateConnector = async (connector: Connector): Promise<ConnectionType | undefined> => {
    await connector.activate()
    const connectionType = getConnection(connector).type
    return connectionType
}

export const tryDeactivateConnector = async (connector: Connector): Promise<null | undefined> => {
    connector.deactivate?.()
    connector.resetState()
    return null
}