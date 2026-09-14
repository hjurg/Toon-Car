const fs = require('fs');
let tracks = fs.readFileSync('src/game/tracks.ts', 'utf-8');
const newTracksDef = fs.readFileSync('/tmp/new_tracks.ts', 'utf-8');

tracks = tracks.replace(/export const TRACK_DEFINITIONS: TrackDefinition\[\] = \[[^]*?\];/, newTracksDef);
fs.writeFileSync('src/game/tracks.ts', tracks);
