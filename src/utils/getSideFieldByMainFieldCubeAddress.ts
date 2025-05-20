import { BOARD_SIZE } from '../10x10/const/BOARD_SIZE';
import { CubeCoordinates, SideCubeAddress } from '../10x10/js/CubesViews';

export function getSideFieldByMainFieldCubeAddress({
    x, y,
}: CubeCoordinates): SideCubeAddress {
    if (x < 0) {
        return {
            field: 'left',
            x: x + BOARD_SIZE,
            y,
        };
    }

    if (x >= BOARD_SIZE) {
        return {
            field: 'right',
            x: x - BOARD_SIZE,
            y,
        };
    }

    if (y < 0) {
        return {
            field: 'top',
            x,
            y: y + BOARD_SIZE,
        };
    }

    if (y >= BOARD_SIZE) {
        return {
            field: 'bottom',
            x,
            y: y - BOARD_SIZE,
        };
    }

    throw new Error('Invalid cube coordinates');
}
