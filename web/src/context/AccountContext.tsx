import { createContext } from "react";
import { IEmailAuthFormInput } from "../components/EmailAuthForm";

export interface User {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'ADMIN' | 'USER';
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
    wallet?: {
        id: string;
        address: string;
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