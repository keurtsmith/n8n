# 🏥 Guide de Gestion des Pharmacies - Epharma IA

## 📋 Vue d'ensemble

La gestion des pharmacies dans Epharma IA est maintenant divisée en deux systèmes :

- **Gestion locale (JavaScript)** : Ajout, modification, suppression de pharmacies
- **n8n (lecture seule)** : Consultation des données Google Sheets et autres documents

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR                               │
│                    Interface Chat                            │
└──────────────────┬────────────────────┬─────────────────────┘
                   │                    │
                   │                    │
        ┌──────────▼────────┐  ┌───────▼──────────┐
        │  Commandes        │  │  Questions       │
        │  Pharmacies       │  │  Générales       │
        │  (Local JS)       │  │  (n8n + IA)      │
        └──────────┬────────┘  └───────┬──────────┘
                   │                    │
                   ▼                    ▼
        ┌──────────────────┐  ┌────────────────────┐
        │  localStorage     │  │  n8n Webhook       │
        │  epharma_         │  │  Google Sheets     │
        │  pharmacies_db    │  │  Google Docs/Slides│
        └───────────────────┘  └────────────────────┘
```

## 🚀 Commandes Disponibles

### 📋 Lister toutes les pharmacies
```
Liste toutes les pharmacies
```
**Réponse** : Affiche la liste complète avec ville, contact et propriétaire

---

### ➕ Ajouter une pharmacie
```
Ajoute la pharmacie [Nom] avec contact [numéro] dans [ville]
```
**Exemples** :
- `Ajoute la pharmacie Saint Jean avec contact 0612345678 dans Paris`
- `Ajoute la pharmacie Centrale avec contact 0698765432 dans Lyon`

**Validation** : Vérifie automatiquement qu'aucune pharmacie avec le même nom n'existe déjà

---

### ✏️ Modifier une pharmacie

#### Changer le contact
```
Modifie la pharmacie [Nom] avec contact [nouveau numéro]
```
**Exemple** : `Modifie la pharmacie Saint Jean avec contact 0699999999`

#### Changer la ville
```
Modifie la pharmacie [Nom] avec ville [nouvelle ville]
```
**Exemple** : `Modifie la pharmacie Saint Jean avec ville Marseille`

#### Renommer une pharmacie
```
Modifie le nom de la pharmacie [Ancien Nom] en [Nouveau Nom]
```
**Exemple** : `Modifie le nom de la pharmacie Saint Jean en Sainte Jeanne`

---

### 🗑️ Supprimer une pharmacie

**Étape 1** : Demander la suppression
```
Supprime la pharmacie [Nom]
```

**Étape 2** : Confirmer avec
```
CONFIRMER [Nom]
```

**Exemple complet** :
```
> Supprime la pharmacie Saint Jean
< ⚠️ Pour confirmer la suppression, répondez : CONFIRMER Saint Jean

> CONFIRMER Saint Jean
< ✅ Pharmacie "Saint Jean" supprimée avec succès !
```

---

### 🔍 Rechercher une pharmacie
```
Recherche la pharmacie [Nom]
```
**Exemple** : `Recherche la pharmacie Saint Jean`

**Réponse** : Affiche tous les détails (client, contact, type, pays, ville, quartier, propriétaire, version logiciel, liens distants, Anydesk, sauvegarde)

---

## 🔧 Structure des données

Chaque pharmacie contient les champs suivants :

| Champ | Description |
|-------|-------------|
| `Nom_Pharmacie` | Nom de la pharmacie (unique) |
| `Nom_du_client` | Nom du client propriétaire |
| `Contact` | Numéro de téléphone |
| `Type_de_client` | Type de client (ex: Premium, Standard) |
| `Pays` | Pays de la pharmacie |
| `Ville` | Ville de la pharmacie |
| `Quartier` | Quartier/zone géographique |
| `Proprietaire` | Nom du propriétaire |
| `Version_du_logiciel` | Version de TocToc Medoc installée |
| `Lien_distant` | URL de connexion distante |
| `Anydesk_principal` | ID Anydesk principal |
| `Anydesk_secondaire_1` | ID Anydesk secondaire 1 |
| `Anydesk_secondaire_2` | ID Anydesk secondaire 2 |
| `Sauvegarde` | Statut de la sauvegarde |

---

## 💾 Stockage

**Base de données locale** : `localStorage` sous la clé `epharma_pharmacies_db`

**Format** : Array JSON d'objets pharmacie

**Persistance** : Les données restent dans le navigateur jusqu'à suppression manuelle du cache

---

## 🔒 Sécurité

- ✅ Vérification d'unicité avant ajout
- ✅ Confirmation obligatoire pour suppression
- ✅ Correspondance exacte des noms (sensible à la casse)
- ✅ Validation des modifications (une seule correspondance)

---

## 📊 Workflow n8n (Lecture seule)

Le fichier `n8n_workflow_simplifie.json` contient :

1. **Read_Pharmacy_Data** : Lecture Google Sheets (si besoin de synchronisation)
2. **Documents Google** : Guides, procédures, documentation
3. **Google Slides** : Flash reports et présentations
4. **AI Agent** : Répond aux questions générales

**Aucune opération d'écriture** n'est effectuée par n8n sur la base de pharmacies.

---

## 🎓 Exemples d'utilisation

### Scénario 1 : Ajouter 3 pharmacies
```
> Ajoute la pharmacie Centrale avec contact 0611111111 dans Paris
✅ Pharmacie "Centrale" ajoutée avec succès !

> Ajoute la pharmacie du Soleil avec contact 0622222222 dans Lyon
✅ Pharmacie "du Soleil" ajoutée avec succès !

> Ajoute la pharmacie Saint Martin avec contact 0633333333 dans Marseille
✅ Pharmacie "Saint Martin" ajoutée avec succès !
```

### Scénario 2 : Modifier et vérifier
```
> Modifie la pharmacie Centrale avec contact 0699999999
✅ Pharmacie "Centrale" modifiée avec succès !
📝 Champs modifiés : Contact

> Recherche la pharmacie Centrale
🏥 Centrale
📞 Contact : 0699999999
🏙️ Ville : Paris
...
```

### Scénario 3 : Renommer une pharmacie
```
> Modifie le nom de la pharmacie Saint Martin en Sainte Martine
✅ Pharmacie "Saint Martin" modifiée avec succès !
📝 Champs modifiés : Nom_Pharmacie
```

---

## 🚨 Gestion des erreurs

### Pharmacie déjà existante
```
> Ajoute la pharmacie Centrale avec contact 0611111111 dans Paris
❌ La pharmacie "Centrale" existe déjà dans la base de données.
```

### Pharmacie introuvable
```
> Modifie la pharmacie Inexistante avec contact 0600000000
❌ Aucune pharmacie trouvée avec le nom "Inexistante".
```

### Plusieurs correspondances (ambiguïté)
```
❌ Plusieurs pharmacies trouvées avec le nom "Centrale". Impossible de modifier.
```

### Suppression sans confirmation
```
> Supprime la pharmacie Centrale
⚠️ Pour confirmer la suppression, répondez : CONFIRMER Centrale
```

---

## 🔄 Synchronisation avec Google Sheets

Si vous souhaitez synchroniser les données locales avec Google Sheets :

1. Exportez les données depuis `localStorage`
2. Importez-les manuellement dans Google Sheets
3. Ou créez un script de synchronisation personnalisé

**Note** : Cette fonctionnalité n'est pas implémentée par défaut pour éviter les conflits avec n8n.

---

## 📝 Notes importantes

- Les noms de pharmacies sont **sensibles à la casse** ("Saint Jean" ≠ "saint jean")
- La base de données est **locale au navigateur** de chaque utilisateur
- Les modifications sont **instantanées** (pas d'appel API)
- Les données persistent **après fermeture du navigateur**

---

## 🛠️ Maintenance

### Réinitialiser la base de données
Dans la console du navigateur :
```javascript
localStorage.removeItem('epharma_pharmacies_db')
location.reload()
```

### Exporter les données
```javascript
const data = localStorage.getItem('epharma_pharmacies_db')
console.log(JSON.parse(data))
```

### Importer des données
```javascript
const pharmacies = [
  {
    Nom_Pharmacie: "Test",
    Contact: "0612345678",
    Ville: "Paris"
  }
]
localStorage.setItem('epharma_pharmacies_db', JSON.stringify(pharmacies))
location.reload()
```

---

## 📞 Support

Pour toute question ou problème, consultez :
- [CLAUDE.md](./CLAUDE.md) - Documentation du projet
- Console du navigateur (F12) pour les logs détaillés
