import { SideCubeAddress } from '../js/Cubes';

export function isTheSameAddress(a: SideCubeAddress, b: SideCubeAddress): boolean {
    if (a.field !== b.field) {
        return false;
    }

    if (a.x !== b.x) {
        return false;
    }

    if (a.y !== b.y) {
        return false;
    }

    return true;
}
