/* =========================================================
   KONFIGURASJON
   Alle tall som skal kunne justeres uten å røre logikken.
   GDD pkt. 3, 8 og 19: terskel og sannsynligheter skal være
   enkle å endre senere.
   ========================================================= */

export const CONFIG = {
  /* ARBEIDSTITTEL — erstattes i designprosessen. Endres her og i
     <title>/meta i index.html, samt i GAMES-lista på forsiden. */
  tittel: 'Feltboka',
  undertittel: 'Du undersøker norsk natur.',

  /* Hvor mange riktige svar som kreves per funn (GDD pkt. 3). */
  riktigePerFunn: 10,

  /* Belønningsskjermen (GDD pkt. 19): hele hendelsen skal ta 3–5 s. */
  funn: {
    autolukkMs: 4000,   // 0 slår av autolukking, eleven må trykke selv
    minVisningMs: 900   // knappen er død så lenge, så man ikke klikker forbi funnet
  },

  /* Hvor lenge «Ikke helt – prøv igjen» blir stående. */
  feilmeldingMs: 1400,

  /* localStorage-nøkkel. Bumpes når skjemaet endres på en måte
     gammel lagring ikke tåler — se progress.js. */
  lagringsnokkel: 'feltboka-v1'
};
