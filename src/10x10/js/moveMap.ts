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
import { prepareMovingCubes } from '../utils/prepareMovingCubes';
import {
    createSideCubesLineId,
    parseSideCubesLineId,
    SideCubesLineId,
} from '../utils/SideCubesLineIndicator';
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
    isFromSide: boolean;
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
export class MoveMap {
    public readonly toSideActions: ToSideAction[] = [];
    public readonly animationsScript: AnimationScript = new Map();

    public readonly cubesMove: CubesMove;

    public constructor(params: {
        startCubes: CubeView[];
        sideCubesMask: SideCubesMask;
        mainFieldCubes: CubeView[];
        app: TenOnTen;
    }) {
        const {
            mainFieldCubes,
            sideCubesMask,
            startCubes,
        } = params;

        const startCubesField = startCubes[0].field.value();
        if (startCubesField === 'main') {
            throw new Error('startCubesField should not be main');
        }

        const startCubesLineId = createSideCubesLineId({
            x: startCubes[0].x,
            y: startCubes[0].y,
            field: startCubesField,
        });
        const startCubesCount = startCubes.length;

        this.cubesMove = prepareMovingCubes({
            startCubes,
            mainFieldCubes,
        });

        const { cubesToMove } = this.cubesMove;

        // Добавим шаги анимации для выплывающих из боковой линии кубиков в начало анимации
        callTimes(startCubesCount, () => {
            cubesToMove.forEach(({ isFromSide, moving }) => {
                if (isFromSide) {
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
        } = generateMoveSteps(cubesToMove.map(({ moving }) => moving));

        // Массив вхождений в боковые поля, в нём хранятся м-кубики, попавшие в боковые поля
        // в последовательности,  в которой они туда попали
        const toSideActions: ToSideAction[] = [];

        // Проходимся в цикле по всем кубикам, которые анимировались на главном поле
        for (const { original, moving } of cubesToMove) {
            const steps = moving.steps;

            const { animations } = stepsToAnimations(steps);

            // if (isNumber(toSideTime)) {
            //     const initialDirection = original.direction.value();

            //     assertNonEmptyString(initialDirection);

            //     toSideActions.push({
            //         toSideParams: {
            //             time: toSideTime,
            //             sideCubeAddress: getOppositeFieldCubeAddress({
            //                 field: reverseDirection(initialDirection),
            //                 x: original.x,
            //                 y: original.y,
            //             }),
            //         },
            //         movingCube: moving,
            //     });
            // }

            this.animationsScript.set(original, animations);
        }

        for (const [
            sideCubesLineId,
            toSideTimes,
        ] of sideLinesMovementSteps.entries()) {
            const sideCubeLineId = parseSideCubesLineId(sideCubesLineId);

            const action = sideCubeLineId.field;
            const actions: ActionStep[] = createArray(toSideTimes.at(-1)!, null);
            for (const stepId of toSideTimes) {
                actions[stepId] = action;
            }

            const { animations } = stepsToAnimations(actions);

            const cubesCountToAnimate = sideCubesLineId === startCubesLineId
                ? BOARD_SIZE - startCubesCount
                : BOARD_SIZE;

            const cubeAddressesToMove = getCubeAddressInSideFieldInOrderFromMain(sideCubesLineId).slice(0, cubesCountToAnimate);
            for (const cubeAddress of cubeAddressesToMove) {
                const cube = getSideCubeViewByAddress(sideCubesMask, cubeAddress);
                this.animationsScript.set(cube, animations);
            }
        }

        // Сортируем попавшие в боковое поле м-кубики по времени попадания
        toSideActions.sort(function (a, b) {
            return a.toSideParams.time - b.toSideParams.time;
        });

        const linesShifts: Record<SideCubesLineId, {
            time: UnsignedInteger;
            cube: CubeView;
        }[]> = {};
        toSideActions.forEach(({
            movingCube,
            toSideParams: {
                sideCubeAddress,
                time,
            },
        }) => {
            const sideCubesLineIndicator = createSideCubesLineId(sideCubeAddress);

            if (linesShifts[sideCubesLineIndicator] === undefined) {
                linesShifts[sideCubesLineIndicator] = [];
            }

            linesShifts[sideCubesLineIndicator].push({
                time,
                cube: movingCube.cube,
            });
        });

        // getObjectEntries(linesShifts).forEach(([
        //     sideCubesLineIndicator,
        //     shifts,
        // ]) => {
        //     const sideCubeAddress = parseSideCubesLineIndicator(sideCubesLineIndicator);

        //     type IntegerSequence = {
        //         start: UnsignedInteger;
        //         length: PositiveInteger;
        //         cubes: CubeView[];
        //     };

        //     const sequences: IntegerSequence[] = [
        //         {
        //             start: shifts[0].time,
        //             length: 1,
        //             cubes: [shifts[0].cube],
        //         },
        //     ];

        //     for (let i = 1; i < shifts.length; i += 1) {
        //         const lastSequence = sequences.at(-1)!;

        //         if (lastSequence.start + lastSequence.length === shifts[i].time) {
        //             lastSequence.length += 1;
        //             lastSequence.cubes.push(shifts[i].cube);
        //         } else {
        //             sequences.push({
        //                 start: shifts[i].time,
        //                 length: 1,
        //                 cubes: [shifts[i].cube],
        //             });
        //         }
        //     }

        //     const cubesBefore: CubeView[] = [];
        //     const affectedCubeAddresses = getCubeAddressInSideFieldInOrderFromMain(sideCubeAddress);
        //     const affectedCubes = affectedCubeAddresses.map((address) => getSideCubeViewByAddress(params.app.cubes.sideCubesMask, address));
        //     sequences.forEach(({
        //         start,
        //         length,
        //         cubes,
        //     }, sequenceIndex) => {
        //         affectedCubes.forEach((cube) => {
        //             const animations = mapGetOrSetIfNotExists(this.animationsScript, cube, []);

        //             animations.push({
        //                 action: 'further',
        //                 duration: length,
        //                 delay: start,
        //             });
        //         });

        //         cubes.forEach((cube, i) => {
        //             const animations = this.animationsScript.get(cube);

        //             assertObject(animations);

        //             const lastAnimation = animations.at(-1);

        //             assertObject(lastAnimation);

        //             const additionalDuration = cubes.length - i - 1;
        //             if (sequenceIndex === 0) {
        //                 if (lastAnimation.action !== 'toSide') {
        //                     throw new Error('last animation should be toSide');
        //                 }

        //                 lastAnimation.duration += additionalDuration;
        //             } else {
        //                 animations.push({
        //                     action: 'further',
        //                     duration: additionalDuration,
        //                     delay: start,
        //                 });

        //                 cubesBefore.forEach((cube) => {
        //                     const animations = this.animationsScript.get(cube);

        //                     assertObject(animations);

        //                     animations.push({
        //                         action: 'further',
        //                         duration: cubes.length,
        //                         delay: start,
        //                     });
        //                 });
        //             }
        //         });

        //         cubesBefore.push(...cubes);
        //     });
        // });

        this.toSideActions = toSideActions;
    }
}
