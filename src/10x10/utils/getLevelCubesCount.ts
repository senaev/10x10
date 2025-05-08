export function getLevelCubesCount (level: number) {
    if ((level > 0 && level < 11) || level === 100) {
        const cubesCount = {
            1: 6,
            2: 11,
            3: 11,
            4: 9,
            5: 11,
            6: 12,
            7: 7,
            8: 13,
            9: 12,
            10: 18,
            100: 25,
        };
        return cubesCount[level as keyof typeof cubesCount];
    } else if (level < 66) {
        return level - 11 + 16;
    } else if (level < 101) {
        return level - 66 + 16;
    } else if (level < 126) {
        return level - 101 + 16;
    } else if (level < 151) {
        return level - 126 + 16;
    } else {
        return level - 151 + 16;
    }
}
