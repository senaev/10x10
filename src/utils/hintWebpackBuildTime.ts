import { Seconds } from 'senaev-utils/src/types/Time/Seconds';

declare const WEBPACK_BUILD_TIME: number;
export function hintWebpackBuildTime(): void {
    const secondsSinceBuild: Seconds = (Date.now() - WEBPACK_BUILD_TIME) / 1000;

    // eslint-disable-next-line no-console
    console.log(`Built ${secondsSinceBuild} sec ago`);

}
