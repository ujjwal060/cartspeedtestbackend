import dotenv from 'dotenv';
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { logger } from "../utils/logger.js";

dotenv.config();

const ENV =process.env.NODE_ENV || "production";
const REGION = process.env.AWS_REGION || "us-east-1";
const SECRET_NAME ="cart";
const secretsManager = new SecretsManagerClient({ region: REGION });

const loadConfig = async () => {
  if (ENV === 'production') {
    try {
      const response = await secretsManager.send(
        new GetSecretValueCommand({ SecretId: SECRET_NAME })
      );

      if (response.SecretString) {
        try {
          const secrets = JSON.parse(response.SecretString);
          return {
            PORT: secrets.PORT || 9090,
            DB_URI: secrets.MONGODB_URI,
            ACCESS_TOKEN_SECRET: secrets.ACCESS_TOKEN_SECRET,
            REFRESH_TOKEN_SECRET: secrets.REFRESH_TOKEN_SECRET,
            AWS_REGION: secrets.AWS_REGION || 'us-east-1',
            SECRET_NAME:'cart',
            EMAIL_USER:secrets.EMAIL_USER,
            EMAIL_PASS:secrets.EMAIL_PASS,
            AWS_ACCESS_KEY_ID:secrets.AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY:secrets.AWS_SECRET_ACCESS_KEY,
            S3_BUCKET:'cart-bucket-dfghj'
          };
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          throw new Error("Failed to parse secret value as JSON");
        }
      }
      throw new Error("No secret string found in the response");
    } catch (error) {
      console.error("AWS Secrets Fetch Error:", error);
      throw new Error("Failed to load secrets from AWS Secrets Manager");
    }
  }

  logger.info('Running in development mode. Using .env for configuration.');

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 9090,
    DB_URI: process.env.MONGODB_URI,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    SECRET_NAME: process.env.SECRET_NAME || 'cart',
    EMAIL_USER:process.env.EMAIL_USER,
    EMAIL_PASS:process.env.EMAIL_PASS,
    S3_BUCKET:process.env.S3_BUCKET,
    AWS_ACCESS_KEY_ID:process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY:process.env.AWS_SECRET_ACCESS_KEY
  }
};

export { loadConfig };
