-- ============================================================
-- Migration 0002 — Valider rétroactivement les équipes historiques
-- ============================================================
-- Contexte : la nouvelle colonne statut_validation (ajoutée en code le
-- 2026-06-19, colonne déjà présente dans le schéma depuis le début) est
-- vide ('') pour toutes les équipes importées depuis l'ancien export
-- Airtable. Le code interprète une valeur vide comme "En attente", ce qui
-- a deux effets :
--   1. Cosmétique : ces équipes sont mises en évidence comme candidatures
--      en attente dans l'onglet Équipes, alors qu'elles sont déjà actives.
--   2. BLOQUANT : le login joueur (lib/auth.ts#authenticateJoueur) refuse
--      désormais toute équipe dont statutValidation !== 'Validée'. Les
--      codes équipe déjà distribués (voir CREDENTIALS.md) cesseraient de
--      fonctionner tant que cette migration n'est pas appliquée.
--
-- À EXÉCUTER MANUELLEMENT dans Supabase Dashboard > SQL Editor, dès que
-- possible si des codes équipe existants sont déjà en circulation.
-- N'affecte que les équipes qui ont déjà un code_equipe assigné (donc déjà
-- opérationnelles) ET aucun statut de validation renseigné.
-- ============================================================

UPDATE liste_equipes
SET statut_validation = 'Validée'
WHERE (statut_validation IS NULL OR statut_validation = '')
  AND code_equipe IS NOT NULL
  AND code_equipe <> '';
