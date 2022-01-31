import moment from 'moment';

export function formatFromNow(timestamp: number) {
    return moment(timestamp).fromNow()
}