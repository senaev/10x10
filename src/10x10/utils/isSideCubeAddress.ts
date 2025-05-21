import { CubeAddress, SideCubeAddress } from '../js/CubesViews';

export function isSideCubeAddress(address: CubeAddress): address is SideCubeAddress {
    return address.field !== 'main';
}
