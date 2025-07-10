import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { config } from "../config";

const circleContractClient = initiateSmartContractPlatformClient({
    apiKey: config.circleApiKey,
    entitySecret: config.circleEntitySecret,
});

export default circleContractClient; 