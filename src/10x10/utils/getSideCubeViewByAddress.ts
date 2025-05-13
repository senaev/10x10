import { CubeView } from '../components/CubeView';
import { SideCubeAddress, SideCubesMask } from '../js/Cubes';

export function getSideCubeViewByAddress(cubesMask: SideCubesMask, address: SideCubeAddress): CubeView {
    return cubesMask[address.field][address.x][address.y];
}
