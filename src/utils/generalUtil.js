import blake2b from 'blake2b';
import { env } from '@/utils';

const { SLOT_SECRET } = env;

export const getHashTime = (start, end) => {
    const hasher = blake2b(16, Buffer.from(SLOT_SECRET));
    return hasher.update(Buffer.from(String(start + end))).digest('hex');
};

export const compareTimeHash = (hashedTime, start, end) => {
    const hash = getHashTime(start, end);
    return hashedTime === hash;
};

export default {
    getHashTime,
    compareTimeHash,
};
