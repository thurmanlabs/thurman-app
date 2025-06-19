import { createContext } from "react";
import { IEmailAuthFormInput } from "../components/EmailAuthForm";

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
    user: User | null;
    emailSignup: (data: IEmailAuthFormInput) => Promise<void>;
    emailLogin: (data: IEmailAuthFormInput) => Promise<void>;
    emailLogout: () => Promise<void>;
}

export const AccountContext = createContext<IAccountContext>({} as IAccountContext);