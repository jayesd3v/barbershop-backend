import App from '@/server/app';
import initializeSequelize from '@/models/initializeSequelize';
import { env } from '@/utils';

const { NODE_ENV } = env;

if (NODE_ENV === 'dev') {
    initializeSequelize({
        alter: true,
        force: false,
        logging: false,
    });
}

const app = new App();
app.start();
