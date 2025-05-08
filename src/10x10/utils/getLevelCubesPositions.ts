import { DEFAULT_CUBES_POSITIONS_PICTURE } from '../const/DEFAULT_CUBES_POSITIONS_PICTURE';
import { PRE_INSTALLED_LEVELS } from '../const/PRE_INSTALLED_LEVELS';

export function getLevelCubesPositions (level: number) {
    if ((level > 0 && level < 11) || level === 100) {
        return PRE_INSTALLED_LEVELS[level];
    } else {
        return DEFAULT_CUBES_POSITIONS_PICTURE;
    }
}
