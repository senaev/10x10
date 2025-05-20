import { separateArray } from 'senaev-utils/src/utils/Array/separateArray/separateArray';

import {
    SideCubeAddress,
} from '../js/CubesViews';

import { getCubeAddressInSideFieldInOrderFromMain } from './getCubeAddressInSideFieldInOrderFromMain';
import { StartCubesParameters } from './getStartCubesParameters';

/**
 * Находим все кубики от этого до ближнего к майн в линии относительно этого
 */
export function getStartCubesByStartCubesParameters({
    startCubesParameters,
}: {
    startCubesParameters: StartCubesParameters;
}): {
        startCubes: SideCubeAddress[];
        otherCubes: SideCubeAddress[];
    } {
    const {
        line,
        count,
    } = startCubesParameters;

    const sideCubeAddresses = getCubeAddressInSideFieldInOrderFromMain(line);

    const [
        startCubes,
        otherCubes,
    ] = separateArray(sideCubeAddresses, (_, i) => i < count);

    return {
        startCubes,
        otherCubes,
    };
}
