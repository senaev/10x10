import { Direction } from '../const/DIRECTIONS';
import { MoveAction } from '../js/MovingCube';

export function directionToAnimation(direction: Direction): MoveAction {
    return (`s${direction.charAt(0)}`) as MoveAction;
}
