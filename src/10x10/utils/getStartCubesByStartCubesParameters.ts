import { CubeView } from '../components/CubeView';
import {
    SideCubesMask,
} from '../js/Cubes';

import { getCubeAddressInSideFieldInOrderFromMain } from './getCubeAddressInSideFieldInOrderFromMain';
import { getSideCubeViewByAddress } from './getSideCubeViewByAddress';
import { StartCubesParameters } from './getStartCubesParameters';

/**
 * Находим все кубики от этого до ближнего к майн в линии относительно этого
 */
export function getStartCubesByStartCubesParameters({
    startCubesParameters,
    sideCubesMask,
}: {
    startCubesParameters: StartCubesParameters;
    sideCubesMask: SideCubesMask;
}): CubeView[] {
    const {
        line,
        count,
    } = startCubesParameters;

    const sideCubeAddresses = getCubeAddressInSideFieldInOrderFromMain(line);

    const cubes: CubeView[] = [];
    for (let key = 0; key < count; key++) {
        const sideCubeAddress = sideCubeAddresses[key];
        const cube = getSideCubeViewByAddress(sideCubesMask, sideCubeAddress);
        cubes.push(cube);
    }

    return cubes;
}
