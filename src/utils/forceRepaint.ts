/**
 * stolen from jquery.transit https://github.com/rstacruz/jquery.transit/blob/1c978a0aaa1eac88be9f9508c4f5913b30d43a87/jquery.transit.js#L668
 */
export function forceRepaint(element: HTMLElement) {
    void element.offsetWidth;
}
