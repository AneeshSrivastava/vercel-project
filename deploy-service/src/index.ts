import { createClient, commandOptions } from 'redis';
import { downloadS3Folder } from './helpers/aws';
import { buildProject } from './helpers/build';

const subscriber = createClient();
subscriber.connect();

async function main() {
    while (1) {
        const response = await subscriber.brPop(
            commandOptions({ isolated: true }),
            'build-queue',
            0
        );
        const id = response?.element!;

        console.log(`Received ${response?.key} input as: ${id}`);
        const isFolderDownloaded = await downloadS3Folder(`output/${id}`);
        if (isFolderDownloaded) {
            console.log('Download Completed.');
        } else {
            console.error('Could not download the folder');
        }
        console.log('Starting to build the project...');
        await buildProject(id);
    }
}

main();
