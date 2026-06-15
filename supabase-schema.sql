-- ============================================================
-- SCHÉMA SUPABASE - Tournoi Inter-IUT Lorraine 2027
-- Supabase Dashboard > SQL Editor > New query > Coller + Run
-- ============================================================

CREATE TABLE IF NOT EXISTS liste_iut (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_iut TEXT NOT NULL DEFAULT '',
  referent_iut TEXT DEFAULT '',
  email_referent TEXT DEFAULT '',
  telephone_referent TEXT DEFAULT '',
  statut_participation TEXT DEFAULT 'En attente',
  date_confirmation DATE,
  nombre_total_participants INTEGER DEFAULT 0,
  nombre_spectateurs INTEGER DEFAULT 0,
  transport_souhaite TEXT DEFAULT '',
  hebergement_requis TEXT DEFAULT '',
  budget_paye BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS liste_equipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_equipe TEXT NOT NULL DEFAULT '',
  iut TEXT DEFAULT '',
  poule_assignee TEXT,
  statut_inscription TEXT DEFAULT 'Incomplète',
  tailles_maillots TEXT DEFAULT '',
  notes_equipe TEXT,
  code_equipe TEXT UNIQUE,
  statut_validation TEXT DEFAULT '',
  date_candidature DATE,
  capitaine_nom TEXT DEFAULT '',
  capitaine_email TEXT DEFAULT '',
  capitaine_telephone TEXT DEFAULT '',
  nombre_joueurs INTEGER DEFAULT 0,
  documents_valides BOOLEAN DEFAULT FALSE,
  motif_refus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS liste_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_complet TEXT NOT NULL DEFAULT '',
  iut TEXT DEFAULT '',
  equipe_nom TEXT DEFAULT '',
  type TEXT DEFAULT 'Spectateur',
  email TEXT DEFAULT '',
  telephone TEXT,
  allergies_alimentaires TEXT,
  taille_maillot TEXT,
  licence_sportive TEXT,
  licence_validee BOOLEAN DEFAULT FALSE,
  transport TEXT DEFAULT '',
  hebergement TEXT DEFAULT 'Non',
  arrivee_confirmee TEXT DEFAULT NULL,
  depart_confirme BOOLEAN DEFAULT FALSE,
  mot_de_passe_benevole TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orga_matchs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_match TEXT UNIQUE,
  sport TEXT DEFAULT '',
  phase TEXT DEFAULT '',
  date DATE,
  heure_debut TIME,
  terrain TEXT DEFAULT '',
  equipe_a TEXT DEFAULT 'À définir',
  equipe_b TEXT DEFAULT 'À définir',
  score_a INTEGER,
  score_b INTEGER,
  statut TEXT DEFAULT 'Programmé',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logi_budget (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poste TEXT DEFAULT 'Non renseigné',
  categorie TEXT DEFAULT 'Autre',
  type TEXT DEFAULT 'Depense',
  montant_prevu NUMERIC DEFAULT 0,
  montant_reel NUMERIC DEFAULT 0,
  statut_paiement TEXT DEFAULT 'Non renseigné',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS todo_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tache TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  responsable TEXT DEFAULT '',
  statut TEXT DEFAULT 'À faire',
  priorite TEXT DEFAULT '',
  deadline DATE,
  categorie TEXT DEFAULT '',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents_urgences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_urgence TEXT DEFAULT 'Autre',
  gravite TEXT DEFAULT '🟢 Faible',
  lieu TEXT DEFAULT '',
  description TEXT DEFAULT '',
  personne_concernee TEXT,
  contact_signalant TEXT DEFAULT '',
  statut TEXT DEFAULT 'Signalé',
  pris_en_charge_par TEXT,
  actions_prises TEXT,
  date_resolution TIMESTAMPTZ,
  notes_internes TEXT,
  mot_urgence_utilise BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS objets_perdus_trouves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT DEFAULT 'Perdu',
  objet TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  couleur TEXT,
  marque TEXT,
  lieu TEXT DEFAULT '',
  date_heure TIMESTAMPTZ DEFAULT NOW(),
  declare_par_nom TEXT DEFAULT '',
  declare_par_email TEXT DEFAULT '',
  declare_par_telephone TEXT DEFAULT '',
  statut TEXT DEFAULT 'En cours',
  correspondance_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes_mvp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sport TEXT DEFAULT '',
  joueur_nomine TEXT NOT NULL DEFAULT '',
  equipe TEXT DEFAULT '',
  nombre_votes INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  email_votants TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devis_pieces_jointes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL DEFAULT '',
  montant NUMERIC DEFAULT 0,
  assigne TEXT,
  statut TEXT DEFAULT 'En attente',
  date_reception DATE,
  notes TEXT,
  pieces_jointes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS désactivé : sécurité gérée côté Next.js API routes
ALTER TABLE liste_iut DISABLE ROW LEVEL SECURITY;
ALTER TABLE liste_equipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE liste_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE orga_matchs DISABLE ROW LEVEL SECURITY;
ALTER TABLE logi_budget DISABLE ROW LEVEL SECURITY;
ALTER TABLE todo_list DISABLE ROW LEVEL SECURITY;
ALTER TABLE incidents_urgences DISABLE ROW LEVEL SECURITY;
ALTER TABLE objets_perdus_trouves DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes_mvp DISABLE ROW LEVEL SECURITY;
ALTER TABLE devis_pieces_jointes DISABLE ROW LEVEL SECURITY;
