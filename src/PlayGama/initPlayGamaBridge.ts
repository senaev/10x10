import { UnixTimeMs } from 'senaev-utils/src/types/Time/UnixTimeMs';

import { PlayGamaBridgeEventName, PlayGamaBridgeEventNames } from './types/PlayGamaBridgeEventNames';
import { PlayGamaBridgePlatform } from './types/PlayGamaBridgePlatforms';
import { PlayGamaBridgeStorage, PlayGamaBridgeStorageType } from './types/PlayGamaBridgeStorage';
import { PlayGamaGame } from './types/PlayGamaGame';
import { PlayGamaMessage } from './types/PlayGamaMessages';

export type PlayGamaBridge = {
    initialize: () => Promise<void>;
    platform: {
        id: PlayGamaBridgePlatform;
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
        getServerTime: () => Promise<UnixTimeMs>;
    };
    game: {
        visibilityState: 'visible' | 'hidden';
        on: <T extends PlayGamaBridgeEventName>(event: T, callback: (state: PlayGamaBridgeEventNames[T]) => void) => void;
    };
    EVENT_NAME: Record<string, PlayGamaBridgeEventName>;
    STORAGE_TYPE: Record<string, PlayGamaBridgeStorageType>;
    storage: PlayGamaBridgeStorage;
};

declare const bridge: PlayGamaBridge;

export async function initPlayGamaBridge(): Promise<PlayGamaBridge> {
    await bridge.initialize();

    // eslint-disable-next-line no-console
    console.log('PlayGamaBridge initialized', bridge);

    return bridge;
}
