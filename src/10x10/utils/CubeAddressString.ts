import { CubeAddress } from '../js/CubesViews';

export type CubeAddressString = `${CubeAddress['field']},${CubeAddress['x']},${CubeAddress['y']}`;

export function getCubeAddressString(cubeAddress: CubeAddress): CubeAddressString {
    return `${cubeAddress.field},${cubeAddress.x},${cubeAddress.y}`;
}

export function parseCubeAddressString(cubeAddressString: CubeAddressString): CubeAddress {
    const [
        field,
        x,
        y,
    ] = cubeAddressString.split(',');

    return {
        field: field as CubeAddress['field'],
        x: parseInt(x),
        y: parseInt(y),
    };
}
