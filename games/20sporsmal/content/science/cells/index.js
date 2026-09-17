/* Innholdspakke: Naturfag → Celler.
   Dette er kontrakten en content-pakke må oppfylle for å kunne
   registreres i content-manifest.js — se README.md for hvordan man
   legger til et nytt fag/tema etter denne malen. */
import { PROPERTIES } from './properties.js';
import { CONCEPTS } from './concepts.js';
import { QUESTIONS } from './questions.js';

export const topicId = 'cells';
export const topicName = 'Celler';
export const subjectId = 'science';
export const subjectName = 'Naturfag';
export const properties = PROPERTIES;
export const concepts = CONCEPTS;
export const questions = QUESTIONS;
