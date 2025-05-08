import {
    addYears,
    differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds,
    differenceInYears,
} from 'date-fns';

declare const WEBPACK_BUILD_TIME: number;
export function hintWebpackBuildTime(): void {
    const buildDate = new Date(WEBPACK_BUILD_TIME);
    const now = new Date();

    const years = differenceInYears(now, buildDate);
    const dateAfterYears = addYears(buildDate, years);
    const days = differenceInDays(now, dateAfterYears);
    const hours = differenceInHours(now, buildDate) % 24;
    const minutes = differenceInMinutes(now, buildDate) % 60;
    const seconds = differenceInSeconds(now, buildDate) % 60;

    const timeParts = [];
    if (years > 0) {
        timeParts.push(`${years}y`);
    }
    if (days > 0) {
        timeParts.push(`${days}d`);
    }
    if (hours > 0) {
        timeParts.push(`${hours}h`);
    }
    if (minutes > 0) {
        timeParts.push(`${minutes}m`);
    }
    if (seconds > 0 || timeParts.length === 0) {
        timeParts.push(`${seconds}s`);
    }

    // eslint-disable-next-line no-console
    console.log(`Built ${timeParts.join(' ')} ago`);
}
