import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CubeAddress } from '../js/Cubes';

/**
 * получаем массив координат кубиков линии в порядке от дальнего (относительно main field)
 * до ближайшего
 */
export function getCubeAddressInSideFieldInOrderFromMain(address: CubeAddress): CubeAddress[] {
    let staticProp: 'x' | 'y';
    let dynamicProp: 'x' | 'y';
    let line: CubeAddress[] = [];
    let coords: CubeAddress;

    line = [];
    if (address.field === 'top' || address.field === 'bottom') {
        staticProp = 'x';
        dynamicProp = 'y';
    } else {
        staticProp = 'y';
        dynamicProp = 'x';
    }
    if (address.field === 'top' || address.field === 'left') {
        for (let key = 0; key < BOARD_SIZE; key++) {
            coords = {
                field: address.field,
                x: 0,
                y: 0,
            };
            coords[staticProp] = address[staticProp];
            coords[dynamicProp] = key;
            line.push(coords);
        }
    } else {
        for (let key = BOARD_SIZE - 1; key >= 0; key--) {
            coords = {
                field: address.field,
                x: 0,
                y: 0,
            };
            coords[staticProp] = address[staticProp];
            coords[dynamicProp] = key;
            line.push(coords);
        }
    }
    return line;
}
