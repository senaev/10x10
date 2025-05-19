import { CubeAddress } from '../js/CubesViews';

export function isTheSameAddress(a: CubeAddress, b: CubeAddress): boolean {
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
