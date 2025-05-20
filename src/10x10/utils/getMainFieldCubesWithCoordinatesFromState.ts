import { MainFieldCubesState, MainFieldCubeWithCoordinates } from '../js/TenOnTen';

export function getMainFieldCubesWithCoordinatesFromState(mainFieldCubesState: MainFieldCubesState): MainFieldCubeWithCoordinates[] {
    const mainFieldCubes: MainFieldCubeWithCoordinates[] = [];
    mainFieldCubesState.forEach((row, x) => {
        row.forEach((cube, y) => {
            if (cube === null) {
                return;
            }

            mainFieldCubes.push({
                color: cube.color,
                direction: cube.direction,
                toMineOrder: cube.toMineOrder,
                x,
                y,
            });
        });
    });

    return mainFieldCubes;
}
