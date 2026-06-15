// ============================================================
// Script de migration CSV → Supabase
// Usage : node scripts/migrate-to-supabase.mjs
// Prérequis : SUPABASE_URL et SUPABASE_SERVICE_KEY dans .env.local
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BDD_DIR = join(__dirname, '..', 'BDD');

// Charger .env.local manuellement
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => l.split('=').map((v, i) => i === 0 ? v.trim() : v.trim()))
    .filter(([k]) => k)
);

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_KEY requis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Parser CSV simple ---
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  }).filter(row => Object.values(row).some(v => v !== ''));
}

function toNumber(val) {
  if (!val) return 0;
  const cleaned = String(val).replace(/[€\s]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function toBoolean(val) {
  return String(val).toLowerCase() === 'oui' || val === true;
}

function toDate(val) {
  if (!val || val.trim() === '') return null;
  // Gérer format DD/MM/YYYY
  const ddmm = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2,'0')}-${ddmm[1].padStart(2,'0')}`;
  return val || null;
}

// --- Migrations ---

async function migrateIUT() {
  const rows = parseCSV(join(BDD_DIR, 'Liste_IUT-Vue Générale.csv'));
  const data = rows.map(r => ({
    nom_iut: r['Nom IUT'] || '',
    referent_iut: r['Référent IUT'] || '',
    email_referent: r['Email référent'] || '',
    telephone_referent: r['Téléphone référent'] || '',
    statut_participation: r['Statut participation'] || 'En attente',
    date_confirmation: toDate(r['Date confirmation']),
    nombre_total_participants: parseInt(r['Nombre total participants']) || 0,
    nombre_spectateurs: parseInt(r['Nombre spectateurs']) || 0,
    transport_souhaite: r['Transport souhaité'] || '',
    hebergement_requis: r['Hébergement requis'] || '',
    budget_paye: toBoolean(r['Budget payé']),
    notes: r['Notes'] || null,
  }));
  const { error } = await supabase.from('liste_iut').insert(data);
  if (error) console.error('❌ IUT:', error.message);
  else console.log(`✅ IUT : ${data.length} lignes importées`);
}

async function migrateEquipes() {
  const rows = parseCSV(join(BDD_DIR, 'Liste_Equipes-Vue Générale.csv'));
  const data = rows.map(r => ({
    nom_equipe: r['Nom équipe'] || '',
    iut: r['IUT'] || '',
    poule_assignee: r['Poule assignée'] || null,
    statut_inscription: r['Statut inscription'] || 'Incomplète',
    tailles_maillots: r['Tailles maillots demandées'] || '',
    notes_equipe: r['Notes équipe'] || null,
    code_equipe: r['Code équipe'] || null,
    statut_validation: r['Statut validation'] || '',
    date_candidature: toDate(r['Date candidature']),
    capitaine_nom: r['Capitaine nom'] || '',
    capitaine_email: r['Capitaine email'] || '',
    capitaine_telephone: r['Capitaine téléphone'] || '',
    nombre_joueurs: parseInt(r['Nombre joueurs']) || 0,
    documents_valides: toBoolean(r['Documents validés']),
    motif_refus: r['Motif refus'] || null,
  }));
  const { error } = await supabase.from('liste_equipes').insert(data);
  if (error) console.error('❌ Equipes:', error.message);
  else console.log(`✅ Equipes : ${data.length} lignes importées`);
}

async function migrateParticipants() {
  const rows = parseCSV(join(BDD_DIR, 'Liste_Participants-Vue Générale.csv'));
  const data = rows
    .filter(r => r['Nom complet'])
    .map(r => ({
      nom_complet: r['Nom complet'] || '',
      iut: r['IUT'] || '',
      equipe_nom: r['Équipe'] || '',
      type: r['Type'] || 'Spectateur',
      email: r['Email'] || '',
      telephone: r['Téléphone'] || null,
      allergies_alimentaires: r['Allergies alimentaires'] || null,
      taille_maillot: r['Taille maillot'] || null,
      licence_sportive: r['Licence sportive'] || null,
      licence_validee: toBoolean(r['Licence validée']),
      transport: r['Transport'] || null,
      hebergement: r['Hébergement'] || 'Non',
      arrivee_confirmee: r['Arrivée confirmée'] || null,
      depart_confirme: toBoolean(r['Départ confirmé']),
    }));
  const { error } = await supabase.from('liste_participants').insert(data);
  if (error) console.error('❌ Participants:', error.message);
  else console.log(`✅ Participants : ${data.length} lignes importées`);
}

async function migrateMatchs() {
  const rows = parseCSV(join(BDD_DIR, 'Orga_Matchs-Vue Générale.csv'));
  const data = rows.map(r => ({
    id_match: r['ID Match']?.trim() || null,
    sport: r['Sport'] || '',
    phase: r['Phase'] || '',
    date: toDate(r['Date']),
    heure_debut: r['Heure debut'] || null,
    terrain: r['Terrain'] || '',
    equipe_a: r['Equipe A'] || 'À définir',
    equipe_b: r['Equipe B'] || 'À définir',
    score_a: r['Score A'] !== '' ? parseInt(r['Score A']) : null,
    score_b: r['Score B'] !== '' ? parseInt(r['Score B']) : null,
    statut: r['Statut'] || 'Programmé',
    notes: r['Notes'] || null,
  }));
  const { error } = await supabase.from('orga_matchs').insert(data);
  if (error) console.error('❌ Matchs:', error.message);
  else console.log(`✅ Matchs : ${data.length} lignes importées`);
}

async function migrateBudget() {
  const rows = parseCSV(join(BDD_DIR, 'Logi_Budget-Vue Générale.csv'));
  const data = rows.map(r => ({
    poste: r['Poste'] || 'Non renseigné',
    categorie: r['Catégorie'] || 'Autre',
    type: r['Type'] || 'Depense',
    montant_prevu: toNumber(r['Montant prévu']),
    montant_reel: toNumber(r['Montant réel']),
    statut_paiement: r['Statut paiement'] || 'Non renseigné',
  }));
  const { error } = await supabase.from('logi_budget').insert(data);
  if (error) console.error('❌ Budget:', error.message);
  else console.log(`✅ Budget : ${data.length} lignes importées`);
}

async function migrateTaches() {
  const rows = parseCSV(join(BDD_DIR, 'ToDo_List-Vue Générale.csv'));
  const data = rows
    .filter(r => r['Tâche'])
    .map(r => ({
      tache: r['Tâche'] || '',
      description: r['Description'] || '',
      responsable: r['Responsable'] || r['Nom complet (from Responsable)'] || '',
      statut: r['Statut'] || 'À faire',
      priorite: r['Priorité'] || '',
      deadline: toDate(r['Deadline']),
      categorie: r['Catégorie'] || '',
      notes: r['Notes'] || null,
    }));
  const { error } = await supabase.from('todo_list').insert(data);
  if (error) console.error('❌ Tâches:', error.message);
  else console.log(`✅ Tâches : ${data.length} lignes importées`);
}

async function migrateIncidents() {
  const rows = parseCSV(join(BDD_DIR, 'Sécurité_Incidents-Vue Générale.csv'));
  const data = rows.map(r => ({
    type_urgence: r['Type urgence'] || 'Autre',
    gravite: r['Gravité'] || '🟢 Faible',
    lieu: r['Lieu'] || '',
    description: r['Description'] || '',
    personne_concernee: r['Personne concernée'] || null,
    contact_signalant: r['Contact signalant'] || '',
    statut: r['Statut'] || 'Signalé',
    pris_en_charge_par: r['Pris en charge par'] || null,
    actions_prises: r['Actions prises'] || null,
    notes_internes: r['Notes internes'] || null,
    mot_urgence_utilise: toBoolean(r["Mot d'urgence utilisé"]),
  }));
  const { error } = await supabase.from('incidents_urgences').insert(data);
  if (error) console.error('❌ Incidents:', error.message);
  else console.log(`✅ Incidents : ${data.length} lignes importées`);
}

async function migrateObjets() {
  const rows = parseCSV(join(BDD_DIR, 'Objets_Perdus_Trouves-Vue Générale.csv'));
  const data = rows.map(r => ({
    type: r['Type'] || 'Perdu',
    objet: r['Objet'] || '',
    description: r['Description'] || '',
    couleur: r['Couleur'] || null,
    marque: r['Marque'] || null,
    lieu: r['Lieu'] || '',
    date_heure: r['Date/Heure'] || new Date().toISOString(),
    declare_par_nom: r['Déclaré par nom'] || '',
    declare_par_email: r['Déclaré par email'] || '',
    declare_par_telephone: r['Déclaré par téléphone'] || '',
    statut: r['Statut'] || 'En cours',
  }));
  const { error } = await supabase.from('objets_perdus_trouves').insert(data);
  if (error) console.error('❌ Objets perdus:', error.message);
  else console.log(`✅ Objets perdus : ${data.length} lignes importées`);
}

async function migrateVotes() {
  const rows = parseCSV(join(BDD_DIR, 'Votes_MVP-Vue Générale.csv'));
  const data = rows.map(r => ({
    sport: r['Sport'] || '',
    joueur_nomine: r['Joueur nominé'] || '',
    equipe: r['Équipe'] || '',
    nombre_votes: parseInt(r['Nombre votes']) || 0,
    position: parseInt(r['Position']) || 0,
    email_votants: '',
  }));
  const { error } = await supabase.from('votes_mvp').insert(data);
  if (error) console.error('❌ Votes MVP:', error.message);
  else console.log(`✅ Votes MVP : ${data.length} lignes importées`);
}

async function migrateDevis() {
  const rows = parseCSV(join(BDD_DIR, 'Devis_Pièces_Jointes-Vue Générale.csv'));
  const data = rows
    .filter(r => r['Titre'] || r['Assigné'])
    .map(r => ({
      titre: r['Titre'] || 'Sans titre',
      montant: toNumber(r['Montant']),
      assigne: r['Assigné'] || null,
      statut: r['Statut'] || 'En attente',
      date_reception: toDate(r['Date réception']),
      notes: r['Notes'] || null,
      pieces_jointes: [],
    }));
  if (!data.length) { console.log('ℹ️  Devis : aucune donnée à importer'); return; }
  const { error } = await supabase.from('devis_pieces_jointes').insert(data);
  if (error) console.error('❌ Devis:', error.message);
  else console.log(`✅ Devis : ${data.length} lignes importées`);
}

// --- Main ---
async function main() {
  console.log('🚀 Migration CSV → Supabase\n');
  await migrateIUT();
  await migrateEquipes();
  await migrateParticipants();
  await migrateMatchs();
  await migrateBudget();
  await migrateTaches();
  await migrateIncidents();
  await migrateObjets();
  await migrateVotes();
  await migrateDevis();
  console.log('\n✅ Migration terminée');
}

main().catch(console.error);
