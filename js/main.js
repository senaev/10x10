require.config({
    baseUrl: 'js/',
    paths: {
        'jquery': 'jquery-1.11.1.min',
        'tenOnTen': 'tenOnTen',
        'cube': 'cube',
        'cubes': 'cubes',
        'data': 'data',
        'movemap': 'moveMap'
    }
});

require(['jquery', 'tenOnTen', 'cube', 'cubes', 'data'], function ($, TenOnTen, Cube, cubes, data) {
    var tenOnTen = new TenOnTen({
        appContainer: "#app"
    });
});