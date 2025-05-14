import { CubeView } from '../components/CubeView';
import { FIELD_OFFSETS } from '../const/FIELD_OFFSETS';
import { CubeAddress } from '../js/Cubes';

/**
 * Задаем html-элементу кубика положение на доске
 * Если параметры не переданы, устанавливаем текущую позицию кубика
 * Если переданы - устанавливаем в поле кубику, в позицию х/у, переданные в параметрах
 */
export function setCubeViewPositionOnTheField(cubeView: CubeView, {
    x, y, field,
}: CubeAddress) {

    const left = x + FIELD_OFFSETS[field].x;
    cubeView.element.style.left = `${left + 3.5}em`;

    const top = y + FIELD_OFFSETS[field].y;
    cubeView.element.style.top = `${top + 3.5}em`;
}
