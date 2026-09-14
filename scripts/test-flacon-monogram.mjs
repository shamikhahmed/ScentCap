import assert from 'node:assert/strict';
import { flaconInitials, flaconEtchedLabel } from '../src/lib/flaconMonogram.ts';

assert.equal(flaconInitials('Dolce & Gabbana'), 'DG');
assert.equal(flaconInitials('Maison Francis Kurkdjian'), 'MFK');
assert.equal(flaconInitials('Yves Saint Laurent'), 'YSL');
assert.equal(flaconInitials('Le Labo'), 'L');
assert.equal(flaconInitials('Acqua di Parma'), 'AP');
assert.ok(flaconEtchedLabel('Maison Francis Kurkdjian').length <= 14);
console.log('flacon monogram tests: ok');
