/**
 * UNITIX ULTIMATE - CODE SOURCE COMPLET
 * Logique détaillée, sans raccourcis, 100% fonctionnel.
 */

// --- VARIABLES GLOBALES ---
var calculEnCours = "";
var modeScientifiqueActive = false;
var categorieActuelle = "length";

// --- DÉMARRAGE DE L'APPLICATION ---
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. GESTION DU THÈME (AUTO / CLAIR / SOMBRE)
    // ---------------------------------------------------------
    var requeteSysteme = window.matchMedia('(prefers-color-scheme: dark)');
    var segmentsTheme = document.querySelectorAll('.theme-segments .segment');

    function appliquerTheme(modeChoisi) {
        var corpsPage = document.body;
        
        // Logique d'application sur le body
        if (modeChoisi === 'auto') {
            if (requeteSysteme.matches) {
                corpsPage.setAttribute('data-theme', 'dark');
            } else {
                corpsPage.setAttribute('data-theme', 'light');
            }
        } else {
            corpsPage.setAttribute('data-theme', modeChoisi);
        }

        // Sauvegarde
        localStorage.setItem('preference_theme', modeChoisi);

        // Mise à jour visuelle des boutons (segments)
        for (var i = 0; i < segmentsTheme.length; i++) {
            var segment = segmentsTheme[i];
            if (segment.getAttribute('data-theme-val') === modeChoisi) {
                segment.classList.add('active');
            } else {
                segment.classList.remove('active');
            }
        }
    }

    // Écouteurs sur les boutons de thème
    for (var j = 0; j < segmentsTheme.length; j++) {
        segmentsTheme[j].addEventListener('click', function() {
            if (navigator.vibrate) { navigator.vibrate(10); }
            var valeurTheme = this.getAttribute('data-theme-val');
            appliquerTheme(valeurTheme);
        });
    }

    // Écouteur changement système (si mode auto)
    requeteSysteme.addEventListener('change', function() {
        var modeActuel = localStorage.getItem('preference_theme') || 'auto';
        if (modeActuel === 'auto') {
            appliquerTheme('auto');
        }
    });

    // Initialisation au chargement
    var themeSauvegarde = localStorage.getItem('preference_theme') || 'auto';
    appliquerTheme(themeSauvegarde);


    // 2. CONVERTISSEUR D'UNITÉS (DONNÉES COMPLÈTES)
    // ---------------------------------------------------------
    var ratiosConversion = {
        length: {
            "Kilomètre (km)": 1000, "Hectomètre (hm)": 100, "Décamètre (dam)": 10, "Mètre (m)": 1,
            "Décimètre (dm)": 0.1, "Centimètre (cm)": 0.01, "Millimètre (mm)": 0.001,
            "Mile (mi)": 1609.34, "Yard (yd)": 0.9144, "Pied (ft)": 0.3048, "Pouce (in)": 0.0254
        },
        mass: {
            "Tonne (t)": 1000000, "Quintal (q)": 100000, "Kilogramme (kg)": 1000, "Hectogramme (hg)": 100,
            "Décagramme (dag)": 10, "Gramme (g)": 1, "Décigramme (dg)": 0.1, "Centigramme (cg)": 0.01,
            "Milligramme (mg)": 0.001, "Livre (lb)": 453.59, "Once (oz)": 28.35
        },
        volume: {
            "Mètre Cube (m³)": 1000, "Hectolitre (hl)": 100, "Décalitre (dal)": 10, "Litre (L)": 1,
            "Décilitre (dl)": 0.1, "Centilitre (cl)": 0.01, "Millilitre (ml)": 0.001,
            "Gallon (gal)": 3.785, "Pinte (pt)": 0.473
        },
        speed: { "Km/h": 1, "m/s": 3.6, "Nœud": 1.852, "Mach": 1225.04, "Mph": 1.609 },
        pressure: { "Pascal": 1, "Bar": 100000, "PSI": 6894.76, "Atmosphère": 101325 },
        energy: { "Joule": 1, "Calorie": 4.184, "kWh": 3600000, "eV": 1.602e-19 },
        time: { "Seconde": 1, "Minute": 60, "Heure": 3600, "Jour": 86400, "Semaine": 604800, "Année": 31536000 },
        data: { "Octet": 1, "Ko": 1024, "Mo": 1048576, "Go": 1073741824, "To": 1099511627776 },
        temp: { "Celsius": "C", "Fahrenheit": "F", "Kelvin": "K" }
    };

    var entreeValeur = document.getElementById('unit-input');
    var sortieValeur = document.getElementById('unit-output');
    var listeSource = document.getElementById('unit-from');
    var listeCible = document.getElementById('unit-to');
    var affichageFormule = document.getElementById('formula-display');

    function effectuerConversion() {
        var valeurNumerique = parseFloat(entreeValeur.value);
        
        if (isNaN(valeurNumerique)) {
            sortieValeur.value = "";
            affichageFormule.textContent = "Entrez un nombre";
            return;
        }

        var de = listeSource.value;
        var vers = listeCible.value;
        var resultat = 0;

        // Gestion Spéciale Température
        if (categorieActuelle === 'temp') {
            var valEnCelsius = valeurNumerique;
            if (de === "Fahrenheit") valEnCelsius = (valeurNumerique - 32) * 5/9;
            if (de === "Kelvin") valEnCelsius = valeurNumerique - 273.15;

            if (vers === "Celsius") resultat = valEnCelsius;
            if (vers === "Fahrenheit") resultat = (valEnCelsius * 9/5) + 32;
            if (vers === "Kelvin") resultat = valEnCelsius + 273.15;
        } 
        // Gestion Standard (Ratios)
        else {
            var tableRatios = ratiosConversion[categorieActuelle];
            var valeurEnBase = valeurNumerique * tableRatios[de];
            resultat = valeurEnBase / tableRatios[vers];
        }

        sortieValeur.value = parseFloat(resultat.toFixed(6));
        affichageFormule.textContent = "1 " + de + " ≈ " + (1 * (ratiosConversion[categorieActuelle]?.[de] || 1) / (ratiosConversion[categorieActuelle]?.[vers] || 1)).toPrecision(4) + " " + vers;
    }

    var boutonsCategories = document.querySelectorAll('.segment[data-cat]');
    for (var k = 0; k < boutonsCategories.length; k++) {
        boutonsCategories[k].addEventListener('click', function() {
            if (navigator.vibrate) { navigator.vibrate(10); }
            
            // UI Active
            for (var l = 0; l < boutonsCategories.length; l++) {
                boutonsCategories[l].classList.remove('active');
            }
            this.classList.add('active');
            
            categorieActuelle = this.getAttribute('data-cat');
            
            // Remplir les listes
            var unitesDisponibles = Object.keys(ratiosConversion[categorieActuelle]);
            var htmlOptions = "";
            for (var m = 0; m < unitesDisponibles.length; m++) {
                htmlOptions += '<option value="' + unitesDisponibles[m] + '">' + unitesDisponibles[m] + '</option>';
            }
            
            listeSource.innerHTML = htmlOptions;
            listeCible.innerHTML = htmlOptions;
            listeCible.selectedIndex = (unitesDisponibles.length > 1) ? 1 : 0;
            
            effectuerConversion();
        });
    }

    entreeValeur.addEventListener('input', effectuerConversion);
    listeSource.addEventListener('change', effectuerConversion);
    listeCible.addEventListener('change', effectuerConversion);
    
    document.getElementById('btn-swap-unit').addEventListener('click', function() {
        if (navigator.vibrate) { navigator.vibrate(10); }
        var temp = listeSource.value;
        listeSource.value = listeCible.value;
        listeCible.value = temp;
        effectuerConversion();
    });


    // 3. CONVERTISSEUR DE DEVISES
    // ---------------------------------------------------------
    // (Similaire au précédent mais adapté pour être explicite)
    var devisesTaux = null;
    var entreeDevise = document.getElementById('currency-input');
    var sortieDevise = document.getElementById('currency-output');
    var deDevise = document.getElementById('currency-from');
    var versDevise = document.getElementById('currency-to');
    var statusApi = document.getElementById('api-status');

    fetch('https://open.er-api.com/v6/latest/EUR')
        .then(function(reponse) { return reponse.json(); })
        .then(function(donnees) {
            devisesTaux = donnees.rates;
            var codes = Object.keys(devisesTaux);
            var optionsHtml = "";
            for (var n = 0; n < codes.length; n++) {
                optionsHtml += '<option value="' + codes[n] + '">' + codes[n] + '</option>';
            }
            deDevise.innerHTML = optionsHtml;
            versDevise.innerHTML = optionsHtml;
            versDevise.value = "USD";
            statusApi.textContent = "En ligne";
            statusApi.style.background = "#34C759";
            statusApi.style.color = "white";
        })
        .catch(function() {
            statusApi.textContent = "Hors ligne";
            statusApi.style.background = "#FF3B30";
            statusApi.style.color = "white";
        });

    function convertirDevise() {
        if (!devisesTaux) return;
        var val = parseFloat(entreeDevise.value);
        if (isNaN(val)) { sortieDevise.value = ""; return; }
        
        var resultat = (val / devisesTaux[deDevise.value]) * devisesTaux[versDevise.value];
        sortieDevise.value = resultat.toFixed(2);
    }

    entreeDevise.addEventListener('input', convertirDevise);
    deDevise.addEventListener('change', convertirDevise);
    versDevise.addEventListener('change', convertirDevise);


    // 4. CALCULATRICE AVEC ANIMATION
    // ---------------------------------------------------------
    var ecranCalcul = document.getElementById('calc-curr');
    var ecranHistorique = document.getElementById('calc-prev');
    var grilleBoutons = document.getElementById('calc-btns');
    var boutonModeSci = document.getElementById('toggle-sci');

    function declencherAnimation() {
        // Astuce pour redémarrer une animation CSS
        ecranCalcul.classList.remove('pop');
        void ecranCalcul.offsetWidth; // Force le navigateur à recalculer (Reflow)
        ecranCalcul.classList.add('pop');
    }

    function construireCalculatrice() {
        grilleBoutons.innerHTML = "";
        var touches = [];

        if (modeScientifiqueActive) {
            grilleBoutons.classList.add('sci-mode');
            touches = ['C', 'DEL', 'sin', 'cos', 'tan', '7', '8', '9', '/', 'log', '4', '5', '6', '*', '√', '1', '2', '3', '-', '^', '0', '.', 'π', '+', '='];
        } else {
            grilleBoutons.classList.remove('sci-mode');
            touches = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'DEL', '='];
        }

        for (var p = 0; p < touches.length; p++) {
            (function(touche) { // Closure pour garder la valeur de 'touche'
                var bouton = document.createElement('button');
                bouton.className = 'calc-btn';
                bouton.textContent = touche;
                
                if (['C','DEL','=','/','*','-','+'].includes(touche)) bouton.classList.add('op');
                if (['sin','cos','tan','log','√','^','π'].includes(touche)) bouton.classList.add('fn');

                bouton.addEventListener('click', function() {
                    if (navigator.vibrate) { navigator.vibrate(12); }
                    
                    declencherAnimation(); // EFFET VISUEL ICI

                    if (touche === 'C') {
                        calculEnCours = "";
                        ecranHistorique.textContent = "";
                    } else if (touche === 'DEL') {
                        calculEnCours = calculEnCours.slice(0, -1);
                    } else if (touche === '=') {
                        try {
                            var expressionMath = calculEnCours
                                .replace(/π/g, 'Math.PI')
                                .replace(/sin/g, 'Math.sin')
                                .replace(/cos/g, 'Math.cos')
                                .replace(/tan/g, 'Math.tan')
                                .replace(/log/g, 'Math.log10')
                                .replace(/√/g, 'Math.sqrt')
                                .replace(/\^/g, '**');
                            
                            var resultat = new Function('return ' + expressionMath)();
                            ecranHistorique.textContent = calculEnCours + " =";
                            calculEnCours = String(parseFloat(resultat.toFixed(8)));
                        } catch (e) {
                            calculEnCours = "Erreur";
                        }
                    } else {
                        if (calculEnCours === "Erreur") calculEnCours = "";
                        calculEnCours += touche;
                    }
                    ecranCalcul.textContent = calculEnCours || "0";
                });
                grilleBoutons.appendChild(bouton);
            })(touches[p]);
        }
    }

    boutonModeSci.addEventListener('click', function() {
        modeScientifiqueActive = !modeScientifiqueActive;
        this.textContent = modeScientifiqueActive ? "Mode Standard" : "Mode Scientifique";
        construireCalculatrice();
    });


    // 5. NAVIGATION & COULEURS
    // ---------------------------------------------------------
    var boutonsNav = document.querySelectorAll('.nav-btn');
    var panneaux = document.querySelectorAll('.panel');

    for (var q = 0; q < boutonsNav.length; q++) {
        boutonsNav[q].addEventListener('click', function() {
            if (navigator.vibrate) { navigator.vibrate(10); }
            var cible = this.getAttribute('data-target');

            // Reset classes active
            for (var r = 0; r < boutonsNav.length; r++) boutonsNav[r].classList.remove('active');
            for (var s = 0; s < panneaux.length; s++) panneaux[s].classList.remove('active');

            // Activation
            document.getElementById(cible).classList.add('active');
            // Active tous les boutons qui pointent vers cette cible (desktop & mobile)
            var liensActifs = document.querySelectorAll('[data-target="' + cible + '"]');
            for (var t = 0; t < liensActifs.length; t++) liensActifs[t].classList.add('active');
        });
    }

    var pointsCouleur = document.querySelectorAll('.color-dot');
    for (var u = 0; u < pointsCouleur.length; u++) {
        pointsCouleur[u].addEventListener('click', function() {
            if (navigator.vibrate) { navigator.vibrate(10); }
            var couleur = this.getAttribute('data-color');
            
            document.documentElement.style.setProperty('--primary', couleur);
            localStorage.setItem('preference_accent', couleur);

            // Mise à jour visuelle du point actif
            for (var v = 0; v < pointsCouleur.length; v++) pointsCouleur[v].classList.remove('active');
            this.classList.add('active');

            // Calcul de la couleur dim (transparente)
            var r = parseInt(couleur.slice(1, 3), 16);
            var g = parseInt(couleur.slice(3, 5), 16);
            var b = parseInt(couleur.slice(5, 7), 16);
            document.documentElement.style.setProperty('--primary-dim', 'rgba(' + r + ',' + g + ',' + b + ', 0.15)');
        });
    }

    // Chargement couleur sauvegardée
    var accentSauvegarde = localStorage.getItem('preference_accent');
    if (accentSauvegarde) {
        // Simuler le clic sur le bon point pour tout activer
        var pointCible = document.querySelector('.color-dot[data-color="' + accentSauvegarde + '"]');
        if (pointCible) pointCible.click();
    }

    // Bouton Reset
    document.getElementById('btn-reset').addEventListener('click', function() {
        if (confirm("Voulez-vous vraiment tout réinitialiser ?")) {
            localStorage.clear();
            window.location.reload();
        }
    });

    // Lancement Initial
    boutonsCategories[0].click(); // Active Longueur
    construireCalculatrice(); // Affiche les touches
});