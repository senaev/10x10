import { MoveAnimation } from '../js/MCube';
import { Direction } from '../types/Direction';

export function directionToAnimation(direction: Direction): MoveAnimation {
    return (`s${direction.charAt(0)}`) as MoveAnimation;
}
