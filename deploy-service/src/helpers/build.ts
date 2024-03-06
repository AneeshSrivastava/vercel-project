import { exec } from 'child_process';

import path from 'path';
import {} from 'path';

export const buildProject = (id: string): Promise<unknown> => {
    return new Promise((resolve) => {
        const child = exec(
            `cd ${path.join(path.dirname(__dirname), `output/${id}`)} && npm install && npm run build`
        );
        child.stdout?.on('data', function (data) {
            console.log('stdout: ' + data);
        });
        child.stderr?.on('data', function (data) {
            console.log('stderr: ' + data);
        });
        child.on('close', function (code) {
            console.log('Build completed.');
            resolve('');
        });
    });
};
