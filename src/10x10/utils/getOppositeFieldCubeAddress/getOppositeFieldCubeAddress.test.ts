import {
    describe,
    expect,
    it,
} from 'vitest';

import { SideCubeAddress } from '../../js/Cubes';

import { getOppositeFieldCubeAddress } from './getOppositeFieldCubeAddress';

describe('getOppositeFieldCubeAddress', () => {
    it('should return correct opposite address when field is top', () => {
        const input: SideCubeAddress = {
            field: 'top',
            x: 5,
            y: 3,
        };

        const expected: SideCubeAddress = {
            field: 'bottom',
            x: 5,
            y: 0,
        };

        expect(getOppositeFieldCubeAddress(input)).toEqual(expected);
    });

    it('should return correct opposite address when field is right', () => {
        const input: SideCubeAddress = {
            field: 'right',
            x: 2,
            y: 4,
        };

        const expected: SideCubeAddress = {
            field: 'left',
            x: 9,
            y: 4,
        };

        expect(getOppositeFieldCubeAddress(input)).toEqual(expected);
    });

    it('should return correct opposite address when field is bottom', () => {
        const input: SideCubeAddress = {
            field: 'bottom',
            x: 7,
            y: 6,
        };

        const expected: SideCubeAddress = {
            field: 'top',
            x: 7,
            y: 9,
        };

        expect(getOppositeFieldCubeAddress(input)).toEqual(expected);
    });

    it('should return correct opposite address when field is left', () => {
        const input: SideCubeAddress = {
            field: 'left',
            x: 3,
            y: 8,
        };

        const expected: SideCubeAddress = {
            field: 'right',
            x: 0,
            y: 8,
        };

        expect(getOppositeFieldCubeAddress(input)).toEqual(expected);
    });
});
