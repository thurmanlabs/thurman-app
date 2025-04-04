import { createContext } from "react";
import { IEmailAuthFormInput } from "../components/EmailAuthForm";
import { ConnectionType } from "../web3react/connections";

export interface User {
    id: number | null;
    email: string | null;
    account: string | undefined;
    walletName: string | null;
    custodyType: string | null;
    chainId: number | undefined;
    accountType: string | null;
}

interface IAccountContext {
    connectionType: ConnectionType | null;
    user: User | null;
    userAccount: string | null;
    userChainId: number | undefined;
    emailSignup: (data: IEmailAuthFormInput) => Promise<void>;
    emailLogin: (data: IEmailAuthFormInput) => Promise<void>;
    emailLogout: () => Promise<void>;
    web3ReactLogin: (c: ConnectionType) => Promise<void>;
    web3ReactLogout: (c: ConnectionType) => Promise<void>;
}

export const AccountContext = createContext<IAccountContext>({} as IAccountContext);