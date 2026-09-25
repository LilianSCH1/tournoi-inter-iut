-- ============================================================
-- Migration 0001 — Suppression des tables Votes MVP / Objets perdus
-- ============================================================
-- Contexte : ces deux tables avaient un data layer complet
-- (lib/data/votes.ts, lib/data/objets-perdus.ts) mais aucune route API ni
-- aucune page ne les exposait. Le code correspondant a été retiré du
-- dépôt (décision validée le 2026-06-18 : fonctionnalités à reconstruire
-- plus tard si besoin plutôt qu'à maintenir en l'état).
--
-- À EXÉCUTER MANUELLEMENT dans Supabase Dashboard > SQL Editor.
-- Aucune autre table ni donnée n'est affectée par ce script.
-- Si tu veux d'abord vérifier qu'elles sont bien vides avant de les
-- supprimer, lance séparément :
--   SELECT count(*) FROM votes_mvp;
--   SELECT count(*) FROM objets_perdus_trouves;
-- ============================================================

DROP TABLE IF EXISTS votes_mvp;
DROP TABLE IF EXISTS objets_perdus_trouves;
