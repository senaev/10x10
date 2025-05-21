import { getObjectEntries } from 'senaev-utils/src/utils/Object/getObjectEntries/getObjectEntries';

import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CUBE_COLORS } from '../const/CUBE_COLORS';
import { FIELD_OFFSETS } from '../const/FIELD_OFFSETS';
import { MainFieldCubesState, SideFieldsCubesState } from '../js/TenOnTen';

export function repaintDebugPanel({
    mainFieldCubesState,
    sideFieldCubesState,
    element,
}: {
    mainFieldCubesState: MainFieldCubesState;
    sideFieldCubesState: SideFieldsCubesState;
    element: HTMLElement;
}) {
    element.innerHTML = '';
    getObjectEntries({
        ...sideFieldCubesState,
        main: mainFieldCubesState,
    }).forEach(([
        field,
        cubes,
    ]) => {
        cubes.forEach((row, x) => {
            row.forEach((cube, y) => {
                if (!cube) {
                    return;
                }

                const cubeElement = document.createElement('div');
                cubeElement.classList.add('debugPanelCube');
                cubeElement.style.backgroundColor = CUBE_COLORS[cube.color];

                const oneCubeSize = 100 / (BOARD_SIZE * 3);
                const position = {
                    left: FIELD_OFFSETS[field].x + x + BOARD_SIZE,
                    top: FIELD_OFFSETS[field].y + y + BOARD_SIZE,
                };

                cubeElement.style.left = `${position.left * oneCubeSize}%`;
                cubeElement.style.top = `${position.top * oneCubeSize}%`;

                element.appendChild(cubeElement);
            });
        });

    });
}
