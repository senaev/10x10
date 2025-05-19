import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';
import { callTimes } from 'senaev-utils/src/utils/Function/callTimes/callTimes';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { CubeAnimationName } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { generateMoveSteps } from '../utils/generateMoveSteps';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getStartCubesByStartCubesParameters } from '../utils/getStartCubesByStartCubesParameters';
import { StartCubesParameters } from '../utils/getStartCubesParameters';
import { prepareMovingCubes } from '../utils/prepareMovingCubes';
import {
    parseSideCubesLineId,
} from '../utils/SideCubesLineIndicator/SideCubesLineIndicator';
import { stepsToAnimations } from '../utils/stepsToAnimations/stepsToAnimations';

import {
    CubeCoordinates, SideCubeAddress,
} from './CubesViews';
import {
    CubeAddressString,
    getCubeAddressString,
    MovingCube,
    MovingCubeStepAction,
} from './MovingCube';
import {
    MainFieldCubeStateValue, SideCubesState,
    TenOnTen,
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

export type AnimationScript = Map<CubeAddressString, CubeAnimation[]>;

/**
 * Класс для удобной работы с абстрактным классом MainMask.
 * Абстрагирует функции, связанные с анимацией от этого класса.
 * Сочетает в себе как функцию генерации хода, так и генерации анимации.
 * Предоставляет удобный интерфейс для доступа к методам построения хода
 * для основного приложения.
 */
export function createMoveMap (params: {
    startCubesParameters: StartCubesParameters;
    sideCubesState: SideCubesState;
    mainFieldCubes: (MainFieldCubeStateValue & CubeCoordinates)[];
    app: TenOnTen;
}): {
        animationsScript: AnimationScript;
        cubesToMove: MovingCube[];
    } {
    const animationsScript: AnimationScript = new Map();

    const {
        mainFieldCubes,
        sideCubesState,
        startCubesParameters,
    } = params;

    const startCubesLineId = startCubesParameters.line;
    const startCubesCount = startCubesParameters.count;

    const cubesToMove = prepareMovingCubes({
        startCubesParameters,
        sideCubesState,
        mainFieldCubes,
    });

    const startCubeAddresses = getStartCubesByStartCubesParameters({
        startCubesParameters,
    });

    // Добавим шаги анимации для выплывающих из боковой линии кубиков в начало анимации
    callTimes(startCubesCount, () => {
        cubesToMove.forEach((moving) => {
            const isOneOfStartCubes = startCubeAddresses
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

    const {
        sideLinesMovementSteps,
        stepsCount,
    } = generateMoveSteps(cubesToMove);

    // Проходимся в цикле по всем кубикам, которые анимировались на главном поле
    for (const moving of cubesToMove) {
        const steps = moving.stepActions;

        const { animations } = stepsToAnimations(steps);

        animationsScript.set(moving.initialAddress, animations);
    }

    const compoundAnimationSteps = startCubesCount + stepsCount;
    for (const [
        sideCubesLineId,
        toSideTimes,
    ] of sideLinesMovementSteps.entries()) {
        const sideCubeLineId = parseSideCubesLineId(sideCubesLineId);

        const action = sideCubeLineId.field;
        const actions: MovingCubeStepAction[] = createArray(compoundAnimationSteps, null);
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
            const cubeAddressString = getCubeAddressString(cubeAddress);
            animationsScript.set(cubeAddressString, animations);
        }
    }

    return {
        animationsScript,
        cubesToMove,
    };
}
