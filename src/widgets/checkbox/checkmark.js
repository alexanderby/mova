import {svg} from '../../utils/dom.js';

function rect(x, y) {
    return svg('rect', {x, y, width: 1, height: 1})
}

function iconOn() {
    const x0 = 1;
    const y0 = 3;
    const coords = [
        [x0, y0],
        [x0 + 1, y0 + 1],
        [x0 + 2, y0 + 2],
        [x0 + 3, y0 + 1],
        [x0 + 4, y0],
        [x0 + 5, y0 - 1],
    ];
    return svg('g', {class: 'checkmark__on'},
        ...coords.map(([x, y]) => rect(x, y)),
    );
}

function iconOff() {
    let x = 3.5;
    const y = 3.5;
    const coords = [
        [x - 2, y - 2],
        [x - 2, y + 2],
        [x - 1, y - 1],
        [x - 1, y + 1],
        [x, y],
        [x + 1, y - 1],
        [x + 1, y + 1],
        [x + 2, y - 2],
        [x + 2, y + 2],
    ];
    return svg('g', {class: 'checkmark__off'},
        ...coords.map(([x, y]) => rect(x, y)),
    );
}

export default function checkmark() {
    return svg('svg', {class: 'checkmark', viewBox: '0 0 8 8'},
        iconOn(),
        iconOff(),
    );
}
