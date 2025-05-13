import { CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { SideCubesMask } from '../js/Cubes';
import { MovingCube } from '../js/MovingCube';

import { getCubeAddressInSideFieldInOrderFromMain } from './getCubeAddressInSideFieldInOrderFromMain';
import { getSideCubeByAddress } from './getSideCubeByAddress';

/**
* Массовая анимация для кубиков, вспомогательная
* функция для удобства анимации сразу нескольких кубиков
*/
export function animateMovingCubesFromMainFieldToSide({
    cube,
    toSideActions,
    beyondTheSide,
    cubesMask,
}: {
    cube: CubeView;
    toSideActions: MovingCube[];
    beyondTheSide: CubeView[];
    cubesMask: SideCubesMask;
}) {
    const { field } = cube;

    if (field === 'main') {
        throw new Error('animateMovingCubesFromMainFieldToSide: cube.field === "main"');
    }

    // получаем линию кубика
    const line = getCubeAddressInSideFieldInOrderFromMain({
        x: cube.x,
        y: cube.y,
        field,
    });

    // массив, в который по порядку попадут все кубики,
    // которые войдут в эту же линию того же поля во время хода
    // 0 - который входит первым
    const allCubesToSideInThisLine = [];

    // для идентификации линии
    let prop: 'x' | 'y' = 'y';
    if (cube.field === 'top' || cube.field === 'bottom') {
        prop = 'x';
    }
    // позиция кубика среди тех, которые во время данного хода
    // попадают в данную линию данного поля 0-дальний от mainField
    let posInSide;
    for (const key in toSideActions) {
        const c = toSideActions[key].cube;
        if (c.field === cube.field && c[prop] === cube[prop]) {
            if (c === cube) {
                posInSide = allCubesToSideInThisLine.length;
            }
            allCubesToSideInThisLine.push(c);
        }
    }

    // массив кубиков, которые удалились за пределами этой линии во время хода
    // 0 - первый удалённый(самый дальний)
    const removeBS = [];
    for (const key in beyondTheSide) {
        const c = beyondTheSide[key];
        if (c.field === cube.field && c[prop] === cube[prop]) {
            removeBS.push(c);
        }
    }

    // вычисляем, какие кубики будем двигать при вставке в линию
    const pos = BOARD_SIZE - allCubesToSideInThisLine.length + posInSide! - 1;
    let c1: CubeView;
    let c2: CubeView;
    let cr: CubeView;

    // смысл этих условий в том, что если кубик, который надо анимировать,
    // еще присутствует в линии, мы берем этот кубик оттуда, если же
    // он уже удален из линии, но его нужно анимировать, мы берем его
    // из массива удаленных кубиков этой линии
    if (pos - 2 > -1) {
        cr = getSideCubeByAddress(cubesMask, line[pos - 2])!;
    } else {
        cr = removeBS[removeBS.length + (pos - 2)];
    }

    if (pos > -1) {
        c1 = getSideCubeByAddress(cubesMask, line[pos])!;
    } else {
        c1 = removeBS[removeBS.length + pos];
    }

    if (pos - 1 > -1) {
        c2 = getSideCubeByAddress(cubesMask, line[pos - 1])!;
    } else {
        c2 = removeBS[removeBS.length + (pos - 1)];
    }

    // третий кубик пропадает
    cr.animate({
        action: 'disappearanceInSide',
        steps: 1,
    });

    // остальные два сдвигаются ближе к линии
    c2.animate({
        action: 'further',
        steps: 1,
    });
    c1.animate({
        action: 'further',
        steps: 1,
    });
}
