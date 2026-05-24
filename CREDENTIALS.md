# 🔐 CREDENTIALS & ACCÈS

## 📋 COMPTES DE TEST

### 👤 JOUEURS (Connexion par code équipe)

**Format :** `IUT-EQUIPE-2027`

**Codes disponibles :**
```
NANCY-ALPHA-2027          (Nancy-Charlemagne Alpha)
NANCY-BETA-2027           (Nancy-Charlemagne Beta)
METZ-WARRIORS-2027        (Metz Warriors)
METZ-LEGENDS-2027         (Metz Legends)
BRABOIS-PANTHERS-2027     (Brabois Panthers)
BRABOIS-TIGERS-2027       (Brabois Tigers)
STDIE-LOCALS-2027         (Saint-Dié Locals)
STDIE-ALLSTARS-2027       (Saint-Dié All-Stars)
THIONVILLE-ROCKETS-2027   (Thionville Rockets)
THIONVILLE-STORM-2027     (Thionville Storm)
LONGWY-UNITED-2027        (Longwy United)
LONGWY-FC-2027            (Longwy FC)
MOSELLE-FLAMES-2027       (Moselle-Est Flames)
MOSELLE-EAGLES-2027       (Moselle-Est Eagles)
LORRAINE-DREAM-2027       (Lorraine Dream Team)
VOSGES-MIXTE-2027         (Vosges Mixte)
```

**⚠️ IMPORTANT : Créer la colonne "Code équipe" dans Airtable**

Si vous n'avez pas encore de colonne "Code équipe" dans votre table Équipes :

1. Ouvrez Airtable → Table "Équipes"
2. Ajoutez une colonne "Code équipe" (type : Single line text)
3. Copiez-collez les codes ci-dessus pour chaque équipe

**OU utilisez ce script automatique :**
```javascript
// Script à exécuter dans Airtable
// Onglet "Extensions" → "Scripting"

let table = base.getTable('Équipes');
let records = await table.selectRecordsAsync();

for (let record of records.records) {
    let nom = record.getCellValue('Nom équipe');
    let code = nom
        .toUpperCase()
        .replace(/\s+/g, '-')
        .replace(/É/g, 'E')
        + '-2027';
    
    await table.updateRecordAsync(record.id, {
        'Code équipe': code
    });
}

console.log('✅ Codes générés pour toutes les équipes !');
```

---

### 🎯 BÉNÉVOLES

**Login : Email + Password**

Quand un participant passe au type **Bénévole** dans Airtable, l'application génère automatiquement un mot de passe aléatoire et l'enregistre dans la colonne **`Mot de passe bénévole`**.

Si cette colonne n'existe pas encore dans Airtable, ajoutez-la dans `Liste_Participants` avant d'utiliser la promotion en bénévole.

La connexion se fait ensuite avec :

- l'adresse email présente dans la base Airtable
- le mot de passe généré automatiquement

Le mot de passe est renvoyé par la réponse de l'API `PATCH /api/participants` quand le rôle est promu en bénévole, et reste aussi visible dans Airtable.

**Accès :** Dashboard bénévole (check-in, saisie scores, incidents)

---

### 🚀 ADMIN

**Login : Email + Password**

| Nom | Email | Password |
|-----|-------|----------|
| Lilian (vous) | lilian.schmitt1@etu.univ-lorraine.fr | `Admin2027!SecureKey` |

**Accès :** Dashboard admin complet (tout)

---

## 🔧 MODIFIER LES CREDENTIALS

### Ajouter un bénévole :

1. Ouvrez Airtable → Table `Liste_Participants`
2. Passez `Type` à `Bénévole`
3. L'application génère automatiquement le mot de passe et le sauvegarde dans `Mot de passe bénévole`

Si vous devez relire les credentials côté développeur, récupérez la valeur renvoyée par `PATCH /api/participants` ou la colonne Airtable correspondante.

### Fallback hérité :

`BENEVOLES_CREDENTIALS` reste supporté comme secours si vous avez encore d'anciens comptes à mot de passe statique, mais il n'est plus le mécanisme principal.

### Ajouter un admin secondaire :

1. Ouvrez `.env.local`
2. Modifiez :
```
ADMIN_2_EMAIL=autre.admin@univ-lorraine.fr
ADMIN_2_PASSWORD=AutrePassword2027!
```

### Changer un mot de passe :

1. Ouvrez `.env.local`
2. Modifiez le mot de passe dans la ligne correspondante
3. Redémarrez le serveur (`npm run dev`)

---

## ⚠️ SÉCURITÉ

### ✅ À FAIRE :

- **Ne JAMAIS commit** le fichier `.env.local` sur Git
- Utiliser des mots de passe forts (minimum 12 caractères)
- Changer tous les mots de passe en production

### ❌ À NE PAS FAIRE :

- Ne pas mettre les mots de passe dans Airtable
- Ne pas partager le fichier `.env.local` publiquement
- Ne pas utiliser les mots de passe d'exemple en production

---

## 🔄 CHANGER TOUS LES MOTS DE PASSE AVANT PRODUCTION

**Avant le jour J, changez TOUS les mots de passe :**

```bash
# Générer des mots de passe aléatoires
openssl rand -base64 16

# Ou utilisez un générateur en ligne :
# https://passwordsgenerator.net/
```

Puis mettez à jour `.env.local` avec les nouveaux mots de passe.

---

## 🆘 MOT DE PASSE OUBLIÉ ?

**Pour les bénévoles/admin :**
→ Vous (Lilian) pouvez réinitialiser dans `.env.local`

**Pour les joueurs :**
→ Leur donner leur code équipe (disponible dans Airtable)

---

## 📧 CONTACT

En cas de problème d'accès :
**Lilian SCHMITT** - lilian.schmitt1@etu.univ-lorraine.fr
