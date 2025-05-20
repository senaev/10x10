import { BOARD_SIZE } from '../10x10/const/BOARD_SIZE';
import { Direction } from '../10x10/const/DIRECTIONS';
import { CubeCoordinates } from '../10x10/js/CubesViews';

export function getSideFieldByMainFieldCubeAddress({
    x, y,
}: CubeCoordinates): {
        field: Direction;
        coordinates: CubeCoordinates;
    } {
    if (x < 0) {
        return {
            field: 'left',
            coordinates: {
                x: x + BOARD_SIZE,
                y,
            },
        };
    }

    if (x >= BOARD_SIZE) {
        return {
            field: 'right',
            coordinates: {
                x: x - BOARD_SIZE,
                y,
            },
        };
    }

    if (y < 0) {
        return {
            field: 'top',
            coordinates: {
                x,
                y: y + BOARD_SIZE,
            },
        };
    }

    if (y >= BOARD_SIZE) {
        return {
            field: 'bottom',
            coordinates: {
                x,
                y: y - BOARD_SIZE,
            },
        };
    }

    throw new Error('Invalid cube coordinates');
}
