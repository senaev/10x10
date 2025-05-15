import { callTimes } from 'senaev-utils/src/utils/Function/callTimes/callTimes';
import { collectIntegerSequences } from 'senaev-utils/src/utils/Number/collectIntegerSequences/collectIntegerSequences';
import { isNumber } from 'senaev-utils/src/utils/Number/Number';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { getObjectEntries } from 'senaev-utils/src/utils/Object/getObjectEntries/getObjectEntries';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { CubeAnimationName, CubeView } from '../components/CubeView';
import { DIRECTION_TO_ANIMATION } from '../const/DIRECTION_TO_ANIMATION';
import { generateMoveSteps } from '../utils/generateMoveSteps';
import { getCubeAddressInSideFieldInOrderFromMain } from '../utils/getCubeAddressInSideFieldInOrderFromMain';
import { getOppositeFieldCubeAddress } from '../utils/getOppositeFieldCubeAddress/getOppositeFieldCubeAddress';
import { getSideCubeViewByAddress } from '../utils/getSideCubeViewByAddress';
import { prepareMovingCubes } from '../utils/prepareMovingCubes';
import { reverseDirection } from '../utils/reverseDirection';
import {
    createSideCubesLineIndicator, parseSideCubesLineIndicator, SideCubesLineIndicator,
} from '../utils/SideCubesLineIndicator';
import { stepsToAnimations } from '../utils/stepsToAnimations/stepsToAnimations';

import { SideCubeAddress } from './Cubes';
import {
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
    public readonly startCubes: CubeView[];
    public readonly toSideActions: ToSideAction[] = [];
    public readonly animationsScript: AnimationScript = new Map();

    public readonly cubesMove: CubesMove;

    public constructor(params: {
        startCubes: CubeView[];
        mainFieldCubes: CubeView[];
        app: TenOnTen;
    }) {
        const mainFieldCubes = params.mainFieldCubes;

        const startCubes = params.startCubes;
        this.startCubes = startCubes;

        this.cubesMove = prepareMovingCubes({
            startCubes,
            mainFieldCubes,
        });

        const { cubesToMove } = this.cubesMove;

        // Добавим шаги анимации для выплывающих из боковой линии кубиков в начало анимации
        callTimes(startCubes.length, () => {
            cubesToMove.forEach(({ isFromSide, moving }) => {
                if (isFromSide) {
                    const { direction } = moving;

                    assertNonEmptyString(direction);

                    moving.steps.push({
                        do: DIRECTION_TO_ANIMATION[direction],
                    });
                } else {
                    moving.steps.push(null);
                }
            });
        });

        generateMoveSteps(cubesToMove.map(({ moving }) => moving));

        // Массив вхождений в боковые поля, в нём хранятся м-кубики, попавшие в боковые поля
        // в последовательности,  в которой они туда попали
        const toSideActions: ToSideAction[] = [];

        // Проходимся в цикле по всем кубикам
        for (const { original, moving } of cubesToMove) {
            const steps = moving.steps;

            const { animations, toSideTime } = stepsToAnimations(steps);

            if (isNumber(toSideTime)) {
                const initialDirection = original.direction.value();

                assertNonEmptyString(initialDirection);

                toSideActions.push({
                    toSideParams: {
                        time: toSideTime,
                        sideCubeAddress: getOppositeFieldCubeAddress({
                            field: reverseDirection(initialDirection),
                            x: original.x,
                            y: original.y,
                        }),
                    },
                    movingCube: moving,
                });
            }

            this.animationsScript.set(original, animations);
        }

        // Сортируем попавшие в боковое поле м-кубики по времени попадания
        toSideActions.sort(function (a, b) {
            return a.toSideParams.time - b.toSideParams.time;
        });

        const linesShifts: Record<SideCubesLineIndicator, UnsignedInteger[]> = {};
        toSideActions.forEach(({
            movingCube,
            toSideParams: {
                sideCubeAddress,
                time,
            },
        }) => {
            const sideCubesLineIndicator = createSideCubesLineIndicator(sideCubeAddress);

            if (linesShifts[sideCubesLineIndicator] === undefined) {
                linesShifts[sideCubesLineIndicator] = [];
            }

            linesShifts[sideCubesLineIndicator].push(time);
        });

        getObjectEntries(linesShifts).forEach(([
            sideCubesLineIndicator,
            shifts,
        ]) => {
            const sideCubeAddress = parseSideCubesLineIndicator(sideCubesLineIndicator);

            const sequences = collectIntegerSequences(shifts);

            const affectedCubeAddresses = getCubeAddressInSideFieldInOrderFromMain(sideCubeAddress);
            const affectedCubes = affectedCubeAddresses.map((address) => getSideCubeViewByAddress(params.app.cubes.sideCubesMask, address));
            sequences.forEach(({
                start,
                length,
            }) => {
                affectedCubes.forEach((cube) => {
                    //
                });
            });
        });

        this.toSideActions = toSideActions;
    }
}
