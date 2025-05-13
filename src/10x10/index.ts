import 'jquery.transit';
import { isPositiveInteger } from 'senaev-utils/src/utils/Number/PositiveInteger';
import { isObject } from 'senaev-utils/src/utils/Object/isObject/isObject';

import { initPlayGamaBridge, PlayGamaBridge } from '../PlayGama/initPlayGamaBridge';
import { GlobalThis } from '../types/GlobalThis';
import { hintWebpackBuildTime } from '../utils/hintWebpackBuildTime';

import { TenOnTen, TenOnTenState } from './js/TenOnTen';

import './main.css';

hintWebpackBuildTime();

const container = document.getElementById('app');

if (!container) {
    throw new Error('Container not found');
}

const STORAGE_KEY = 's_t_y';

function showAdAfterLevelComplete(bridge: PlayGamaBridge) {
    bridge.advertisement.showInterstitial();
}

function isValidTenOnTenState(state: unknown): state is TenOnTenState {
    return isObject(state) && isPositiveInteger(state.level) && isObject(state.current);
}

(async () => {
    const playGamaBridge = await initPlayGamaBridge();

    const userStateInTenOnTenGame = await playGamaBridge.storage.get(STORAGE_KEY);

    // eslint-disable-next-line no-console
    console.log('initialState', userStateInTenOnTenGame);

    const tenOnTen = new TenOnTen({
        container,
        initialState: isValidTenOnTenState(userStateInTenOnTenGame) ? userStateInTenOnTenGame : undefined,
    });

    (window as GlobalThis & {
        tenOnTen: TenOnTen;
    }).tenOnTen = tenOnTen;

    const saveState = () => {
        playGamaBridge.storage.set(STORAGE_KEY, tenOnTen.getState());
    };

    tenOnTen.on('onAfterMove', saveState);
    tenOnTen.on('onAfterUndo', saveState);
    tenOnTen.on('onAfterNextLevelRefresh', saveState);
    tenOnTen.on('onAfterNextLevel', () => {
        saveState();

        // eslint-disable-next-line no-console
        console.log('showAdAfterLevelComplete');

        showAdAfterLevelComplete(playGamaBridge);
    });

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

    // eslint-disable-next-line no-console
    console.log('App is ready', tenOnTen);
    playGamaBridge.platform.sendMessage('game_ready');
})()
    .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('App initialization failed', error);

        throw error;
    });
