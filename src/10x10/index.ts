import 'jquery.transit';
import { initPlayGamaBridge } from '../PlayGama/initPlayGamaBridge';

import { TenOnTen } from './js/TenOnTen';

import './main.css';

const container = document.getElementById('app');

if (!container) {
    throw new Error('Container not found');
}

const tenOnTen = new TenOnTen({
    container,
});

// eslint-disable-next-line no-console
console.log('App is ready', tenOnTen);

initPlayGamaBridge();
