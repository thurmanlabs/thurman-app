import { ConnectionType } from "../web3react/connections";

export type AuthOptionType = "web3" | "email";

export interface BaseAuthOptionProps {
    avatar: string;
    name: string;
    type: AuthOptionType;
}

export interface Web3AuthOptionProps extends BaseAuthOptionProps {
    type: "web3";
    connectionType: ConnectionType;
}

export interface EmailAuthOptionProps extends BaseAuthOptionProps {
    type: "email";
    next: () => void;
}

export type AuthOptionProps = Web3AuthOptionProps | EmailAuthOptionProps;