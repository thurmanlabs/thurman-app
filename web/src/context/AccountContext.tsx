import { 
    createContext, 
    Dispatch, 
    SetStateAction 
} from "react";

import { ConnectionType } from "../web3react/connections";

interface IAccountContext {
    connectionType: ConnectionType | null;
    userAccount: string | null;
    userChainId: number | undefined;
    signup: () => Promise<void>;
    login: (c: ConnectionType) => Promise<void>;
    logout: (c: ConnectionType) => Promise<void>;
}

export const AccountContext = createContext<IAccountContext>({} as IAccountContext);