# 🌊 FlowBoard

**FlowBoard** est une application web tout-en-un pour organiser et gérer une vie en autonomie.  
Elle regroupe en un seul endroit : gestion du budget, inventaire de la maison, liste de courses, recettes, planification quotidienne, carnet d’idées… le tout accessible sur PC et mobile.

---

## 🚀 Fonctionnalités

- **📅 Planification journalière**  
  - Tâches à faire, prévisions, rappels.
  
- **🛒 Liste de courses intelligente**  
  - Synchronisable avec Google Tasks.
  - Compatible avec le partage sur mobile.
  
- **💰 Gestion du budget**  
  - Suivi des dépenses/entrées d’argent.
  - Mise à jour en temps réel sur tous les appareils.
  
- **📦 Inventaire de la maison**  
  - Stock des produits, suivi des dates de péremption.
  
- **📖 Carnet d’idées**  
  - Notes rapides et organisation thématique.
  
- **🌐 Mode hors ligne (PWA)**  
  - Utilisable même sans connexion.
  - Installation sur PC et smartphone via navigateur.
  
- **🔔 Intégrations externes**  
  - Google Tasks (liste de courses, to-do).
  - Webhooks Discord (alertes, rappels).
  
---

## 🛠️ Stack technique

- **Frontend** : HTML / CSS / JavaScript (Responsive Design)
- **Backend** : Python (API REST via Flask ou FastAPI)
- **Hébergement** :  
  - Frontend → [Netlify](https://www.netlify.com/)  
  - Backend → [Render](https://render.com/) ou [Railway](https://railway.app/)
- **Base de données** :  
  - [Supabase](https://supabase.com/) ou [Firebase](https://firebase.google.com/) pour la synchro temps réel.
- **PWA** : Service Worker + Manifest JSON.

---

## 📲 Installation

### 1️⃣ Cloner le dépôt
```bash
git clone https://github.com/Thzgeek11/flowboard.git
cd flowboard
