import { CubeView } from '../components/CubeView';
import { SideCubeAddress, SideCubesMask } from '../js/CubesViews';

export function getSideCubeViewByAddress(sideCubesMask: SideCubesMask, address: SideCubeAddress): CubeView {
    return sideCubesMask[address.field][address.x][address.y];
}
