import { createClient, commandOptions } from 'redis';
import { downloadS3Folder } from './helpers/aws';

const subscriber = createClient();
subscriber.connect();

async function main() {
    while (1) {
        const response = await subscriber.brPop(
            commandOptions({ isolated: true }),
            'build-queue',
            0
        );
        console.log(`Received ${response?.key} input as: ${response?.element}`);
        const isFolderDownloaded = await downloadS3Folder(
            `output/${response?.element}`
        );
        if (isFolderDownloaded) {
            console.log('Download Completed.');
        } else {
            console.error('Could not download the folder');
        }
    }
}

main();
