export type AuthOptionType = "email";

export interface EmailAuthOptionProps {
    avatar: string;
    name: string;
    type: "email";
    next: () => void;
}

export type AuthOptionProps = EmailAuthOptionProps;