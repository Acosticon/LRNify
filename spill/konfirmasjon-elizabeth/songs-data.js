// HEMMELIG fasit for Elizabeths konfirmasjonsquiz.
//
// VIKTIG: denne filen skal ALDRI importeres av play.html — den inneholder
// riktige svar og godkjente alternativer, og lastes derfor bare av
// host.html (som retter svar) og screen.html (som viser fasiten etter at
// verten har åpnet den). Spillernes mobiler ser aldri dette innholdet.
//
// Rekkefølgen sangene står i her under (SONGS) er bare sang-id-en som
// brukes i tidslinjefinalen — id 5 er alltid tidslinjekortet for 2015,
// uansett hvilken runde den spilles i musikkquizen. Rundenummeret i
// musikkquizen (1–16) er en EGEN, stokket rekkefølge — se ROUND_ORDER og
// songForRound() nederst i fila. Ikke bland disse to sammen.
//
// spotifyTrackId/startMs/durationMs settes av verten i host.html (lagres
// lokalt på vertens maskin, se KONF_SPOTIFY_OVERRIDES i localStorage) —
// feltene her er bare defaultverdier.

export const SONGS = [
  {
    id: 1, year: 2011,
    artist: 'Adele', title: 'Rolling in the Deep',
    acceptedArtists: ['adele'],
    acceptedTitles: ['rolling in the deep'],
    spotifyTrackId: '4OSBTYWVwsQhGLF9NHvIbR', startMs: 32000, durationMs: 30000
  },
  {
    id: 2, year: 2012,
    artist: 'Justin Bieber ft. Nicki Minaj', title: 'Beauty and a Beat',
    acceptedArtists: ['justin bieber', 'justin bieber ft nicki minaj', 'justin bieber feat nicki minaj', 'nicki minaj'],
    acceptedTitles: ['beauty and a beat', 'beauty and the beat'],
    spotifyTrackId: '190jyVPHYjAqEaOGmMzdyk', startMs: 32000, durationMs: 30000
  },
  {
    id: 3, year: 2013,
    artist: 'Idina Menzel (Frozen)', title: 'Let It Go',
    acceptedArtists: ['idina menzel', 'frozen', 'frost'],
    acceptedTitles: ['let it go', 'la det ga'],
    spotifyTrackId: '0fV2amYOT8Z1QBkgsIjWSl', startMs: 90000, durationMs: 30000
  },
  {
    id: 4, year: 2014,
    artist: 'Mark Ronson ft. Bruno Mars', title: 'Uptown Funk',
    acceptedArtists: ['mark ronson', 'mark ronson ft bruno mars', 'bruno mars'],
    acceptedTitles: ['uptown funk'],
    spotifyTrackId: '32OlwWuMpZ6b0aN2RZOeMS', startMs: 44000, durationMs: 31000
  },
  {
    id: 5, year: 2015,
    artist: 'Marcus & Martinus ft. Katastrofe', title: 'Elektrisk',
    acceptedArtists: ['marcus and martinus', 'marcus martinus', 'marcus and martinus ft katastrofe', 'katastrofe'],
    acceptedTitles: ['elektrisk'],
    spotifyTrackId: '2q83iIfEGIk8kyrdT4uYOG', startMs: 0, durationMs: 30000
  },
  {
    id: 6, year: 2016,
    artist: "Auli'i Cravalho (Moana)", title: "How Far I'll Go",
    acceptedArtists: ['aulii cravalho', 'moana', 'vaiana', 'disney'],
    acceptedTitles: ['how far ill go', "how far i'll go"],
    spotifyTrackId: '3KzemxaWSSiYtnzOokd0Rs', startMs: 98000, durationMs: 30000
  },
  {
    id: 7, year: 2017,
    artist: 'Hugh Jackman, Michelle Williams & Ziv Zaifman', title: 'A Million Dreams',
    acceptedArtists: ['hugh jackman', 'michelle williams', 'ziv zaifman', 'the greatest showman', 'greatest showman cast'],
    acceptedTitles: ['a million dreams'],
    spotifyTrackId: '0z4ykNDRfUH9Wealqynkcl', startMs: 28000, durationMs: 30000
  },
  {
    id: 8, year: 2018,
    artist: 'Lady Gaga & Bradley Cooper', title: 'Shallow',
    acceptedArtists: ['lady gaga', 'lady gaga and bradley cooper', 'bradley cooper'],
    acceptedTitles: ['shallow'],
    spotifyTrackId: '2VxeLyX666F8uXCJ0dZF8B', startMs: 0, durationMs: 30000
  },
  {
    id: 9, year: 2019,
    artist: 'Tones and I', title: 'Dance Monkey',
    acceptedArtists: ['tones and i', 'tones & i'],
    acceptedTitles: ['dance monkey'],
    spotifyTrackId: '2XU0oxnq2qxCpomAAuJY8K', startMs: 9000, durationMs: 30000
  },
  {
    id: 10, year: 2020,
    artist: 'The Weeknd', title: 'Blinding Lights',
    acceptedArtists: ['the weeknd', 'weeknd'],
    acceptedTitles: ['blinding lights'],
    spotifyTrackId: '0VjIjW4GlUZAMYd2vXMi3b', startMs: 60000, durationMs: 30000
  },
  {
    id: 11, year: 2021,
    artist: 'Encanto Cast', title: "We Don't Talk About Bruno",
    acceptedArtists: [
      'encanto', 'encanto cast', 'cast of encanto', 'lin manuel miranda',
      'carolina gaitan', 'mauro castillo', 'adassa', 'rhenzy feliz', 'diane guerrero', 'stephanie beatriz'
    ],
    acceptedTitles: ["we dont talk about bruno", "we don't talk about bruno"],
    spotifyTrackId: '52xJxFP6TqMuO4Yt0eOkMz', startMs: 0, durationMs: 30000
  },
  {
    id: 12, year: 2022,
    artist: 'Harry Styles', title: 'As It Was',
    acceptedArtists: ['harry styles'],
    acceptedTitles: ['as it was'],
    spotifyTrackId: '4Dvkj6JhhA12EX05fT7y2e', startMs: 0, durationMs: 30000
  },
  {
    id: 13, year: 2023,
    artist: 'UNDERGRUNN', title: 'Italia',
    acceptedArtists: ['undergrunn'],
    acceptedTitles: ['italia'],
    spotifyTrackId: '3h2IRgTZrU4hSNCePszT23', startMs: 53000, durationMs: 30000
  },
  {
    id: 14, year: 2024,
    artist: 'DJ MøMø ft. Kjartan Lauritzen', title: 'Badebussen',
    acceptedArtists: ['dj momo', 'dj mømø', 'kjartan lauritzen'],
    acceptedTitles: ['badebussen'],
    spotifyTrackId: '5F8c71PbayLIedqmjskrhM', startMs: 0, durationMs: 30000
  },
  {
    id: 15, year: 2025,
    artist: 'Tobias Sten', title: 'Eli',
    acceptedArtists: ['tobias sten'],
    acceptedTitles: ['eli'],
    spotifyTrackId: '5iw7PzTQdsg2FVhR14cgGw', startMs: 115000, durationMs: 34000
  },
  {
    id: 16, year: 2026,
    artist: 'Kygo, Flow Kingz, JMK & Lyng', title: 'Kygo Jo (feat. Lyng) - Kygo Remix',
    acceptedArtists: ['kygo', 'flow kingz', 'jmk', 'lyng'],
    acceptedTitles: ['kygo jo'],
    spotifyTrackId: '3ExrDwHbhBZYurE2AOC1rL', startMs: 51000, durationMs: 30000
  }
];

// Rekkefølgen sangene spilles i under selve musikkquizen (runde 1–16).
// Med vilje IKKE kronologisk — det ville vært forutsigbart og kjedelig.
// Dette er sang-id-er (se SONGS over), ikke årstall. Tidslinjefinalen
// bruker fortsatt de ekte årstallene (2011–2026), uavhengig av denne
// rekkefølgen.
export const ROUND_ORDER = [9, 3, 14, 6, 1, 11, 5, 16, 8, 2, 13, 7, 10, 4, 15, 12];

// Sangen som spilles i musikkquiz-runde N (1–16).
export function songForRound(round) {
  return SONGS[ROUND_ORDER[round - 1] - 1];
}

export const TIEBREAKER_SONG = {
  artist: 'ABBA', title: 'The Winner Takes It All', year: 1980,
  acceptedArtists: ['abba'],
  acceptedTitles: ['the winner takes it all'],
  spotifyTrackId: '', startMs: 0, durationMs: 30000
};
