/* =========================================================
   SHAPES — alle brikkeformene spillet kan trekke fra tralla.
   Hver form er en liste med [rad, kolonne]-offset, normalisert
   slik at minste rad/kolonne er 0. `weight` styrer hvor ofte
   formen dukker opp — små former er vanligere enn store.
   Ingen rotasjon i spillet: hver orientering ligger som sin
   egen form her, akkurat som i det klassiske forbildet.
   ========================================================= */

export const SHAPES = [
  // -- 1 rute --
  { id: 'dot', weight: 6, cells: [[0, 0]] },

  // -- 2 ruter --
  { id: 'domino-h', weight: 10, cells: [[0, 0], [0, 1]] },
  { id: 'domino-v', weight: 10, cells: [[0, 0], [1, 0]] },

  // -- 3 ruter, rett linje --
  { id: 'tri-h', weight: 10, cells: [[0, 0], [0, 1], [0, 2]] },
  { id: 'tri-v', weight: 10, cells: [[0, 0], [1, 0], [2, 0]] },

  // -- 3 ruter, vinkel (tromino-L, 4 orienteringer) --
  { id: 'tri-corner-1', weight: 8, cells: [[0, 0], [1, 0], [1, 1]] },
  { id: 'tri-corner-2', weight: 8, cells: [[0, 0], [0, 1], [1, 0]] },
  { id: 'tri-corner-3', weight: 8, cells: [[0, 0], [0, 1], [1, 1]] },
  { id: 'tri-corner-4', weight: 8, cells: [[0, 1], [1, 0], [1, 1]] },

  // -- 4 ruter, rett linje --
  { id: 'tetra-i-h', weight: 6, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: 'tetra-i-v', weight: 6, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },

  // -- 4 ruter, kvadrat --
  { id: 'tetra-square', weight: 9, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },

  // -- 4 ruter, T (4 orienteringer) --
  { id: 'tetra-t-1', weight: 6, cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: 'tetra-t-2', weight: 6, cells: [[0, 1], [1, 0], [1, 1], [2, 1]] },
  { id: 'tetra-t-3', weight: 6, cells: [[1, 0], [1, 1], [1, 2], [0, 1]] },
  { id: 'tetra-t-4', weight: 6, cells: [[0, 0], [1, 0], [1, 1], [2, 0]] },

  // -- 4 ruter, S/Z (4 orienteringer) --
  { id: 'tetra-s-1', weight: 5, cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  { id: 'tetra-s-2', weight: 5, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { id: 'tetra-z-1', weight: 5, cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  { id: 'tetra-z-2', weight: 5, cells: [[0, 1], [1, 0], [1, 1], [2, 0]] },

  // -- 4 ruter, L/J (4 orienteringer hver) --
  { id: 'tetra-l-1', weight: 5, cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { id: 'tetra-l-2', weight: 5, cells: [[0, 0], [0, 1], [0, 2], [1, 0]] },
  { id: 'tetra-l-3', weight: 5, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  { id: 'tetra-l-4', weight: 5, cells: [[1, 0], [1, 1], [1, 2], [0, 2]] },
  { id: 'tetra-j-1', weight: 5, cells: [[0, 1], [1, 1], [2, 0], [2, 1]] },
  { id: 'tetra-j-2', weight: 5, cells: [[0, 0], [1, 0], [1, 1], [1, 2]] },
  { id: 'tetra-j-3', weight: 5, cells: [[0, 0], [0, 1], [1, 0], [2, 0]] },
  { id: 'tetra-j-4', weight: 5, cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },

  // -- 5 ruter, rett linje --
  { id: 'penta-i-h', weight: 3, cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { id: 'penta-i-v', weight: 3, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },

  // -- 5 ruter, hjørne (stor L, 4 orienteringer) --
  { id: 'penta-corner-1', weight: 3, cells: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]] },
  { id: 'penta-corner-2', weight: 3, cells: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
  { id: 'penta-corner-3', weight: 3, cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
  { id: 'penta-corner-4', weight: 3, cells: [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]] },

  // -- 5 ruter, pluss --
  { id: 'penta-plus', weight: 3, cells: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] },

  // -- 9 ruter, stort kvadrat (sjelden) --
  { id: 'nona-square', weight: 1, cells: [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
    [2, 0], [2, 1], [2, 2]
  ] }
];
