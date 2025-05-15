import { callTimes } from 'senaev-utils/src/utils/Function/callTimes/callTimes';
import { isNumber } from 'senaev-utils/src/utils/Number/Number';
import { PositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { UnsignedInteger } from 'senaev-utils/src/utils/Number/UnsignedInteger';
import { assertNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';

import { CubeAnimationName, CubeView } from '../components/CubeView';
import { directionToAnimation } from '../utils/directionToAnimation';
import { generateMoveSteps } from '../utils/generateMoveSteps';
import { getOppositeFieldCubeAddress } from '../utils/getOppositeFieldCubeAddress/getOppositeFieldCubeAddress';
import { prepareMovingCubes } from '../utils/prepareMovingCubes';
import { reverseDirection } from '../utils/reverseDirection';
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

export type CubeAnimationStep = {
    animations: CubeAnimation[];
    cube: CubeView;
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
    public readonly animationsScript: CubeAnimationStep[] = [];

    public readonly cubesMove: CubesMove;

    public constructor(params: { startCubes: CubeView[]; mainFieldCubes: CubeView[]; app: TenOnTen }) {
        const mainFieldCubes = params.mainFieldCubes;

        const startCubes = params.startCubes;
        this.startCubes = startCubes;

        this.cubesMove = prepareMovingCubes({
            startCubes,
            mainFieldCubes,
        });

        const { cubesToMove } = this.cubesMove;

        // добавим шаги анимации для выплывающих из боковой линии кубиков в начало анимации
        callTimes(startCubes.length, () => {
            cubesToMove.forEach(({ isFromSide, moving }) => {
                if (isFromSide) {
                    const { direction } = moving;

                    assertNonEmptyString(direction);

                    moving.steps.push({
                        do: directionToAnimation(direction),
                    });
                } else {
                    moving.steps.push(null);
                }
            });
        });

        generateMoveSteps(cubesToMove.map(({ moving }) => moving));

        // массив вхождений в боковые поля, в нём хранятся м-кубики, попавшие в боковые поля
        // в последовательности,  в которой они туда попали
        const toSideActions: ToSideAction[] = [];

        // проходимся в цикле по всем кубикам
        for (const { original, moving } of cubesToMove) {
            const steps = moving.steps;

            const { animations, toSideTime } = stepsToAnimations(steps);

            // if (moving.cube.element.logStepsAndAnimations) {
            //     console.log({
            //         steps,
            //         animations,
            //     });
            // }

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

            this.animationsScript.push({
                animations,
                cube: original,
            });
        }

        // сортируем попавшие в боковое поле м-кубики по времени попадания
        toSideActions.sort(function (a, b) {
            return a.toSideParams.time - b.toSideParams.time;
        });

        this.toSideActions = toSideActions;
    }

}
