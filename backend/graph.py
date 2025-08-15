import matplotlib
matplotlib.use('Agg')  # backend non interactif
import matplotlib.pyplot as plt
import numpy as np
from matplotlib import rcParams
import datetime
from datetime import timedelta
import io

def create_graph():
    try:
        plt.style.use('seaborn-v0_8-darkgrid')
    except:
        plt.style.use('ggplot')

    rcParams['font.family'] = 'sans-serif'
    rcParams['axes.titlepad'] = 20
    rcParams['axes.grid.axis'] = 'y'
    rcParams['axes.edgecolor'] = '#DDDDDD'

    # Données
    now = datetime.datetime.now()
    trimestres = [(now - timedelta(days=6)).strftime("%d/%m/%Y"), 
                (now - timedelta(days=5)).strftime("%d/%m/%Y"), 
                (now - timedelta(days=4)).strftime("%d/%m/%Y"), 
                (now - timedelta(days=3)).strftime("%d/%m/%Y"), 
                (now - timedelta(days=2)).strftime("%d/%m/%Y"), 
                (now - timedelta(days=1)).strftime("%d/%m/%Y"), 
                "Aujourd'hui"]
    ventes = np.array([
        [10, 15, 8, 13, 0, 14, 11],   # Dépenses
        [25, 8, 0, 13, 7, 5, 16],      # Revenus
    ])

    produits = ['Dépenses', 'Revenus']
    couleurs = ['#CD0001', '#019A01']
    couleur_egalite = '#404040'
    couleur_zero = '#F5F5F5'

    # Configuration de la figure
    fig, ax = plt.subplots(figsize=(12, 7), dpi=100)
    fig.patch.set_facecolor('#F8F9FA')
    ax.grid(axis='y', color='#FFFFFF', linestyle='-', linewidth=0.5)

    x = np.arange(len(trimestres))
    largeur_barre = 0.65

    # Pour chaque jour
    for j in range(len(trimestres)):
        # Cas particulier pour les valeurs nulles
        for k in range(2):
            if ventes[k, j] == 0:
                ax.bar(x[j], 0.1, width=largeur_barre,
                    color=couleur_zero, edgecolor='#AAAAAA',
                    zorder=3, linewidth=0.5)
        
        # Cas d'égalité
        if ventes[0, j] == ventes[1, j] and ventes[0, j] != 0:
            for k in range(2):
                ax.bar(x[j], ventes[k, j], width=largeur_barre,
                    color=couleur_egalite, edgecolor='white',
                    linewidth=0.5, zorder=2-k)
        else:
            # Cas normal
            ordre = np.argsort(ventes[:, j])
            for pos, k in enumerate(ordre):
                if ventes[k, j] > 0:
                    ax.bar(x[j], ventes[k, j], width=largeur_barre,
                        color=couleurs[k], edgecolor='white',
                        linewidth=0.5, zorder=len(ordre)-pos)
        
        # Ajout du trait de différence
        if ventes[0, j] != ventes[1, j] and min(ventes[:, j]) > 0:
            not_abs_diff = ventes[1, j] - ventes[0, j]
            diff = abs(not_abs_diff)
            min_val = min(ventes[0, j], ventes[1, j])
            max_val = max(ventes[0, j], ventes[1, j])
            
            # Couleur du trait (rouge si dépenses > revenus, vert sinon)
            line_color = "#999999"
            
            # Position verticale (au milieu de la barre supérieure)
            y_pos = min_val + diff/2
            
            # Dessin du trait
            ax.hlines(y=y_pos, xmin=x[j]-largeur_barre/2+0.005, xmax=x[j]+largeur_barre/2, 
                    colors=line_color, linewidth=3, zorder=4)
            
            # Texte de la différence
            ax.text(x[j], y_pos+0.35, f'{"-" if not_abs_diff < 0 else ""}{diff}€', ha='center', va='center', 
                    color='white', fontsize=9, fontweight='bold',
                    bbox=dict(facecolor=line_color, alpha=0.8, edgecolor='none', boxstyle='round,pad=0.2'))

    # Personnalisation des axes
    ax.set_xticks(x)
    ax.set_xticklabels(trimestres, fontsize=11)
    ax.set_xlabel('Dépenses / Revenus (7 derniers jours)', fontsize=12, labelpad=10)
    ax.set_ylabel('Montant (en €)', fontsize=12, labelpad=10)
    ax.set_ylim(0, np.max(ventes)*1.15)

    # Titre et légende
    ax.set_title('Dépenses vs Revenus - 7 derniers jours\n', 
                fontsize=14, fontweight='bold', color='#333333')

    handles = [
        plt.Rectangle((0,0),1,1, color=couleurs[0], label=produits[0]),
        plt.Rectangle((0,0),1,1, color=couleurs[1], label=produits[1]),
        plt.Rectangle((0,0),1,1, color=couleur_egalite, label='Égalité'),
    ]
    ax.legend(handles=handles, frameon=True, fontsize=10)

    # Ajouter les valeurs sur les barres
    for j in range(len(trimestres)):
        for k in range(2):
            if ventes[k, j] > 0:
                ax.text(x[j], ventes[k, j] + 0.5, str(ventes[k, j]),
                        ha='center', va='bottom', fontsize=10,
                        color=couleurs[k] if ventes[0,j]!=ventes[1,j] else couleur_egalite)

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)  # libère la mémoire
    buf.seek(0)

    return buf