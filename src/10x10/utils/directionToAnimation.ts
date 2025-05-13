import { Direction } from '../const/DIRECTIONS';
import { MoveAnimation } from '../js/MovingCube';

export function directionToAnimation(direction: Direction): MoveAnimation {
    return (`s${direction.charAt(0)}`) as MoveAnimation;
}
