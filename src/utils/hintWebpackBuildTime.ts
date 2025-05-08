import { Seconds } from 'senaev-utils/src/types/Time/Seconds';

declare const WEBPACK_BUILD_TIME: number;
export function hintWebpackBuildTime(): void {
    const millisecondsSinceBuild = Date.now() - WEBPACK_BUILD_TIME;
    const secondsSinceBuild: Seconds = millisecondsSinceBuild / 1000;

    const buildTimeString = secondsSinceBuild.toFixed(1);

    // eslint-disable-next-line no-console
    console.log(`Built ${buildTimeString} sec ago`);
}
