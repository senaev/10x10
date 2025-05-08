type PlayGamaGame = {
    appID: unknown;
    title: unknown;
    url: unknown;
    coverURL: unknown;
    iconURL: unknown;
    isAvailable: unknown;
};

type PlayGamaBridge = {
    initialize: () => Promise<void>;
    platform: {
        id:
        | 'playgama'
        | 'vk'
        | 'ok'
        | 'yandex'
        | 'facebook'
        | 'crazy_games'
        | 'game_distribution'
        | 'wortal'
        | 'playdeck'
        | 'telegram'
        | 'y8'
        | 'lagged'
        | 'msn'
        | 'poki'
        | 'qa_tool'
        | 'mock';
        sdk: null;
        language: 'en' | 'ru';
        payload: null;
        tld: null;
        isGetAllGamesSupported: boolean;
        isGetGameByIdSupported: boolean;
        getAllGames: () => Promise<PlayGamaGame[]>;
        getGameById: (options: {
            gameId: string;
        }) => Promise<PlayGamaGame>;
        sendMessage: (message: PlayGamaMessage) => void;
        getServerTime: () => Promise<number>;
    };
};

type PlayGamaMessages = {
    /**
     * The game has loaded, all loading screens have passed, the player can interact with the game.
     */
    game_ready: void;
    /**
     * Any loading within the game has started. For example, when a level is loading.
     */
    in_game_loading_started: void;
    /**
     * In-game loading has finished.
     */
    in_game_loading_stopped: void;
    /**
     * Gameplay has started. For example, the player has entered a level from the main menu.
     */
    gameplay_started: void;
    /**
     * Gameplay has ended/paused. For example, when exiting a level to the main menu, opening the pause menu, etc.
     */
    gameplay_stopped: void;
    /**
     * The player reached a significant moment. For example, defeating a boss, setting a record, etc.
     */
    player_got_achievement: void;
};

type PlayGamaMessage = keyof PlayGamaMessages;

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
