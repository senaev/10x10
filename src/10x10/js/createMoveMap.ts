import { createArray } from 'senaev-utils/src/utils/Array/createArray/createArray';
import { callTimes } from 'senaev-utils/src/utils/Function/callTimes/callTimes';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { getObjectEntries } from 'senaev-utils/src/utils/Object/getObjectEntries/getObjectEntries';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { CubeAnimationName, CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { CubeColor } from '../const/CUBE_COLORS';
import { Direction } from '../const/DIRECTIONS';
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
    CubeCoordinates,
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
    SideCubesState,
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

/**
 * На вход дается текущий стейт и параметры хода
 * На выходе данные об изменениях стейта по кубикам и список анимаций для каждого кубика
 */
export function createMoveMap ({
    sideCubesState,
    startCubesParameters,
    mainFieldCubesState,
}: {
    startCubesParameters: StartCubesParameters;
    sideCubesState: SideCubesState;
    mainFieldCubesState: MainFieldCubesState;
}): {
        animationsScript: AnimationScript;
        cubesToMove: MovingCube[];
    } {
    const mainFieldCubes = getMainFieldCubesWithCoordinatesFromState(mainFieldCubesState)
        .sort((a, b) => a.toMineOrder - b.toMineOrder);
    const movingCubesInMainField: MovingCube[] = mainFieldCubes.map((cube) => {
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

    const { startCubes, otherCubes: otherCubesInStartLine } = getStartCubesByStartCubesParameters({
        startCubesParameters,
    });

    const startCubeViews: ({
        color: CubeColor;
        field: Direction;
    } & CubeCoordinates)[] = startCubes.map((address) => {
        return {
            color: sideCubesState[address.field][address.x][address.y].color,
            x: address.x,
            y: address.y,
            field: address.field,
        };
    });

    // Стартовые кубики сразу добавляем на главное поле для расчетов движения
    const startMovingCubes: MovingCube[] = [];
    startCubeViews.forEach((cubeView, i) => {
        const initialAddress = {
            x: cubeView.x,
            y: cubeView.y,
            field: cubeView.field,
        };

        const toMineOrder = getIncrementalIntegerForMainFieldOrder();

        const field = cubeView.field;
        let startMovingCubeX;
        let startMovingCubeY;
        if (field === 'top' || field === 'bottom') {
            startMovingCubeX = cubeView.x;
            if (field === 'top') {
                startMovingCubeY = startCubeViews.length - i - 1;
            } else {
                startMovingCubeY = BOARD_SIZE - startCubeViews.length + i;
            }
        } else {
            if (field === 'left') {
                startMovingCubeX = startCubeViews.length - i - 1;
            } else {
                startMovingCubeX = BOARD_SIZE - startCubeViews.length + i;
            }
            startMovingCubeY = cubeView.y;
        }

        const movingCube: MovingCube = {
            initialAddress: getCubeAddressString(initialAddress),
            x: startMovingCubeX,
            y: startMovingCubeY,
            color: cubeView.color,
            direction: reverseDirection(cubeView.field),
            stepActions: [],
            toMineOrder,
        };

        startMovingCubes.push(movingCube);
    });

    const cubesToMove = [
        ...startMovingCubes,
        ...movingCubesInMainField,
    ];

    const startCubesLineId = startCubesParameters.line;
    const startCubesCount = startCubesParameters.count;

    const animationsScript: AnimationScript = {};
    // Добавим шаги анимации для выплывающих из боковой линии кубиков в начало анимации
    callTimes(startCubesCount, () => {
        cubesToMove.forEach((moving) => {
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

    const {
        sideLinesMovementSteps,
        stepsCount: mainAnimationStepsCount,
    } = generateMoveSteps(cubesToMove);

    // Проходимся в цикле по всем кубикам, которые анимировались на главном поле
    for (const moving of cubesToMove) {
        const steps = moving.stepActions;

        const { animations } = stepsToAnimations(steps);

        animationsScript[moving.initialAddress] = animations;
    }

    const sideCubesActions: Record<CubeAddressString, MovingCubeStepAction[]> = {};
    otherCubesInStartLine.forEach((cube) => {
        const cubeAddressString = getCubeAddressString(cube);

        const actions: MovingCubeStepAction[] = [];
        sideCubesActions[cubeAddressString] = actions;

        callTimes(startCubesCount, () => {
            actions.push(reverseDirection(cube.field));
        });
    });

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

    for (const [
        cubeAddressString,
        actions,
    ] of getObjectEntries(sideCubesActions)) {
        const { animations } = stepsToAnimations(actions);
        animationsScript[cubeAddressString] = animations;
    }

    return {
        animationsScript,
        cubesToMove,
    };
}
