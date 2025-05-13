import { CubeView } from '../components/CubeView';
import { SideCubeAddress, SideCubesMask } from '../js/Cubes';

export function getSideCubeByAddress(cubesMask: SideCubesMask, address: SideCubeAddress): CubeView | null {
    return cubesMask[address.field][address.x][address.y];
}
