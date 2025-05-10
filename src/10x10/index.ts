import 'jquery.transit';
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

const STORAGE_KEY = 's_t_';

function showBanner(bridge: PlayGamaBridge) {

    let options = { };

    switch (bridge.platform.id) {
    case 'vk':
        options = {
            position: 'top', // optional parameter, default = bottom
            layoutType: 'resize', // optional parameter
            canClose: false, // optional parameter
        };
        break;
    case 'crazy_games':
        options = {
            position: 'top', // optional parameter, default = bottom
        };
        break;
    case 'game_distribution':
        options = {
            position: 'top', // optional parameter, default = bottom
        };
        break;
    case 'msn':
        options = {
            position: 'top:728x90', // optional parameter, default = 'top:728x90'
        };
        break;
    }

    bridge.advertisement.showBanner(options);
}

(async () => {
    const playGamaBridge = await initPlayGamaBridge();

    const state = await playGamaBridge.storage.get(STORAGE_KEY);

    const tenOnTen = new TenOnTen({
        container,
        initialState: isObject(state) ? state as TenOnTenState : undefined,
    });
    // eslint-disable-next-line no-console
    console.log('App is ready', tenOnTen);

    (window as GlobalThis & {
        tenOnTen: TenOnTen;
    }).tenOnTen = tenOnTen;

    const saveState = () => {
        playGamaBridge.storage.set(STORAGE_KEY, tenOnTen.getState());
    };

    tenOnTen.on('onAfterMove', saveState);
    tenOnTen.on('onAfterUndo', saveState);
    tenOnTen.on('onAfterNextLevel', () => {
        saveState();

        // eslint-disable-next-line no-console
        console.log('showBanner');
        if (!playGamaBridge.advertisement.isBannerSupported) {
            return;
        }

        showBanner(playGamaBridge);
    });
})()
    .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('App initialization failed', error);

        throw error;
    });
