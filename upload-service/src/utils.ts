import {
    uploadToS3,
    listFilesInS3Bucket,
    deleteObjectInS3
} from './helpers/aws';
import { config } from './config';

export function generate() {
    let ans = '';
    const subset = '123456789qwertyuiopasdfghjklzxcvbnm';
    for (let i = 0; i < config.MaxRandomIdLen; i++) {
        ans += subset[Math.floor(Math.random() * subset.length)];
    }
    return ans;
}

const uploadFilesToS3 = async (filePaths: string[]) => {
    try{
        filePaths.forEach(async (file) => {
            uploadToS3(config.S3BucketName, file, file.slice(__dirname.length + 1));
            console.log('Uploaded file:', file.slice(__dirname.length + 1));
        });
    }catch(error){
        return Promise.reject("Failed to upload to S3")
    }
};

const cleanupBucket = async (bucketName: string): Promise<string> => {
    try {
        const filesInBucket = await listFilesInS3Bucket(bucketName);
        if (filesInBucket.length === 0) {
            return 'No files found for cleanup';
        }
        filesInBucket.forEach(async (filePath) => {
            deleteObjectInS3(bucketName, filePath);
        });
        return `Cleanup complete for ${filesInBucket.length} files in ${bucketName}`;
    } catch (error) {
        return `Failed to cleanup bucket '${bucketName}'`;
    }
};
export { uploadFilesToS3, cleanupBucket };
