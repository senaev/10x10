import { Cube } from '../js/Cube';
import { CubeAddress, CubesMask } from '../js/Cubes';

export function getCubeByAddress(cubesMask: CubesMask, address: CubeAddress): Cube | null {
    return cubesMask[address.field][address.x][address.y];
}
