import { Cube } from '../js/Cube';
import { CubeAddress, CubesMask } from '../js/Cubes';

export function getCubeByAddress(mask: CubesMask, address: CubeAddress): Cube | null {
    return mask[address.field][address.x][address.y];
}
