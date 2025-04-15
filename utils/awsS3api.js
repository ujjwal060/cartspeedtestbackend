import { S3 } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { loadConfig } from '../config/loadConfig.js';

const config = await loadConfig();

const secretsManagerClient = new SecretsManagerClient({ region:config.AWS_REGION });

const getAwsCredentials = async () => {
  try {
    const command = new GetSecretValueCommand({ SecretId:config.SECRET_NAME });
    const data = await secretsManagerClient.send(command);

    if (data.SecretString) {
      const secret = JSON.parse(data.SecretString);
      return {
        accessKeyId: secret.AWS_ACCESS_KEY_ID,
        secretAccessKey: secret.AWS_SECRET_ACCESS_KEY,
      };
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const getS3Client = async () => {
  try {
    const credentials = await getAwsCredentials();
    return new S3({
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      region: config.AWS_REGION,
    });
  } catch (error) {
    console.error('Error initializing S3:', error.message);
    throw error;
  }
};

const uploadToS3 = async (req, res, next) => {
  const s3 = await getS3Client();

  try {
    if (!req.files || !req.files.image) {
      return next();
    }
    const file = req.files.image;

    const files = Array.isArray(file) ? file : [file];
    const fileLocations = [];

    for (const file of files) {
      const params = {
        Bucket: config.AWS_S3_BUCKET_NAME,
        Key: `${Date.now()}-${file.name}`,
        Body: file.data,
        ContentType: file.mimetype,
      };

      await s3.putObject(params);
      const fileUrl = `https://${config.AWS_S3_BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${params.Key}`;
      fileLocations.push(fileUrl);
    }

    req.fileLocations = fileLocations;
    next();
  } catch (uploadError) {
    return res.status(500).send(uploadError.message);
  }
};

export {
    uploadToS3
}