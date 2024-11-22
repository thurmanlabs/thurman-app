import dotenv from "dotenv";
import { Secret } from "jsonwebtoken";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

interface IConfig {
    port: string | undefined;
    apiPrefix: string | undefined;
    circleApiKey: string;
    circleEntitySecret: string;
    circleEntitySecretCiphertext: string;
    jwtSecretKey: Secret;
    walletSetId: string | undefined;
};

const config: IConfig = {
    port: process.env.PORT,
    apiPrefix: process.env.API_PREFIX,
    circleApiKey: process.env.CIRCLE_TEST_API_KEY || "key",
    circleEntitySecret: process.env.CIRCLE_TEST_ENTITY_SECRET || "secret",
    circleEntitySecretCiphertext: process.env.CIRCLE_TEST_ENTITY_SECRET_CIPHERTEXT || "ciphertext",
    jwtSecretKey: process.env.JWT_SECRET_KEY || "jwtSecretKey",
    walletSetId: process.env.WALLET_SET_ID || "id",
};

export { config };