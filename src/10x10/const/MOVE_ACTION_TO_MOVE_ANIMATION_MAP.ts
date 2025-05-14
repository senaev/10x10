import { CubeAnimationName } from '../components/CubeView';
import { MoveAction } from '../js/MovingCube';

export const MOVE_ACTION_TO_MOVE_ANIMATION_MAP: Record<MoveAction, CubeAnimationName> = {
    st: 'stBump',
    sr: 'srBump',
    sl: 'slBump',
    sb: 'sbBump',
};
