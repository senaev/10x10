import {
    describe,
    expect,
    it,
} from 'vitest';

import { Direction } from '../../const/DIRECTIONS';

import {
    getSideCubeLineId, parseSideCubesLineId, type SideCubesLineId,
} from './SideCubesLineIndicator';

describe('SideCubesLineIndicator', () => {
    describe('getSideCubeLineId', () => {
        it('should throw error for invalid field', () => {
            expect(() => getSideCubeLineId({
                field: 'invalid' as Direction,
                x: 0,
                y: 0,
            })).toThrow('Invalid field');
        });

        it('should return correct line ID for top field', () => {
            expect(getSideCubeLineId({
                field: 'top',
                x: 5,
                y: 3,
            })).toBe('top,5,9');
            expect(getSideCubeLineId({
                field: 'top',
                x: 5,
                y: 9,
            })).toBe('top,5,9');
        });

        it('should return correct line ID for bottom field', () => {
            expect(getSideCubeLineId({
                field: 'bottom',
                x: 5,
                y: 3,
            })).toBe('bottom,5,0');
            expect(getSideCubeLineId({
                field: 'bottom',
                x: 5,
                y: 0,
            })).toBe('bottom,5,0');
        });

        it('should return correct line ID for left field', () => {
            expect(getSideCubeLineId({
                field: 'left',
                x: 3,
                y: 5,
            })).toBe('left,9,5');
            expect(getSideCubeLineId({
                field: 'left',
                x: 9,
                y: 5,
            })).toBe('left,9,5');
        });

        it('should return correct line ID for right field', () => {
            expect(getSideCubeLineId({
                field: 'right',
                x: 3,
                y: 5,
            })).toBe('right,0,5');
            expect(getSideCubeLineId({
                field: 'right',
                x: 0,
                y: 5,
            })).toBe('right,0,5');
        });
    });

    describe('parseSideCubesLineId', () => {
        it('should correctly parse top field line ID', () => {
            const result = parseSideCubesLineId('top,5,9' as SideCubesLineId);
            expect(result).toEqual({
                field: 'top',
                x: 5,
                y: 9,
            });
        });

        it('should correctly parse bottom field line ID', () => {
            const result = parseSideCubesLineId('bottom,5,0' as SideCubesLineId);
            expect(result).toEqual({
                field: 'bottom',
                x: 5,
                y: 0,
            });
        });

        it('should correctly parse left field line ID', () => {
            const result = parseSideCubesLineId('left,9,5' as SideCubesLineId);
            expect(result).toEqual({
                field: 'left',
                x: 9,
                y: 5,
            });
        });

        it('should correctly parse right field line ID', () => {
            const result = parseSideCubesLineId('right,0,5' as SideCubesLineId);
            expect(result).toEqual({
                field: 'right',
                x: 0,
                y: 5,
            });
        });
    });
});
