import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';
import { callTimes } from 'senaev-utils/src/utils/Function/callTimes/callTimes';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { CubeAnimationName, CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { generateMoveSteps } from '../utils/generateMoveSteps';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getSideCubeViewByAddress } from '../utils/getSideCubeViewByAddress';
import { getStartCubesByStartCubesParameters } from '../utils/getStartCubesByStartCubesParameters';
import { StartCubesParameters } from '../utils/getStartCubesParameters';
import { isTheSameAddress } from '../utils/isTheSameAddress';
import { prepareMovingCubes } from '../utils/prepareMovingCubes';
import {
    parseSideCubesLineId,
} from '../utils/SideCubesLineIndicator/SideCubesLineIndicator';
import { stepsToAnimations } from '../utils/stepsToAnimations/stepsToAnimations';

import { SideCubeAddress, SideCubesMask } from './Cubes';
import {
    ActionStep,
    MovingCube,
} from './MovingCube';
import { TenOnTen } from './TenOnTen';

export type CubeAnimation = {
    action: CubeAnimationName | null;
    duration: PositiveInteger;
    delay: number;
};

export type CubeToMove = {
    original: CubeView;
    moving: MovingCube;
};

export type CubesMove = {
    cubesToMove: CubeToMove[];
};

export type ToSideParams = {
    time: UnsignedInteger;
    sideCubeAddress: SideCubeAddress;
};

export type ToSideAction = {
    toSideParams: ToSideParams;
    movingCube: MovingCube;
};

export type AnimationScript = Map<CubeView, CubeAnimation[]>;

/**
 * Класс для удобной работы с абстрактным классом MainMask.
 * Абстрагирует функции, связанные с анимацией от этого класса.
 * Сочетает в себе как функцию генерации хода, так и генерации анимации.
 * Предоставляет удобный интерфейс для доступа к методам построения хода
 * для основного приложения.
 */
export function createMoveMap (params: {
    startCubesParameters: StartCubesParameters;
    sideCubesMask: SideCubesMask;
    mainFieldCubes: CubeView[];
    app: TenOnTen;
}): {
        animationsScript: AnimationScript;
        cubesToMove: CubeToMove[];
    } {
    const animationsScript: AnimationScript = new Map();

    const {
        mainFieldCubes,
        sideCubesMask,
        startCubesParameters,
    } = params;

    const startCubesLineId = startCubesParameters.line;
    const startCubesCount = startCubesParameters.count;

    const cubesToMove = prepareMovingCubes({
        startCubesParameters,
        sideCubesMask,
        mainFieldCubes,
    });

    const startCubeAddresses = getStartCubesByStartCubesParameters({
        startCubesParameters,
        sideCubesMask,
    });

    // Добавим шаги анимации для выплывающих из боковой линии кубиков в начало анимации
    callTimes(startCubesCount, () => {
        cubesToMove.forEach(({ moving }) => {
            const isOneOfStartCubes = startCubeAddresses
                .find((startCubeAddress) => {
                    if (!moving.direction) {
                        return false;
                    }

                    return isTheSameAddress(moving.initialAddress, startCubeAddress);
                });

            if (isOneOfStartCubes) {
                const { direction } = moving;

                assertNonEmptyString(direction);

                moving.steps.push(direction);
            } else {
                moving.steps.push(null);
            }
        });
    });

    const {
        sideLinesMovementSteps,
        stepsCount,
    } = generateMoveSteps(cubesToMove.map(({ moving }) => moving));

    // Проходимся в цикле по всем кубикам, которые анимировались на главном поле
    for (const { original, moving } of cubesToMove) {
        const steps = moving.steps;

        const { animations } = stepsToAnimations(steps);

        animationsScript.set(original, animations);
    }

    const compoundAnimationSteps = startCubesCount + stepsCount;
    for (const [
        sideCubesLineId,
        toSideTimes,
    ] of sideLinesMovementSteps.entries()) {
        const sideCubeLineId = parseSideCubesLineId(sideCubesLineId);

        const action = sideCubeLineId.field;
        const actions: ActionStep[] = createArray(compoundAnimationSteps, null);
        for (const stepId of toSideTimes) {
            actions[startCubesCount + stepId] = action;
        }

        const { animations } = stepsToAnimations(actions);

        const cubesCountToAnimate = sideCubesLineId === startCubesLineId
            ? BOARD_SIZE - startCubesCount
            : BOARD_SIZE;

        const cubeAddressesToMove = getCubeAddressInSideFieldInOrderFromMain(sideCubesLineId)
            .reverse()
            .slice(0, cubesCountToAnimate);

        for (const cubeAddress of cubeAddressesToMove) {
            const cube = getSideCubeViewByAddress(sideCubesMask, cubeAddress);
            animationsScript.set(cube, animations);
        }
    }

    return {
        animationsScript,
        cubesToMove,
    };
}
