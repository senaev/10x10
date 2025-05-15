import {
    describe,
    expect,
    it,
} from 'vitest';

import { CubeAnimation } from '../../js/MoveMap';
import { ActionStep } from '../../js/MovingCube';

import { stepsToAnimations } from './stepsToAnimations';

const TEST_CASES: {
    steps: ActionStep[];
    expectedResult: {
        animations: CubeAnimation[];
        toSideTime: number | undefined;
    };
}[] = [
    {
        steps: [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            { do: 'sb' },
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            { do: 'sb' },
            { do: 'sb' },
            { do: 'sb' },
            { do: 'sb' },
            { do: 'toSide' },
            null,
        ],
        expectedResult: {
            animations: [
                {
                    action: 'sbBump',
                    duration: 2,
                    delay: 11,
                },
                {
                    action: 'toSide',
                    duration: 5,
                    delay: 19,
                },
            ],
            toSideTime: 23,
        },
    },
    {
        steps: [
            { do: 'sl' },
            { do: 'sl' },
            { do: 'sl' },
            { do: 'sl' },
            { do: 'sl' },
            { do: 'sl' },
            { do: 'sl' },
            null,
            null,
            null,
            { do: 'sl' },
            { do: 'sl' },
            null,
            null,
            { do: 'sl' },
            { do: 'toSide' },
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
        ],
        expectedResult: {
            animations: [
                {
                    action: 'slBump',
                    duration: 8,
                    delay: 0,
                },
                {
                    action: 'slBump',
                    duration: 3,
                    delay: 10,
                },
                {
                    action: 'toSide',
                    duration: 2,
                    delay: 14,
                },
            ],
            toSideTime: 15,
        },
    },
    {
        steps: [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            { do: 'sb' },
            { do: 'toSide' },
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
        ],
        expectedResult: {
            animations: [
                {
                    action: 'toSide',
                    duration: 2,
                    delay: 10,
                },
            ],
            toSideTime: 11,
        },
    },
    {
        steps: [
            { do: 'sl' },
            { do: 'sl' },
            { do: 'sl' },
            { do: 'sl' },
            { do: 'sl' },
            { do: 'sl' },
            { do: 'sl' },
            null,
            { do: 'boom' },
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
        ],
        expectedResult: {
            animations: [
                {
                    action: 'slBump',
                    duration: 8,
                    delay: 0,
                },
                {
                    action: 'boom',
                    duration: 1,
                    delay: 8,
                },
            ],
            toSideTime: undefined,
        },
    },
    {
        steps: [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
        ],
        expectedResult: {
            animations: [],
            toSideTime: undefined,
        },
    },
];

describe('stepsToAnimations', () => {
    TEST_CASES.forEach(({
        steps, expectedResult,
    }, i) => {
        it(`test case ${i}`, () => {
            const result = stepsToAnimations(steps);
            expect(result).toEqual(expectedResult);
        });
    });
});
