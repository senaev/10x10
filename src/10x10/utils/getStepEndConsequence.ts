import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { MainFieldCubesState } from '../js/TenOnTen';

/**
 * Проверяем в конце хода на конец уровня или конец игры
 */
export function getStepEndConsequence(mainFieldCubesState: MainFieldCubesState): 'next_level' | 'game_over' | undefined {
    let gameOver: boolean = true;
    let nextLevel: boolean = true;

    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            const cubeState = mainFieldCubesState[x][y];

            // если на поле еще остались кубики, уровень не завершен
            if (cubeState) {
                nextLevel = false;
            }

            // если все крайние панели заполнены - конец игры,
            // если хоть один пустой - игра продолжается
            if (
                x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1
            ) {
                if (!cubeState) {
                    gameOver = false;
                }
            }
        }
    }

    if (nextLevel) {
        // меняем датчик на следующий уровень
        return 'next_level';
    }
    if (gameOver) {
        // меняем датчик на конец игры
        return 'game_over';
    }

    // иначе - ничего не делаем
    return undefined;
}
