import {
    S3Client,
    GetObjectCommand,
    ListObjectsCommand
} from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
const client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

const listObjectsInS3ByPrefix = async (prefixPath: string) => {
    const listObjCommandInput = {
        Bucket: config.S3BucketName,
        Prefix: prefixPath
    };
    const listObjCommand = new ListObjectsCommand(listObjCommandInput);
    const listObjResponse = await client.send(listObjCommand);
    return listObjResponse.Contents;
};

const downloadS3Folder = async (pathToFolder: string) => {
    console.log('Downloading: ', pathToFolder);
    const objectsToDownload = await listObjectsInS3ByPrefix(pathToFolder);
    if (objectsToDownload) {
        const results = await Promise.allSettled(
            objectsToDownload.map(async (object) => {
                try {
                    if (!object.Key) throw new Error('Key not found');

                    const { Body } = await getS3ObjectByPrefix(object.Key);
                    if (!(Body instanceof Readable))
                        throw new Error('Body not readable');
                    // Create local Dir (if not exists)
                    const localOutputDir = path.join(
                        __dirname,
                        '../',
                        object.Key
                    );
                    const dirName = path.dirname(localOutputDir);
                    if (!fs.existsSync(dirName)) {
                        fs.mkdirSync(dirName, { recursive: true });
                    }
                    await pipeline(Body, fs.createWriteStream(localOutputDir));
                    return true;
                } catch (error) {
                    console.error('Error downloading', object.Key, error);
                    return false;
                }
            })
        );
        const allSuccessful = results.every(
            (result) => result.status === 'fulfilled' && result.value === true
        );
        return allSuccessful;
    } else {
        console.log('No Objects found for download.');
        return false;
    }
};

const getS3ObjectByPrefix = async (prefixPath: string) => {
    const getCommandInput = {
        Bucket: config.S3BucketName,
        Key: prefixPath
    };

    const getObjCommand = new GetObjectCommand(getCommandInput);
    const response = client.send(getObjCommand);
    return response;
};
export { downloadS3Folder };
