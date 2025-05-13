import 'jquery.transit';
import { isPositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { isObject } from 'senaev-utils/src/utils/Object/isObject/isObject';
import { isNonEmptyString } from 'senaev-utils/src/utils/String/NonEmptyString/NonEmptyString';
import { decryptString, encryptString } from 'senaev-utils/src/utils/encryptDecryptString/encryptDecryptString';

import { initPlayGamaBridge, PlayGamaBridge } from '../PlayGama/initPlayGamaBridge';
import { GlobalThis } from '../types/GlobalThis';
import { hintWebpackBuildTime } from '../utils/hintWebpackBuildTime';

import { SESSION_ENCRYPTION_SECRET } from './const/SESSION_ENCRYPTION_SECRET';
import { STORAGE_KEY } from './const/STORAGE_KEY';
import { TenOnTen, TenOnTenState } from './js/TenOnTen';
import './main.css';

hintWebpackBuildTime();

const container = document.getElementById('app');

if (!container) {
    throw new Error('Container not found');
}

const encryptState = (state: TenOnTenState): Promise<string> => {
    const stateString = JSON.stringify(state);

    return encryptString({
        string: stateString,
        secret: SESSION_ENCRYPTION_SECRET,
    });
};

const decryptState = async (string: string): Promise<string> => decryptString({
    string,
    secret: SESSION_ENCRYPTION_SECRET,
});

function showAdAfterLevelComplete(bridge: PlayGamaBridge) {
    bridge.advertisement.showInterstitial();
}

function isValidTenOnTenState(state: unknown): state is TenOnTenState {
    return isObject(state) && isPositiveInteger(state.level) && isObject(state.current);
}

(async () => {
    const playGamaBridge = await initPlayGamaBridge();

    const isMockEnv = playGamaBridge.platform.id === 'mock';

    const [encryptedState] = await playGamaBridge.storage.get([STORAGE_KEY]);
    let initialState: TenOnTenState | undefined;
    if (isNonEmptyString(encryptedState)) {
        const decryptedState = await decryptState(encryptedState);

        if (isNonEmptyString(decryptedState)) {
            const stateObject = JSON.parse(decryptedState);

            if (isValidTenOnTenState(stateObject)) {
                initialState = stateObject;
            }
        }
    }

    // eslint-disable-next-line no-console
    console.log('initialState', isMockEnv ? initialState : Boolean(initialState));

    const tenOnTen = new TenOnTen({
        container,
        initialState,
    });

    (window as GlobalThis & {
        tenOnTen: TenOnTen;
    }).tenOnTen = tenOnTen;

    const saveState = async () => {
        const encryptedStateNext: string = await encryptState(tenOnTen.getState());
        playGamaBridge.storage.set([STORAGE_KEY], [encryptedStateNext]);
    };

    tenOnTen.on('onAfterMove', saveState);
    tenOnTen.on('onAfterUndo', saveState);
    tenOnTen.on('onAfterNextLevelRefresh', saveState);
    tenOnTen.on('onAfterNewGameStarted', saveState);
    tenOnTen.on('onAfterNextLevel', () => {
        saveState();

        // eslint-disable-next-line no-console
        console.log('showAdAfterLevelComplete');

        showAdAfterLevelComplete(playGamaBridge);
    });

    if (!isMockEnv) {
        playGamaBridge.game.on(playGamaBridge.EVENT_NAME.VISIBILITY_STATE_CHANGED, (nextState) => {
            // eslint-disable-next-line no-console
            console.log('Visibility state:', nextState);
        });

        // To track interstitial ad state changes, subscribe to the event
        playGamaBridge.advertisement.on(
            playGamaBridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED,
            (state) => {
                // eslint-disable-next-line no-console
                console.log('Interstitial state: ', state);
            }
        );
    }

    // eslint-disable-next-line no-console
    console.log('App is ready', tenOnTen);
    playGamaBridge.platform.sendMessage('game_ready');
})()
    .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('App initialization failed', error);

        throw error;
    });
