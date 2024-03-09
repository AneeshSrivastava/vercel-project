import express from 'express';
import cors from 'cors';
import simpleGit from 'simple-git';
import { cleanupBucket, generate } from './utils';
import path from 'path';
import { getAllPaths } from './file';
import { uploadFilesToS3 } from './utils';
import { config } from './config';
import { createClient } from 'redis';

const publisher = createClient();
publisher.connect();

const subscriber = createClient();
subscriber.connect();

const app = express();
app.use(cors());

app.use(express.json());

app.post('/deploy', async (req, resp) => {
    try {
        const repoUrl = req.body.repoUrl;
        console.log(repoUrl);
        const id = generate();
        const repoPath = path.join(__dirname, `output/${id}`);
        await simpleGit().clone(repoUrl, repoPath);
        const files = getAllPaths(repoPath);
        await uploadFilesToS3(files);
        // Sleep for upload service to finish upload
        await sleep(2000);
        console.log(`Pushed '${id}' to redis`);
        publisher.hSet('status', id, 'uploaded');
        publisher.lPush('build-queue', id);
        resp.json({ status: 'success', id });
    } catch (error) {
        console.error('Failed to deploy the project');
        resp.json({
            status: 'failed',
            message: 'Failed while processing deployment'
        });
    }
});

app.delete('/cleanup', async (req, resp) => {
    try {
        const message = await cleanupBucket(config.S3BucketName);
        resp.json({ status: 'success', message });
    } catch (error) {
        console.error('Failed in cleanup: ', error);
        resp.json({
            status: 'failed',
            message: 'Failed while processing cleanup API endpoint'
        });
    }
});

app.get('/status', async (req, res) => {
    const id = req.query.id;
    const statusResponse = await subscriber.hGet('status', id as string);
    res.json({
        status: statusResponse
    });
});
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('Server Started!');
app.listen(3000);
