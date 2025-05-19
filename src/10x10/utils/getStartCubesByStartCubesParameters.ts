import {
    SideCubeAddress,
    SideCubesMask,
} from '../js/Cubes';

import { getCubeAddressInSideFieldInOrderFromMain } from './getCubeAddressInSideFieldInOrderFromMain';
import { StartCubesParameters } from './getStartCubesParameters';

/**
 * Находим все кубики от этого до ближнего к майн в линии относительно этого
 */
export function getStartCubesByStartCubesParameters({
    startCubesParameters,
}: {
    startCubesParameters: StartCubesParameters;
    sideCubesMask: SideCubesMask;
}): SideCubeAddress[] {
    const {
        line,
        count,
    } = startCubesParameters;

    const sideCubeAddresses = getCubeAddressInSideFieldInOrderFromMain(line);

    const cubes: SideCubeAddress[] = [];
    for (let key = 0; key < count; key++) {
        const sideCubeAddress = sideCubeAddresses[key];
        cubes.push(sideCubeAddress);
    }

    return cubes;
}
