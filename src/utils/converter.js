import env from '@/utils/env';
import moment from 'moment-timezone';

const { TIMEZONE = 'Z' } = env;

export const getDateTime = (dateString, timeString) => {
    return moment.tz(`${dateString} ${timeString}`, TIMEZONE);
};

export const getDate = (dateString) => getDateTime(dateString, '00:00:00');

export const getBusinessDate = (date) => {
    return date.format('YYYY-MM-DD');
};

export const getBusinessTime = (date) => {
    return date.format('hh:mm');
};

export const getBusinessDateTime = (date) => {
    return date.format('YYYY-MM-DD hh:mm:ss');
};

export default {
    getDate,
    getBusinessDate,
    getBusinessTime,
    getBusinessDateTime,
};
