import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime } from '../src/utils/time.js';

test('formatTime: MM:SS.cc に整形する', () => {
    assert.equal(formatTime(0), '00:00.00');
    assert.equal(formatTime(1234), '00:01.23');
    assert.equal(formatTime(61999), '01:01.99');
    assert.equal(formatTime(3600000 + 5000), '60:05.00'); // 60 分以上も分で表す
});
