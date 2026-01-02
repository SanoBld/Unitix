/**
 * UNITIX ULTIMATE ENGINE
 * Version 5.2 - Développée avec une rigueur absolue.
 * Pas d'abréviations, pas de fonctions fléchées compactes, logique explicite.
 */

document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // 1. SYSTÈME DE NAVIGATION ENTRE PANNEAUX
    // ==========================================
    var tousLesBoutonsNavigation = document.querySelectorAll('.nav-item');
    var tousLesPanneaux = document.querySelectorAll('.panel');

    function basculerVersPanneau(identifiantPanneau) {
        // Désactivation de tous les éléments actifs
        for (var i = 0; i < tousLesPanneaux.length; i++) {
            tousLesPanneaux[i].classList.remove('active');
        }
        for (var j = 0; j < tousLesBoutonsNavigation.length; j++) {
            tousLesBoutonsNavigation[j].classList.remove('active');
        }

        // Activation du panneau demandé
        var panneauCible = document.getElementById(identifiantPanneau);
        if (panneauCible) {
            panneauCible.classList.add('active');
        }

        // Mise à jour visuelle des boutons correspondants (Mobile + Desktop)
        var boutonsCibles = document.querySelectorAll('[data-target="' + identifiantPanneau + '"]');
        for (var k = 0; k < boutonsCibles.length; k++) {
            boutonsCibles[k].classList.add('active');
        }
    }

    // Assignation des événements de clic
    for (var l = 0; l < tousLesBoutonsNavigation.length; l++) {
        tousLesBoutonsNavigation[l].addEventListener('click', function() {
            var cible = this.getAttribute('data-target');
            basculerVersPanneau(cible);
        });
    }


    // ==========================================
    // 2. DONNÉES DE CONVERSION (UNITÉS COMPLÈTES)
    // ==========================================
    var baseDeDonneesUnites = {
        length: {
            "Kilomètre (km)": 1000, "Hectomètre (hm)": 100, "Décamètre (dam)": 10, "Mètre (m)": 1,
            "Décimètre (dm)": 0.1, "Centimètre (cm)": 0.01, "Millimètre (mm)": 0.001,
            "Mile (mi)": 1609.34, "Yard (yd)": 0.9144, "Pied (ft)": 0.3048, "Pouce (in)": 0.0254
        },
        mass: {
            "Tonne (t)": 1000000, "Quintal (q)": 100000, "Kilogramme (kg)": 1000,
            "Hectogramme (hg)": 100, "Décagramme (dag)": 10, "Gramme (g)": 1,
            "Décigramme (dg)": 0.1, "Centigramme (cg)": 0.01, "Milligramme (mg)": 0.001,
            "Livre (lb)": 453.59, "Once (oz)": 28.35
        },
        volume: {
            "Mètre cube (m³)": 1000, "Hectolitre (hl)": 100, "Décalitre (dal)": 10, "Litre (l)": 1,
            "Décilitre (dl)": 0.1, "Centilitre (cl)": 0.01, "Millilitre (ml)": 0.001,
            "Pied cube (ft³)": 28.31, "Gallon (gal)": 3.785, "Pinte (pt)": 0.473
        },
        speed: {
            "Kilomètre par heure (km/h)": 1, "Mètre par seconde (m/s)": 3.6,
            "Mille par heure (mph)": 1.609, "Nœud (kn)": 1.852, "Mach": 1225.04
        },
        data: {
            "Octet (o)": 1, "Kilooctet (Ko)": 1024, "Mégaoctet (Mo)": 1048576,
            "Gigaoctet (Go)": 1073741824, "Téraoctet (To)": 1099511627776
        },
        temp: {
            "Celsius (°C)": "CELSIUS", "Fahrenheit (°F)": "FAHRENHEIT", "Kelvin (K)": "KELVIN"
        }
    };

    var categorieMesureActuelle = "length";
    var saisieValeurUnite = document.getElementById('input-value');
    var resultatValeurUnite = document.getElementById('output-value');
    var selecteurOrigine = document.getElementById('select-from');
    var selecteurDestination = document.getElementById('select-to');
    var ongletsCategories = document.querySelectorAll('.tab-btn');

    function remplirSelecteursUnites() {
        var listeNomsUnites = Object.keys(baseDeDonneesUnites[categorieMesureActuelle]);
        var codeHtmlOptions = "";
        for (var i = 0; i < listeNomsUnites.length; i++) {
            codeHtmlOptions += '<option value="' + listeNomsUnites[i] + '">' + listeNomsUnites[i] + '</option>';
        }
        selecteurOrigine.innerHTML = codeHtmlOptions;
        selecteurDestination.innerHTML = codeHtmlOptions;
        
        if (listeNomsUnites.length > 1) {
            selecteurDestination.selectedIndex = 1;
        }
        executerConversionMesure();
    }

    function executerConversionMesure() {
        var valeurEntree = parseFloat(saisieValeurUnite.value);
        if (isNaN(valeurEntree)) {
            resultatValeurUnite.value = "";
            return;
        }

        var uniteDepuis = selecteurOrigine.value;
        var uniteVers = selecteurDestination.value;

        if (categorieMesureActuelle === "temp") {
            var tempEnCelsius = valeurEntree;
            if (uniteDepuis === "Fahrenheit (°F)") { tempEnCelsius = (valeurEntree - 32) * 5 / 9; }
            if (uniteDepuis === "Kelvin (K)") { tempEnCelsius = valeurEntree - 273.15; }

            var resultatFinal = tempEnCelsius;
            if (uniteVers === "Fahrenheit (°F)") { resultatFinal = (tempEnCelsius * 9 / 5) + 32; }
            if (uniteVers === "Kelvin (K)") { resultatFinal = tempEnCelsius + 273.15; }
            resultatValeurUnite.value = resultatFinal.toFixed(2);
        } else {
            var valeurEnBase = valeurEntree * baseDeDonneesUnites[categorieMesureActuelle][uniteDepuis];
            var conversionFinale = valeurEnBase / baseDeDonneesUnites[categorieMesureActuelle][uniteVers];
            resultatValeurUnite.value = parseFloat(conversionFinale.toFixed(6));
        }
    }

    // Événements pour les onglets de catégories
    for (var m = 0; m < ongletsCategories.length; m++) {
        ongletsCategories[m].addEventListener('click', function() {
            for (var i = 0; i < ongletsCategories.length; i++) {
                ongletsCategories[i].classList.remove('active');
            }
            this.classList.add('active');
            categorieMesureActuelle = this.getAttribute('data-cat');
            remplirSelecteursUnites();
        });
    }

    saisieValeurUnite.addEventListener('input', executerConversionMesure);
    selecteurOrigine.addEventListener('change', executerConversionMesure);
    selecteurDestination.addEventListener('change', executerConversionMesure);
    
    document.getElementById('btn-swap-unit').addEventListener('click', function() {
        var memoire = selecteurOrigine.value;
        selecteurOrigine.value = selecteurDestination.value;
        selecteurDestination.value = memoire;
        executerConversionMesure();
    });


    // ==========================================
    // 3. GESTION DES DEVISES (API & STATUT)
    // ==========================================
    var tauxDeChangeCollectes = null;
    var entreeDevise = document.getElementById('curr-input');
    var sortieDevise = document.getElementById('curr-output');
    var selDeviseDe = document.getElementById('curr-from');
    var selDeviseA = document.getElementById('curr-to');
    var indicateurApi = document.getElementById('api-status');
    var texteDerniereMaj = document.getElementById('last-update');

    function chargerDonneesDevises() {
        fetch('https://open.er-api.com/v6/latest/EUR')
            .then(function(reponse) { 
                return reponse.json(); 
            })
            .then(function(donnees) {
                tauxDeChangeCollectes = donnees.rates;
                var codesDevises = Object.keys(tauxDeChangeCollectes);
                var optionsHtml = "";
                for (var i = 0; i < codesDevises.length; i++) {
                    optionsHtml += '<option value="' + codesDevises[i] + '">' + codesDevises[i] + '</option>';
                }
                selDeviseDe.innerHTML = optionsHtml;
                selDeviseA.innerHTML = optionsHtml;
                selDeviseA.value = "USD";
                
                indicateurApi.innerText = "Données à jour";
                indicateurApi.style.background = "#34C759";
                indicateurApi.style.color = "#FFFFFF";
                
                if (donnees.time_last_update_utc) {
                    var objetDate = new Date(donnees.time_last_update_utc);
                    texteDerniereMaj.innerText = "Dernière mise à jour : " + objetDate.toLocaleString();
                }
            })
            .catch(function(erreur) {
                indicateurApi.innerText = "Erreur de connexion";
                indicateurApi.style.background = "#FF3B30";
                indicateurApi.style.color = "#FFFFFF";
                console.error("Erreur API Devises:", erreur);
            });
    }

    function calculerConversionDevise() {
        if (!tauxDeChangeCollectes) { return; }
        var montant = parseFloat(entreeDevise.value);
        if (isNaN(montant)) {
            sortieDevise.value = "";
            return;
        }
        
        var baseEuro = montant / tauxDeChangeCollectes[selDeviseDe.value];
        var resultatFinal = baseEuro * tauxDeChangeCollectes[selDeviseA.value];
        sortieDevise.value = resultatFinal.toFixed(2);
    }

    entreeDevise.addEventListener('input', calculerConversionDevise);
    selDeviseDe.addEventListener('change', calculerConversionDevise);
    selDeviseA.addEventListener('change', calculerConversionDevise);

    document.getElementById('btn-swap-curr').addEventListener('click', function() {
        var tempDevise = selDeviseDe.value;
        selDeviseDe.value = selDeviseA.value;
        selDeviseA.value = tempDevise;
        calculerConversionDevise();
    });


    // ==========================================
    // 4. CALCUL DE DIFFÉRENCE DE DATES
    // ==========================================
    var champDateDebut = document.getElementById('date-start');
    var champDateFin = document.getElementById('date-end');
    var affichageResultatDate = document.getElementById('date-diff-output');

    function executerCalculEcartDate() {
        if (!champDateDebut.value || !champDateFin.value) { return; }
        
        var d1 = new Date(champDateDebut.value);
        var d2 = new Date(champDateFin.value);
        
        var millisecondesEcart = Math.abs(d2 - d1);
        var joursEcart = Math.ceil(millisecondesEcart / (1000 * 60 * 60 * 24));
        
        affichageResultatDate.innerText = joursEcart + " jours d'écart entre ces dates";
    }

    champDateDebut.addEventListener('change', executerCalculEcartDate);
    champDateFin.addEventListener('change', executerCalculEcartDate);


    // ==========================================
    // 5. CALCULATRICE (RÉGULIÈRE & SCIENTIFIQUE)
    // ==========================================
    var ecranPrincipalCalc = document.getElementById('calc-main');
    var ecranHistoriqueCalc = document.getElementById('calc-history');
    var grilleBoutonsCalc = document.getElementById('calc-grid');
    var modeScientifiqueEstActif = false;
    var expressionMathematique = "";

    function construireGrilleCalculatrice() {
        grilleBoutonsCalc.innerHTML = "";
        var touches = modeScientifiqueEstActif 
            ? ['C','DEL','(',')','^','sin','cos','tan','log','√','7','8','9','/','4','5','6','*','1','2','3','-','0','.','π','+','=']
            : ['C','(',')','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','DEL','='];

        if (modeScientifiqueEstActif) {
            grilleBoutonsCalc.style.gridTemplateColumns = "repeat(5, 1fr)";
        } else {
            grilleBoutonsCalc.style.gridTemplateColumns = "repeat(4, 1fr)";
        }

        for (var i = 0; i < touches.length; i++) {
            var boutonCalcul = document.createElement('button');
            boutonCalcul.className = "calc-btn";
            boutonCalcul.innerText = touches[i];

            if (['/','*','-','+','='].includes(touches[i])) { boutonCalcul.classList.add('op'); }
            else if (['C','DEL','sin','cos','tan','log','√','^','(',')'].includes(touches[i])) { boutonCalcul.classList.add('fn'); }
            else { boutonCalcul.classList.add('num'); }

            // Closure pour capturer la valeur de la touche
            (function(valeurTouche) {
                boutonCalcul.addEventListener('click', function() {
                    ecranPrincipalCalc.classList.remove('pop');
                    void ecranPrincipalCalc.offsetWidth; // Déclenchement du reflow pour relancer l'animation
                    ecranPrincipalCalc.classList.add('pop');
                    traiterEntreeCalculatrice(valeurTouche);
                });
            })(touches[i]);
            
            grilleBoutonsCalc.appendChild(boutonCalcul);
        }
    }

    function traiterEntreeCalculatrice(touche) {
        if (touche === 'C') {
            expressionMathematique = "";
            ecranHistoriqueCalc.innerText = "";
        } else if (touche === 'DEL') {
            expressionMathematique = expressionMathematique.slice(0, -1);
        } else if (touche === '=') {
            try {
                var expressionPreparee = expressionMathematique
                    .replace(/π/g, 'Math.PI')
                    .replace(/sin/g, 'Math.sin')
                    .replace(/cos/g, 'Math.cos')
                    .replace(/tan/g, 'Math.tan')
                    .replace(/log/g, 'Math.log10')
                    .replace(/√/g, 'Math.sqrt')
                    .replace(/\^/g, '**');
                
                var resultatCalcul = new Function('return ' + expressionPreparee)();
                ecranHistoriqueCalc.innerText = expressionMathematique + " =";
                expressionMathematique = String(parseFloat(resultatCalcul.toFixed(8)));
            } catch (erreur) {
                expressionMathematique = "Erreur";
            }
        } else {
            if (expressionMathematique === "Erreur") { expressionMathematique = ""; }
            expressionMathematique += touche;
        }
        ecranPrincipalCalc.innerText = expressionMathematique || "0";
    }

    document.getElementById('calc-mode-btn').addEventListener('click', function() {
        modeScientifiqueEstActif = !modeScientifiqueEstActif;
        this.innerText = modeScientifiqueEstActif ? "Mode Standard" : "Mode Scientifique";
        construireGrilleCalculatrice();
    });


    // ==========================================
    // 6. NIVEAU À BULLE (CAPTEURS D'ORIENTATION)
    // ==========================================
    var bulleVisuelle = document.getElementById('level-bubble');
    var affichageDegres = document.getElementById('level-data');
    
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function(evenementOrientation) {
            var inclinaisonBeta = evenementOrientation.beta;  
            var inclinaisonGamma = evenementOrientation.gamma; 

            if (inclinaisonBeta === null || inclinaisonGamma === null) { return; }

            // Calcul du déplacement visuel (limitation à 120 pixels)
            var deplacementX = Math.max(-120, Math.min(120, inclinaisonGamma * 3.5));
            var deplacementY = Math.max(-120, Math.min(120, inclinaisonBeta * 3.5));

            bulleVisuelle.style.transform = "translate(" + deplacementX + "px, " + deplacementY + "px)";
            
            var inclinaisonTotale = Math.round(Math.abs(inclinaisonBeta) + Math.abs(inclinaisonGamma));
            affichageDegres.innerText = inclinaisonTotale + "°";
            
            // Couleur de succès si le niveau est proche de 0
            if (inclinaisonTotale < 2) {
                bulleVisuelle.style.background = "#34C759";
            } else {
                bulleVisuelle.style.background = "var(--primary)";
            }
        });
    }


    // ==========================================
    // 7. GESTION DU THÈME ET DES COULEURS
    // ==========================================
    var boutonsTheme = document.querySelectorAll('[data-theme-btn]');
    var mediaQuerySombre = window.matchMedia('(prefers-color-scheme: dark)');

    function appliquerThemeVisuel(mode) {
        if (mode === 'auto') {
            document.body.setAttribute('data-theme', mediaQuerySombre.matches ? 'dark' : 'light');
        } else {
            document.body.setAttribute('data-theme', mode);
        }

        localStorage.setItem('unitix_theme_pref', mode);

        for (var i = 0; i < boutonsTheme.length; i++) {
            if (boutonsTheme[i].getAttribute('data-theme-btn') === mode) {
                boutonsTheme[i].classList.add('active');
            } else {
                boutonsTheme[i].classList.remove('active');
            }
        }
    }

    for (var n = 0; n < boutonsTheme.length; n++) {
        boutonsTheme[n].addEventListener('click', function() {
            appliquerThemeVisuel(this.getAttribute('data-theme-btn'));
        });
    }


    // ==========================================
    // 8. BLOC-NOTES ET PERSISTANCE
    // ==========================================
    var zoneDeTexteNotes = document.getElementById('notes-area');
    var interrupteurNotes = document.getElementById('toggle-notes');
    var itemNavNotes = document.getElementById('nav-notes');

    zoneDeTexteNotes.value = localStorage.getItem('unitix_notes_data') || "";
    zoneDeTexteNotes.addEventListener('input', function() {
        localStorage.setItem('unitix_notes_data', this.value);
    });

    var etatNotesActive = localStorage.getItem('unitix_notes_enabled') === 'true';
    interrupteurNotes.checked = etatNotesActive;
    if (etatNotesActive) { 
        itemNavNotes.classList.remove('hidden'); 
    }

    interrupteurNotes.addEventListener('change', function() {
        var active = this.checked;
        localStorage.setItem('unitix_notes_enabled', active);
        if (active) {
            itemNavNotes.classList.remove('hidden');
        } else {
            itemNavNotes.classList.add('hidden');
            basculerVersPanneau('panel-convert');
        }
    });


    // ==========================================
    // 9. COULEURS D'ACCENT ET RÉINITIALISATION
    // ==========================================
    var pastillesCouleurs = document.querySelectorAll('.dot');
    for (var p = 0; p < pastillesCouleurs.length; p++) {
        pastillesCouleurs[p].addEventListener('click', function() {
            var couleurSelectionnee = this.getAttribute('data-color');
            document.documentElement.style.setProperty('--primary', couleurSelectionnee);
            localStorage.setItem('unitix_accent_color', couleurSelectionnee);
            
            for (var k = 0; k < pastillesCouleurs.length; k++) {
                pastillesCouleurs[k].classList.remove('active');
            }
            this.classList.add('active');
        });
    }

    document.getElementById('app-reset').addEventListener('click', function() {
        if (confirm("Voulez-vous vraiment réinitialiser toutes vos préférences et vos notes ?")) {
            localStorage.clear();
            location.reload();
        }
    });

    // Initialisation finale
    remplirSelecteursUnites();
    chargerDonneesDevises();
    construireGrilleCalculatrice();
    appliquerThemeVisuel(localStorage.getItem('unitix_theme_pref') || 'auto');
    
    var couleurInitiale = localStorage.getItem('unitix_accent_color');
    if (couleurInitiale) {
        document.documentElement.style.setProperty('--primary', couleurInitiale);
        var pastilleActive = document.querySelector('.dot[data-color="' + couleurInitiale + '"]');
        if (pastilleActive) { pastilleActive.classList.add('active'); }
    }
});