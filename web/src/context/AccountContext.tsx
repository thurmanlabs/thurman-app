import { createContext } from "react";
import { IEmailAuthFormInput } from "../components/EmailAuthForm";

export interface User {
    id: number;
    email: string;
    role: 'ADMIN' | 'USER';
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
    account: string;
    walletName: string | null;
    custodyType: string;
    chainId: number;
    accountType: string;
    wallet?: {
        id?: string;
        address: string;
        name?: string | null;
        custodyType?: string;
        accountType?: string;
        blockchains?: {
            chainId: string;
            name?: string;
        }[];
    };
}

interface IAccountContext {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    login: (data: IEmailAuthFormInput) => Promise<void>;
    signup: (data: IEmailAuthFormInput) => Promise<void>;
    logout: () => Promise<void>;
}

export const AccountContext = createContext<IAccountContext>({} as IAccountContext);