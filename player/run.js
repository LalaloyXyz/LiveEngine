#!/usr/bin/env -S gjs -m
/* 
 * This script runs multiple GTK windows with video output
 * one per each monitor
*/
import PlayerMulti from './player.js';

// Exported so the extension's static dependency graph includes this child
// process and its player dependencies.
export const PLAYER_ENTRYPOINT = true;

if (ARGV.length === 7) {
    const player = new PlayerMulti({
        path:          ARGV[0],
        scalingMode:   parseInt(ARGV[1]),
        loop:          ARGV[2] === 'true',
        volume:        parseFloat(ARGV[3]),
        useVideorate:  ARGV[4] === 'true',
        framerate:     parseInt(ARGV[5]),
        colorAccurate: ARGV[6] === 'true'
    });
    player.run();
}
