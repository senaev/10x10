import { MoveAnimation } from '../js/MovingCube';
import { Direction } from '../types/Direction';

export function directionToAnimation(direction: Direction): MoveAnimation {
    return (`s${direction.charAt(0)}`) as MoveAnimation;
}
