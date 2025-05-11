import nodemailer from 'nodemailer';
import env from '@/utils/env';

const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_EMAIL,
    SMTP_PASSWORD,
} = env;

export const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
    },
});

export const sendMail = async (to, subject, text) => {
    await transporter.sendMail({
        from: SMTP_EMAIL,
        to,
        subject,
        text,
    });
};

export default {
    transporter,
    sendMail,
};
