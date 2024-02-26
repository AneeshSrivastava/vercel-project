import {
    S3Client,
    ListBucketsCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command
} from '@aws-sdk/client-s3';

const initializeS3Client = async () => {
    try{
        return  new S3Client({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
    });
    }catch(error){
        console.log("Cannot initialize client")
        return Promise.reject("Cannot initialize client")
    }
}

const client = initializeS3Client()

const listBuckets = async (): Promise<string[]> => {
    try {
        let bucketNames: string[] = [];
        const command = new ListBucketsCommand({});
        const awsClient  = await client
        const { Buckets } = await awsClient.send(command);
        if (Buckets) {
            for (const bucket of Buckets) {
                bucketNames.push(bucket.Name!);
            }
            return bucketNames;
        }
        return Promise.reject('Failed to fetch bucket');
    } catch (error) {
        console.error('Error listing buckets:', error);
        return Promise.reject('Error in fetching buckets');
    }
};
const uploadToS3 = async (
    bucketName: string,
    pathToLocalFile: string,
    pathInS3: string
) => {
    try {
        const s3UploadCommand = new PutObjectCommand({
            Body: pathToLocalFile,
            Key: pathInS3,
            Bucket: bucketName
        });
        const awsClient  = await client
        await awsClient.send(s3UploadCommand);
    } catch (error) {
        console.error('Cannot upload file: ', error);
        return Promise.reject("Failed to upload")
    }
};

const deleteObjectInS3 = async (bucketName: string, pathInS3: string) => {
    try {
        const cleanupInput = {
            Bucket: bucketName,
            Key: pathInS3
        };
        const deleteFile = new DeleteObjectCommand(cleanupInput);
        const awsClient  = await client
        await awsClient.send(deleteFile);
        console.log(`Deleted file: ${deleteFile.input.Key}`);
    } catch (error) {
        console.error('Failed to delete: ', error);
    }
};
const listFilesInS3Bucket = async (bucketName: string) => {
    try {
        let filePaths: string[] = [];
        const inputCommandObj = {
            Bucket: bucketName
        };
        const listObjCommand = new ListObjectsV2Command(inputCommandObj);
        const awsClient  = await client
        const files = await awsClient.send(listObjCommand);
        if (!files.Contents) {
            console.log('No files found for cleanup');
            return [];
        }
        for (const fileObj of files.Contents) {
            if (!fileObj.Key) {
                continue;
            }
            filePaths.push(fileObj.Key);
        }
        return filePaths;
    } catch (error) {
        console.error('Failed to list files: ', error);
        return Promise.reject('Failed to list files in S3 bucket');
    }
};

export { listBuckets, deleteObjectInS3, uploadToS3, listFilesInS3Bucket };
