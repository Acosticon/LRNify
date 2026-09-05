// SIKKER FASIT-MODUL — kun for /host.
// Denne filen inneholder riktige svar og skal ALDRI importeres fra
// spiller- eller storskjerm-visningen. app.js henter den kun via
// dynamic import() når ruten er "host", slik at telefonene aldri
// laster ned dette innholdet over nettet.
//
// PLASSHOLDERE — dette er 16 tomme sanger, ett år hver fra 2011 til 2026.
// Bytt ut title/artist/spotifyTrackId/startMs/durationMs/de aksepterte
// listene under med den ekte spillelisten når den er klar. Resten av
// appen (avspilling, retting, tidslinjefinale) fungerer uendret.

export const SONGS = Array.from({ length: 16 }, (_, i) => {
  const id = i + 1;
  const year = 2010 + id; // id 1 -> 2011 … id 16 -> 2026
  return {
    id, year,
    title: `Sang ${id}`,
    artist: `Artist ${id}`,
    acceptedArtists: [`artist ${id}`],
    acceptedTitles: [`sang ${id}`],
    spotifyTrackId: '', // fylles inn med ekte Spotify track-ID
    isrc: '',
    startMs: 0,
    durationMs: 30000,
  };
});

// Rekkefølgen sangene spilles i under musikkrunden — bytt ut når den
// ekte spillelisten er klar, uavhengig av årstall.
export const PLAY_ORDER = SONGS.map(s => s.id);

const songById = new Map(SONGS.map(s => [s.id, s]));
export function songForRound(roundIndex) { return songById.get(PLAY_ORDER[roundIndex]); }
export function songById_(id) { return songById.get(Number(id)); }

function normalize(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' og ').replace(/[^a-z0-9æøå ]/g, ' ')
    .replace(/\b(and|feat|featuring|ft)\b/g, ' ').replace(/\s+/g, ' ').trim();
}
function matches(input, accepted) {
  const n = normalize(input);
  if (!n) return false;
  return accepted.some(a => normalize(a) === n);
}
export function scoreAnswer(song, answer = {}) {
  return {
    artistCorrect: matches(answer.artist, song.acceptedArtists),
    titleCorrect: matches(answer.title, song.acceptedTitles),
  };
}
