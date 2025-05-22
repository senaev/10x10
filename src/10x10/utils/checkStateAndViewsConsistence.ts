import { CubeView } from '../components/CubeView';
import { BOARD_SIZE } from '../const/BOARD_SIZE';
import { Field, FIELDS } from '../const/FIELDS';
import { CubesViewsStore } from '../js/CubesViews';
import {
    CubesState, MainFieldCubeStateValue, SideFieldCubeStateValue,
} from '../js/TenOnTen';

import { reverseDirection } from './reverseDirection';

function traverseAllCells({
    state,
    views,
    callback,
}: {
    state: CubesState;
    views: CubesViewsStore;
    callback: (params: {
        cubeState: SideFieldCubeStateValue | MainFieldCubeStateValue | null;
        viewsSet: Set<CubeView>;
        field: Field; x:
        number;
        y: number;
    }) => void;
}) {
    for (const field of FIELDS) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            for (let y = 0; y < BOARD_SIZE; y++) {
                const cubeState = state[field][x][y];
                const viewsSet = views[field][x][y];

                callback({
                    cubeState,
                    viewsSet,
                    field,
                    x,
                    y,
                });
            }
        }
    }
}

export function checkStateAndViewsConsistence({
    state,
    views,
    cubesContainer,
}: {
    state: CubesState;
    views: CubesViewsStore;
    cubesContainer: HTMLDivElement;
}): void {
    let expectedCubeElementsCount = BOARD_SIZE ** 2 * 4;
    const viewElementsSet = new Set<HTMLElement>();

    traverseAllCells({
        state,
        views,
        callback: ({
            cubeState,
            viewsSet,
            field,
            x,
            y,
        }) => {
            if (viewsSet.size > 1) {
                throw new Error(`viewsSet.size > 1, field=${field}, x=${x}, y=${y}`);
            }

            const view: CubeView | undefined = viewsSet.values().next().value;

            if (view) {
                const { element } = view;
                if (element.parentElement !== cubesContainer) {
                    throw new Error(`view.parentElement !== cubesContainer, field=${field}, x=${x}, y=${y}`);
                }

                viewElementsSet.add(element);
            }

            if (field === 'main') {
                if (cubeState) {
                    expectedCubeElementsCount++;

                    const mainFieldCubeState = cubeState as MainFieldCubeStateValue;

                    if (!view) {
                        throw new Error(`cubeState && !view, field=${field}, x=${x}, y=${y}`);
                    }

                    const viewColor = view.color.value();
                    const viewDirection = view.direction.value();

                    if (viewColor !== mainFieldCubeState.color) {
                        throw new Error(`view.color=[${viewColor}] !== state.color=[${mainFieldCubeState.color}] field=${field}, x=${x}, y=${y}`);
                    }

                    if (viewDirection !== mainFieldCubeState.direction) {
                        throw new Error(`view.direction=[${viewDirection}] !== state.direction=[${mainFieldCubeState.direction}] field=${field}, x=${x}, y=${y}`);
                    }
                    return;
                }

                if (viewsSet.size !== 0) {
                    throw new Error(`!cubeState && viewsSet.size !== 0, field=${field}, x=${x}, y=${y}`);
                }
                return;
            }

            if (!view) {
                throw new Error(`!view for side field=${field}, x=${x}, y=${y}`);
            }

            if (!cubeState) {
                throw new Error(`!cubeState for side field=${field}, x=${x}, y=${y}`);
            }

            const viewColor = view.color.value();
            const viewDirection = view.direction.value();

            if (viewColor !== cubeState.color) {
                throw new Error(`view.color=[${viewColor}] !== state.color=[${cubeState.color}] field=${field}, x=${x}, y=${y}`);
            }

            if (viewDirection !== reverseDirection(field)) {
                throw new Error(`view.direction=[${viewDirection}] !== reverseDirection(field)=[${reverseDirection(field)}] field=${field}, x=${x}, y=${y}`);
            }
        },
    });

    const realCubeElementsCount = cubesContainer.children.length;

    if (realCubeElementsCount !== expectedCubeElementsCount) {
        for (const element of cubesContainer.children) {
            if (!viewElementsSet.has(element as HTMLElement)) {
                throw new Error(`element is not in viewElementsSet, element=${element}`);
            }
        }

        throw new Error(`realCubeElementsCount=[${realCubeElementsCount}] !== expectedCubeElementsCount=[${expectedCubeElementsCount}]`);
    }
}
