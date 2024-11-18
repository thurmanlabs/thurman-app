import { useContext } from "react";
import { AccountContext } from "../context/AccountContext";

export default function useAccount() {
    const context = useContext(AccountContext);

    if (!context) {
        throw new Error("`useAccount` should be used within a `AccountProvider`");
    }
    return context;
}