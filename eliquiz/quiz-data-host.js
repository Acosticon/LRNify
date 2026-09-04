// SIKKER FASIT-MODUL — kun for /host.
// Denne filen inneholder riktige svar og skal ALDRI importeres fra
// spiller- eller storskjerm-visningen. app.js henter den kun via
// dynamic import() når ruten er "host", slik at telefonene aldri
// laster ned dette innholdet over nettet.

export const SONGS = [
  // Adele-sporet er byttet ut med Rolling in the Deep (samme artist).
  {id:1, year:2011, title:'Rolling in the Deep', artist:'Adele',
   acceptedArtists:['adele'], acceptedTitles:['rolling in the deep'],
   spotifyTrackId:'4OSBTYWVwsQhGLF9NHvIbR', isrc:'GBBKS1000335', startMs:32000, durationMs:30000},

  {id:2, year:2012, title:'Beauty and a Beat', artist:'Justin Bieber ft. Nicki Minaj',
   acceptedArtists:['justin bieber','nicki minaj','justin bieber ft nicki minaj','justin bieber feat nicki minaj'],
   acceptedTitles:['beauty and a beat'],
   spotifyTrackId:'190jyVPHYjAqEaOGmMzdyk', isrc:'USUM71205367', startMs:32000, durationMs:30000},

  {id:3, year:2013, title:'Let It Go', artist:'Idina Menzel (Frozen)',
   acceptedArtists:['idina menzel','frozen'], acceptedTitles:['let it go'],
   spotifyTrackId:'0fV2amYOT8Z1QBkgsIjWSl', isrc:'USWD11366376', startMs:90000, durationMs:30000},

  {id:4, year:2014, title:'Uptown Funk', artist:'Mark Ronson ft. Bruno Mars',
   acceptedArtists:['mark ronson','bruno mars','mark ronson ft bruno mars','mark ronson feat bruno mars'],
   acceptedTitles:['uptown funk'],
   spotifyTrackId:'32OlwWuMpZ6b0aN2RZOeMS', isrc:'GBARL1401524', startMs:44000, durationMs:31000},

  {id:5, year:2015, title:'Elektrisk', artist:'Marcus & Martinus ft. Katastrofe',
   acceptedArtists:['marcus & martinus','marcus og martinus','marcus martinus','m&m','katastrofe','marcus & martinus ft katastrofe'],
   acceptedTitles:['elektrisk'],
   spotifyTrackId:'2q83iIfEGIk8kyrdT4uYOG', isrc:'NOAJR1500029', startMs:0, durationMs:30000},

  {id:6, year:2016, title:"How Far I'll Go", artist:"Auli'i Cravalho (Moana)",
   acceptedArtists:["auli'i cravalho",'aulii cravalho','moana','vaiana','disney'],
   acceptedTitles:["how far i'll go",'how far ill go'],
   spotifyTrackId:'3KzemxaWSSiYtnzOokd0Rs', isrc:'USWD11677855', startMs:98000, durationMs:30000},

  {id:7, year:2017, title:'A Million Dreams', artist:'The Greatest Showman (Hugh Jackman m.fl.)',
   acceptedArtists:['the greatest showman','hugh jackman','michelle williams','ziv zaifman'],
   acceptedTitles:['a million dreams'],
   spotifyTrackId:'0z4ykNDRfUH9Wealqynkcl', isrc:'USAT21704617', startMs:28000, durationMs:30000},

  {id:8, year:2018, title:'Shallow', artist:'Lady Gaga & Bradley Cooper',
   acceptedArtists:['lady gaga','bradley cooper','lady gaga & bradley cooper','lady gaga og bradley cooper'],
   acceptedTitles:['shallow'],
   spotifyTrackId:'2VxeLyX666F8uXCJ0dZF8B', isrc:'USUM71813192', startMs:0, durationMs:30000},

  {id:9, year:2019, title:'Dance Monkey', artist:'Tones and I',
   acceptedArtists:['tones and i','tones & i','tones'], acceptedTitles:['dance monkey'],
   spotifyTrackId:'2XU0oxnq2qxCpomAAuJY8K', isrc:'QZES71982312', startMs:9000, durationMs:30000},

  {id:10, year:2020, title:'Blinding Lights', artist:'The Weeknd',
   acceptedArtists:['the weeknd','weeknd'], acceptedTitles:['blinding lights'],
   spotifyTrackId:'0VjIjW4GlUZAMYd2vXMi3b', isrc:'USUG11904206', startMs:60000, durationMs:30000},

  {id:11, year:2021, title:"We Don't Talk About Bruno", artist:'Encanto (Carolina Gaitán m.fl.)',
   acceptedArtists:['encanto','encanto cast','cast of encanto','carolina gaitan','mauro castillo','adassa','rhenzy feliz','diane guerrero','stephanie beatriz'],
   acceptedTitles:["we don't talk about bruno",'we dont talk about bruno'],
   spotifyTrackId:'52xJxFP6TqMuO4Yt0eOkMz', isrc:'USWD12112915', startMs:0, durationMs:30000},

  {id:12, year:2022, title:'As It Was', artist:'Harry Styles',
   acceptedArtists:['harry styles'], acceptedTitles:['as it was'],
   spotifyTrackId:'4Dvkj6JhhA12EX05fT7y2e', isrc:'USSM12200612', startMs:0, durationMs:30000},

  {id:13, year:2023, title:'Italia', artist:'UNDERGRUNN',
   acceptedArtists:['undergrunn','ug'], acceptedTitles:['italia'],
   spotifyTrackId:'3h2IRgTZrU4hSNCePszT23', isrc:'NO2DY2200124', startMs:53000, durationMs:30000},

  {id:14, year:2024, title:'Please Please Please', artist:'Sabrina Carpenter',
   acceptedArtists:['sabrina carpenter'], acceptedTitles:['please please please'],
   spotifyTrackId:'5N3hjp1WNayUPZrA8kJmJP', isrc:'USUM72404101', startMs:0, durationMs:30000},

  {id:15, year:2025, title:'Eli', artist:'Tobias Sten',
   acceptedArtists:['tobias sten'], acceptedTitles:['eli'],
   spotifyTrackId:'5iw7PzTQdsg2FVhR14cgGw', isrc:'NOUM72500052', startMs:115000, durationMs:34000},

  // Rettet artist/spor-ID for Kygo Jo (Kygo; Flow Kingz; JMK; Lyng).
  {id:16, year:2026, title:'Kygo Jo (feat. Lyng) – Kygo Remix', artist:'Kygo; Flow Kingz; JMK; Lyng',
   acceptedArtists:['kygo','lyng','jmk','flow kingz','kygo lyng','kygo & lyng','kygo og lyng','flow kingz lyng','flow kingz og lyng'],
   acceptedTitles:['kygo jo','kygo jo kygo remix','kygo jo feat lyng'],
   spotifyTrackId:'3ExrDwHbhBZYurE2AOC1rL', isrc:'SEBGA2600886', startMs:51000, durationMs:30000},
];

// Rekkefølgen sangene spilles i under Del 1 (musikkquizen) — vilkårlig
// trukket, uavhengig av årstall. Verdiene er song-id-er fra listen over.
// Del 2 (tidslinjefinalen) bruker samme 16 sangene, men aldri denne
// rekkefølgen — der plasserer lagene dem fritt på årstall.
export const PLAY_ORDER = [14,10,7,2,15,9,5,11,16,4,8,6,13,12,1,3];

export const TIEBREAKER = {
  artist:'ABBA', title:'The Winner Takes It All', year:1980,
  acceptedArtists:['abba'], acceptedTitles:['the winner takes it all'],
};

export const SPOTIFY_PLAYLIST_ID = '27HKy9MfoN8dN09TLKezCY';

const songById = new Map(SONGS.map(s=>[s.id,s]));
export function songForRound(roundIndex){ return songById.get(PLAY_ORDER[roundIndex]); }
export function songById_(id){ return songById.get(Number(id)); }

function normalize(s=''){
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/&/g,' og ').replace(/[^a-z0-9æøå ]/g,' ')
    .replace(/\b(and|feat|featuring|ft)\b/g,' ').replace(/\s+/g,' ').trim();
}
function matches(input, accepted){
  const n = normalize(input);
  if(!n) return false;
  return accepted.some(a=>normalize(a)===n);
}
export function scoreAnswer(song, answer={}){
  return {
    artistCorrect: matches(answer.artist, song.acceptedArtists),
    titleCorrect: matches(answer.title, song.acceptedTitles),
  };
}
export function scoreTiebreaker(answer={}){
  return matches(answer.artist, TIEBREAKER.acceptedArtists)
    && matches(answer.title, TIEBREAKER.acceptedTitles)
    && Number(answer.year) === TIEBREAKER.year;
}
