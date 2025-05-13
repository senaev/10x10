import { Cube } from '../js/Cube';
import { SideCubeAddress, SideCubesMask } from '../js/Cubes';

export function getSideCubeByAddress(cubesMask: SideCubesMask, address: SideCubeAddress): Cube | null {
    return cubesMask[address.field][address.x][address.y];
}
