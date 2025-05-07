export function getLevelColorsCount (level: number) {
    if (level === 1) {
        return 5;
    }

    if (level < 66) {
        return 6;
    }

    if (level < 101) {
        return 7;
    }

    if (level < 126) {
        return 8;
    }

    if (level < 151) {
        return 9;
    }

    return 10;
}
