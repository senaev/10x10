import { SideCubeAddress } from '../../js/Cubes';
import { reverseDirection } from '../reverseDirection';

export function getOppositeFieldCubeAddress(sideCubeAddress: SideCubeAddress): SideCubeAddress {
    const field = reverseDirection(sideCubeAddress.field);

    const isVertical = field === 'top' || field === 'bottom';
    const isTopOrLeft = field === 'top' || field === 'left';

    return {
        field,
        x: isVertical
            ? sideCubeAddress.x
            : isTopOrLeft
                ? 9
                : 0,
        y: isVertical
            ? isTopOrLeft
                ? 9
                : 0
            : sideCubeAddress.y,
    };
}
