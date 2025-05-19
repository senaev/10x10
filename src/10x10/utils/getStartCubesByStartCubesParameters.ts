import { CubeView } from '../components/CubeView';
import {
    SideCubeAddress,
    SideCubesMask,
} from '../js/Cubes';

import { getCubeAddressInSideFieldInOrderFromMain } from './getCubeAddressInSideFieldInOrderFromMain';
import { getSideCubeViewByAddress } from './getSideCubeViewByAddress';
import { getStartCubesParameters } from './getStartCubesParameters';

/**
 * Находим все кубики от этого до ближнего к майн в линии относительно этого
 */
export function getStartCubesByStartCubesParameters({
    mainCubes,
    sideCubesMask,
    sideCubeAddress: initialCubeAddress,
}: {
    mainCubes: Set<CubeView>;
    sideCubeAddress: SideCubeAddress;
    sideCubesMask: SideCubesMask;
}): CubeView[] | undefined {
    const startCubesParameters = getStartCubesParameters({
        mainCubes,
        sideCubeAddress: initialCubeAddress,
    });

    if (!startCubesParameters) {
        return undefined;
    }

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
