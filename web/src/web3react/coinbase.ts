import { initializeConnector } from "@web3-react/core";
import { CoinbaseWallet } from "@web3-react/coinbase-wallet";
import { Connection, ConnectionType, onConnectionError } from "./connections";

export const buildCoinbaseWalletConnector = (): Connection => {
    const [web3CoinbaseWallet, web3CoinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
        (actions) => new CoinbaseWallet({
            actions,
            options: {
                url: "",
                appName: "Thurman",
                reloadOnDisconnect: true,
            },
            onError: onConnectionError
        })
    );

    const coinbaseWalletConnection: Connection = {
        connector: web3CoinbaseWallet,
        hooks: web3CoinbaseWalletHooks,
        type: ConnectionType.COINBASE_WALLET,
    }

    return coinbaseWalletConnection
}