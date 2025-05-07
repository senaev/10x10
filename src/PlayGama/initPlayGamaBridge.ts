type PlayGamaBridge = {
    initialize: () => Promise<void>;
};

declare const bridge: PlayGamaBridge;

export function initPlayGamaBridge() {
    bridge
        .initialize()
        .then(() => {
            // eslint-disable-next-line no-console
            console.log('PlayGamaBridge initialized');
        })
        .catch((error) => {
            // eslint-disable-next-line no-console
            console.error('PlayGamaBridge initialization failed', error);
        });
}
