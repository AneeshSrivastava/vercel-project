import fs from 'fs';
import path from 'path';

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
