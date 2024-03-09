import fs from 'fs';
import path from 'path';
import { uploadToS3 } from './aws';
import { config } from '../config';

const copyDistToS3 = async (id: string) => {
    const pathToDir = path.join(path.dirname(__dirname), 'output', id, 'dist');
    const filePaths = getAllPaths(pathToDir);
    const uploadResult = await uploadFilesToS3(filePaths, id);
    if (uploadResult) {
        console.log('Upload successful!');
        return;
    }
    console.error('Failed to upload dist to S3');
};

const uploadFilesToS3 = async (filePaths: string[], id: string) => {
    const BATCH_SIZE = 2;
    const batches = [];
    const folderPath = path.join(path.dirname(__dirname), `output/${id}/dist`); // Use path.dirname to avoid "helpers" dir

    for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
        const batch = filePaths.slice(
            i,
            Math.min(i + BATCH_SIZE, filePaths.length)
        );
        batches.push(batch);
    }
    const batchesStatus: boolean[] = [];
    for (const batch of batches) {
        console.log(`Uploading a batch of ${batch.length} files.`);
        const promises = batch.map(async (file) => {
            try {
                const uploadPathInS3 = path.join(
                    'dist',
                    id,
                    file.slice(folderPath.length)
                );
                console.log('Uploading file in S3 to:', uploadPathInS3);
                return uploadToS3(config.S3BucketName, file, uploadPathInS3);
            } catch (error) {
                console.error('Error uploading file:', file, error);
                return Promise.reject('Failed to upload to S3');
            }
        });
        const results = await Promise.allSettled(promises);
        batchesStatus.push(
            results.every((result) => result.status === 'fulfilled')
        );
        await sleep(5000);
    }
    return batchesStatus.every((batch) => batch === true);
};
export const getAllPaths = (folderPath: string) => {
    let response: string[] = [];
    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllPaths(fullFilePath));
        } else {
            response.push(fullFilePath);
        }
    });
    return response;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export { copyDistToS3 };
