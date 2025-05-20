import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';
import { callTimes } from 'senaev-utils/src/utils/Function/callTimes/callTimes';
import { Integer } from 'senaev-utils/src/utils/Number/Integer';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { forOwn } from 'senaev-utils/src/utils/Object/forOwn/forOwn';
import { getObjectEntries } from 'senaev-utils/src/utils/Object/getObjectEntries/getObjectEntries';
import { mapObjectValues } from 'senaev-utils/src/utils/Object/mapObjectValues/mapObjectValues';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { getSideFieldByMainFieldCubeAddress } from '../../utils/getSideFieldByMainFieldCubeAddress';
import { CubeAnimationName, CubeView } from '../components/CubeView';
import { ALL_SIDE_LINES } from '../const/ALL_SIDE_LINES';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { DIRECTION_STEPS } from '../const/DIRECTION_STEPS';
import { generateMoveSteps } from '../utils/generateMoveSteps';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getIncrementalIntegerForMainFieldOrder } from '../utils/getIncrementalIntegerForMainFieldOrder';
import { getMainFieldCubesWithCoordinatesFromState } from '../utils/getMainFieldCubesWithCoordinatesFromState';
import { getStartCubesByStartCubesParameters } from '../utils/getStartCubesByStartCubesParameters';
import { StartCubesParameters } from '../utils/getStartCubesParameters';
import { reverseDirection } from '../utils/reverseDirection';
import {
    parseSideCubesLineId,
} from '../utils/SideCubesLineIndicator/SideCubesLineIndicator';
import { stepsToAnimations } from '../utils/stepsToAnimations/stepsToAnimations';

import {
    SideCubeAddress,
} from './CubesViews';
import {
    CubeAddressString,
    getCubeAddressString,
    MovingCube,
    MovingCubeStepAction,
} from './MovingCube';
import {
    MainFieldCubesState,
    SideFieldCubeStateValue,
    SideFieldsCubesState,
} from './TenOnTen';

export type CubeAnimation = {
    action: CubeAnimationName | null;
    duration: PositiveInteger;
    delay: number;
};

export type ToSideParams = {
    time: UnsignedInteger;
    sideCubeAddress: SideCubeAddress;
};

export type ToSideAction = {
    toSideParams: ToSideParams;
    movingCube: MovingCube;
};

export type AnimationScript = Record<CubeAddressString, CubeAnimation[]>;
export type AnimationScriptWithViews = Map<CubeView, CubeAnimation[]>;

function createEmptyFields(): null[][] {
    return createArray(BOARD_SIZE).map(() => createArray(BOARD_SIZE, null));
}

/**
 * На вход дается текущий стейт и параметры хода
 * На выходе данные об изменениях стейта по кубикам и список анимаций для каждого кубика
 */
export function createMoveMap ({
    sideFieldsCubesState,
    startCubesParameters,
    mainFieldCubesState,
}: {
    startCubesParameters: StartCubesParameters;
    sideFieldsCubesState: SideFieldsCubesState;
    mainFieldCubesState: MainFieldCubesState;
}): {
        animationsScript: AnimationScript;
        sideFieldsCubesState: SideFieldsCubesState;
        mainFieldCubesState: MainFieldCubesState;
    } {
    // Собираем кубики, которые уже на главном поле
    const movingCubesInMainField: MovingCube[] = getMainFieldCubesWithCoordinatesFromState(mainFieldCubesState)
        .sort((a, b) => a.toMineOrder - b.toMineOrder)
        .map((cube) => {
            return {
                ...cube,
                initialAddress: getCubeAddressString({
                    x: cube.x,
                    y: cube.y,
                    field: 'main',
                }),
                stepActions: [],
            };
        });

    // Находим стартовые кубики
    const {
        startCubes,
        otherCubes: otherCubesInStartLine,
    } = getStartCubesByStartCubesParameters({
        startCubesParameters,
    });
    const startCubesLineId = startCubesParameters.line;
    const startCubesCount = startCubesParameters.count;

    // Стартовые кубики сразу добавляем на главное поле для расчетов движения
    const startMovingCubes: MovingCube[] = startCubes.map((cube, i) => {
        const color = sideFieldsCubesState[cube.field][cube.x][cube.y].color;

        const toMineOrder = getIncrementalIntegerForMainFieldOrder();

        const field = cube.field;
        const coordinates = {
            x: cube.x,
            y: cube.y,
        };
        const mainOffset = startCubesCount - i - 1;
        const secondaryOffset = BOARD_SIZE - startCubesCount + i;
        if (field === 'top') {
            coordinates.y = mainOffset;
        } else if (field === 'bottom') {
            coordinates.y = secondaryOffset;
        } else if (field === 'left') {
            coordinates.x = mainOffset;
        } else {
            coordinates.x = secondaryOffset;
        }

        return {
            initialAddress: getCubeAddressString(cube),
            x: coordinates.x,
            y: coordinates.y,
            color,
            direction: reverseDirection(cube.field),
            stepActions: [],
            toMineOrder,
        };
    });

    const movingCubes = [
        ...startMovingCubes,
        ...movingCubesInMainField,
    ];

    // Добавим шаги анимации для выплывающих из боковой линии кубиков в начало анимации
    callTimes(startCubesCount, () => {
        movingCubes.forEach((moving) => {
            const isOneOfStartCubes = startCubes
                .find((startCubeAddress) => {
                    if (!moving.direction) {
                        return false;
                    }

                    return moving.initialAddress === getCubeAddressString(startCubeAddress);
                });

            if (isOneOfStartCubes) {
                const { direction } = moving;

                assertNonEmptyString(direction);

                moving.stepActions.push(direction);
            } else {
                moving.stepActions.push(null);
            }
        });
    });

    // Генерируем шаги анимации для всех кубиков на главном поле
    // Заодно высчитываем вхождения кубиков в боковые линии, чтобы позже сгенерировать анимации для них
    const {
        sideLinesMovementSteps,
        stepsCount: mainAnimationStepsCount,
    } = generateMoveSteps(movingCubes);

    // Проходимся в цикле по всем кубикам, которые анимировались на главном поле и создаем для них анимации
    const animationsScript: AnimationScript = {};
    for (const moving of movingCubes) {
        const steps = moving.stepActions;

        const animations = stepsToAnimations(steps);
        animationsScript[moving.initialAddress] = animations;
    }

    const sideCubesActions: Record<CubeAddressString, MovingCubeStepAction[]> = {};
    // Создаем массив с действиями для кубиков, которые будут двигаться
    // в сторону главного поля из боковой линии вместе со стартовыми кубиками
    otherCubesInStartLine.forEach((cube) => {
        const cubeAddressString = getCubeAddressString(cube);

        const actions: MovingCubeStepAction[] = [];
        sideCubesActions[cubeAddressString] = actions;

        callTimes(startCubesCount, () => {
            actions.push(reverseDirection(cube.field));
        });
    });

    // Двигаем кубики, которые находятся в боковых линиях дальше вбок в те моменты,
    // когда кубики с главного поля уезжают в боковую линию
    const compoundAnimationStepsCount = startCubesCount + mainAnimationStepsCount;
    for (const [
        sideCubesLineId,
        toSideTimes,
    ] of sideLinesMovementSteps.entries()) {
        const sideCubeLineId = parseSideCubesLineId(sideCubesLineId);
        const cubesCountToAnimate = sideCubesLineId === startCubesLineId
            ? BOARD_SIZE - startCubesCount
            : BOARD_SIZE;

        const cubeAddressesToMove = getCubeAddressInSideFieldInOrderFromMain(sideCubesLineId)
            .reverse()
            .slice(0, cubesCountToAnimate);

        for (const cubeAddress of cubeAddressesToMove) {
            const cubeAddressString = getCubeAddressString(cubeAddress);
            let actions: MovingCubeStepAction[] = sideCubesActions[cubeAddressString];
            if (!actions) {
                actions = [];
                sideCubesActions[cubeAddressString] = actions;
            }

            const nullActions = createArray(compoundAnimationStepsCount - actions.length, null);
            actions.push(...nullActions);
            const action = sideCubeLineId.field;
            for (const stepId of toSideTimes) {
                actions[startCubesCount + stepId] = action;
            }
        }
    }

    // Создаем анимации для кубиков в боковых линиях
    for (const [
        cubeAddressString,
        actions,
    ] of getObjectEntries(sideCubesActions)) {
        const animations = stepsToAnimations(actions);
        animationsScript[cubeAddressString] = animations;
    }

    // Высчитываем новый стейт приложения
    const nextMainFieldCubesState: MainFieldCubesState = createEmptyFields();
    const nextSideFieldsCubesState = mapObjectValues(DIRECTION_STEPS, () => createEmptyFields() as (SideFieldCubeStateValue | null)[][]);
    movingCubes.forEach(({
        x,
        y,
        color,
        direction,
        toMineOrder,
    }) => {
        const cubeIsStillOnMainField = x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
        if (cubeIsStillOnMainField) {
            // Кубик остается на главном поле
            nextMainFieldCubesState[x][y] = {
                color,
                direction,
                toMineOrder,
            };
            return;
        }

        if (x === -1 && y === -1) {
            // Кубик взорван
            return;
        }

        const sideField = getSideFieldByMainFieldCubeAddress({
            x,
            y,
        });

        nextSideFieldsCubesState[sideField.field][sideField.x][sideField.y] = {
            color,
        };
    });

    forOwn(ALL_SIDE_LINES, (sideLines) => {
        sideLines.forEach((sideCubesLineId) => {
            // Сколько кубиков со стороны главного поля отрезать
            let shifts: Integer = 0;
            if (sideCubesLineId === startCubesLineId) {
                shifts += startCubesCount;
            }

            // Сдвиг боковой линии, плюс - от главного поля
            let pops: Integer = 0;
            const sideLineMovementSteps = sideLinesMovementSteps.get(sideCubesLineId);
            if (Array.isArray(sideLineMovementSteps)) {
                pops += sideLineMovementSteps.length;
            }

            const sideLineCubeAddresses = getCubeAddressInSideFieldInOrderFromMain(sideCubesLineId);
            const sideLineCubes: (SideFieldCubeStateValue | null)[] = sideLineCubeAddresses
                .map((cubeAddress) => sideFieldsCubesState[cubeAddress.field][cubeAddress.x][cubeAddress.y]);

            callTimes(shifts, () => {
                sideLineCubes.shift();
                sideLineCubes.push(null);
            });

            callTimes(pops, () => {
                sideLineCubes.pop();
                sideLineCubes.unshift(null);
            });

            sideLineCubeAddresses.forEach((cubeAddress, i) => {
                const cube = sideLineCubes[i];

                if (cube === null) {
                    return;
                }

                nextSideFieldsCubesState[cubeAddress.field][cubeAddress.x][cubeAddress.y] = cube;
            });
        });
    });

    return {
        animationsScript,
        sideFieldsCubesState: nextSideFieldsCubesState as SideFieldsCubesState,
        mainFieldCubesState: nextMainFieldCubesState,
    };
}
