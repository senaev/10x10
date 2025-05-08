export function bezier(duration: number): number {
    const o: Record<number, number> = {
        1: 99,
        2: 58,
        3: 42,
        4: 34,
        5: 27,
        6: 23,
        7: 19,
        8: 15,
        9: 12,
        10: 11,
        11: 10,
    };
    return o[duration];
}
