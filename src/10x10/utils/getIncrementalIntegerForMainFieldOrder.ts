import { createIncrementalIntegerGenerator } from 'senaev-utils/src/utils/createIncrementalIntegerGenerator';

/**
 * Счетчик для значений toMineOrder кубиков, попадающих в главное поле
 */
export const getIncrementalIntegerForMainFieldOrder = createIncrementalIntegerGenerator();
