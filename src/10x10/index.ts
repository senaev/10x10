import 'jquery.transit';
import { initPlayGamaBridge } from '../PlayGama/initPlayGamaBridge';
import { GlobalThis } from '../types/GlobalThis';
import { hintWebpackBuildTime } from '../utils/hintWebpackBuildTime';

import { TenOnTen } from './js/TenOnTen';

import './main.css';

hintWebpackBuildTime();

const container = document.getElementById('app');

if (!container) {
    throw new Error('Container not found');
}

const tenOnTen = new TenOnTen({
    container,
});

(window as GlobalThis & {
    tenOnTen: TenOnTen;
}).tenOnTen = tenOnTen;

// eslint-disable-next-line no-console
console.log('App is ready', tenOnTen);

initPlayGamaBridge();
