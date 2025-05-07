import path from 'path';

import express from 'express';

import { PROJECT_ROOT_PATH } from '../const/PROJECT_ROOT_PATH';
import { FRONTEND_PORT } from '../const/URLS';

async function enableStaticFilesServing(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('👉 enableWebInterface');
    const app = express();

    app.use('/dist', express.static(path.join(PROJECT_ROOT_PATH, 'dist')));
    app.use('/', express.static(path.join(PROJECT_ROOT_PATH, 'public')));

    return new Promise((resolve) => {
        app.listen(FRONTEND_PORT, () => {
            // eslint-disable-next-line no-console
            console.log(`✅ enableWebInterface http://localhost:${FRONTEND_PORT}`);
            resolve();
        });
    });
}

enableStaticFilesServing();
