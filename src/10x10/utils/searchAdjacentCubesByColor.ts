/**
     * Функция поиска смежных в массиве по цветам
     */
export function searchAdjacentCubesByColor<T extends { x: number; y: number }>(arr: T[]): T[][] {
    const groupsNew: Map<T, Set<T>> = new Map();

    for (let key = 0; key < arr.length - 1; key++) {
        // Текущий кубик
        const current = arr[key];
        for (let key1 = key + 1; key1 < arr.length; key1++) {
            // Кубик, который проверяем на смежность текущему кубику
            const compare: T = arr[key1];
            // Если кубики смежные
            const isAdjacent = Math.abs(current.x - compare.x) + Math.abs(current.y - compare.y) === 1;
            if (
                isAdjacent
            ) {
                const currentSet = groupsNew.get(current);
                const compareSet = groupsNew.get(compare);

                if (!currentSet && !compareSet) {
                    const set = new Set([
                        current,
                        compare,
                    ]);
                    groupsNew.set(current, set);
                    groupsNew.set(compare, set);
                } else if (currentSet && compareSet) {
                    for (const cube of currentSet) {
                        compareSet.add(cube);
                        groupsNew.set(cube, compareSet);
                    }
                } else if (currentSet || compareSet) {
                    const set = (currentSet || compareSet)!;
                    groupsNew.set(current, set);
                    groupsNew.set(compare, set);
                    set.add(current);
                    set.add(compare);
                }
            }
        }
    }

    const uniqueSets = new Set<Set<T>>();
    for (const set of groupsNew.values()) {
        uniqueSets.add(set);
    }

    return Array
        .from(uniqueSets)
        .filter((set) => set.size > 2)
        .map((set) => Array.from(set));
}
