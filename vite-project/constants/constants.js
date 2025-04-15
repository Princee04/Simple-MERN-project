const devices = {
  "PC de bureau": {
    components: [
      {
        name: "Processeur",
        options: [
          // Pentium (entrée de gamme, ancien)
          "Pentium 4",
          "Pentium D",
          "Pentium E5700",
          "Pentium G4400",
          "Pentium G4560",

          // Core 2 Duo (ancien, mais toujours fonctionnel)
          "Core 2 Duo E6300",
          "Core 2 Duo E7500",
          "Core 2 Duo E8400",

          // Core i3 (entrée de gamme moderne)
          "Core i3-2100",
          "Core i3-6100",
          "Core i3-10100",
          "Core i3-12100",

          // Core i5 (milieu de gamme)
          "Core i5-2500K",
          "Core i5-7400",
          "Core i5-9600K",
          "Core i5-11600K",
          "Core i5-12400",

          // Core i7 (haut de gamme)
          "Core i7-2600K",
          "Core i7-7700K",
          "Core i7-9700K",
          "Core i7-11700K",
          "Core i7-13700",

          // Core i9 (très haut de gamme)
          "Core i9-9900K",
          "Core i9-10900K",
          "Core i9-11900K",
          "Core i9-12900K",
          "Core i9-13900K",

          // Ryzen 3 (entrée de gamme moderne)
          "Ryzen 3 3200G",

          // Ryzen 5 (milieu de gamme moderne)
          "Ryzen 5 3600",
          "Ryzen 5 5600X",

          // Ryzen 7 (haut de gamme moderne)
          "Ryzen 7 3700X",
          "Ryzen 7 5800X",

          // Ryzen 9 (très haut de gamme moderne)
          "Ryzen 9 5900X",
          "Ryzen 9 7900X",
        ],
      },
      
      // { name: "Carte mère" ,options:['Nouveau','Ancien']},
      {
        name: "RAM",
        options: ["Ko", "Mo", "Go", "To"],
        capacity: " ",
        type: "number",
      },
      // { name: "Carte graphique" },
      {
        name: "Stockage",
        options: ["HDD", "Sata |||(SSD)", "NVMe(SSD)", "PCle Gen 4.0"],
        capacity: " ",
        type: "number",
      },
      // { name: "Alimentation" },
      // { name: "Boîtier" },
      {
        name: "Système d’exploitation",
        options: [
          "Windows 95",
          "Windows 98",
          "Windows Me",
          "Windows XP",
          "Windows Vista",
          "Windows 7",
          "Windows 10",
          "Windows 11",
          "Linux",
          "Mac",
        ],
        expirationsDate: [
          "2001/12/31", // Windows 95
          "2006/07/11", // Windows 98
          "2006/07/11", // Windows Me
          "2014/04/08", // Windows XP
          "2017/04/11", // Windows Vista
          "2020/01/14", // Windows 7
          "2025/10/14", // Windows 10 (estimée)
          "2029", // Windows 11 (estimée)
          "2100", // Linux
          "2100", // Mac
        ],
      },
    ],
  },
  "PC portable": {
    components: [
      {
        name: "Processeur",
        options: [
          // Pentium (entrée de gamme, ancien)
          "Pentium 4",
          "Pentium D",
          "Pentium E5700",
          "Pentium G4400",
          "Pentium G4560",

          // Core 2 Duo (ancien, mais toujours fonctionnel)
          "Core 2 Duo E6300",
          "Core 2 Duo E7500",
          "Core 2 Duo E8400",

          // Core i3 (entrée de gamme moderne)
          "Core i3-2100",
          "Core i3-6100",
          "Core i3-10100",
          "Core i3-12100",

          // Core i5 (milieu de gamme)
          "Core i5-2500K",
          "Core i5-7400",
          "Core i5-9600K",
          "Core i5-11600K",
          "Core i5-12400",

          // Core i7 (haut de gamme)
          "Core i7-2600K",
          "Core i7-7700K",
          "Core i7-9700K",
          "Core i7-11700K",
          "Core i7-13700",

          // Core i9 (très haut de gamme)
          "Core i9-9900K",
          "Core i9-10900K",
          "Core i9-11900K",
          "Core i9-12900K",
          "Core i9-13900K",

          // Ryzen 3 (entrée de gamme moderne)
          "Ryzen 3 3200G",

          // Ryzen 5 (milieu de gamme moderne)
          "Ryzen 5 3600",
          "Ryzen 5 5600X",

          // Ryzen 7 (haut de gamme moderne)
          "Ryzen 7 3700X",
          "Ryzen 7 5800X",

          // Ryzen 9 (très haut de gamme moderne)
          "Ryzen 9 5900X",
          "Ryzen 9 7900X",
        ],
      },
      // { name: "Carte mère" ,options:['Nouveau','Ancien']},
      {
        name: "RAM",
        options: ["Ko", "Mo", "Go", "To"],
        capacity: " ",
        type: "number",
      },
      // { name: "Carte graphique" },
      {
        name: "Stockage",
        options: ["HDD", "Sata |||(SSD)", "NVMe(SSD)", "PCle Gen 4.0"],
        capacity: " ",
        type: "number",
      },
      // { name: "Alimentation" },
      // { name: "Boîtier" },

      {
        name: "Batterie",
        capacity: " ",
        options: ["MAh", "Ah"],
        type: "number",
      },
      { name: "Écran", capacity: " ", options: ["pouces"] },
      { name: "Clavier", options: ["AZERTY", "QWERTY"] },
      {
        name: "Touchpad",
        options: [
          "Type (multi-touch/sans bouton)",
          "Surface",
          "Sensibilité",
          "Fonctions supplémentaires",
        ],
      },
      {
        name: "Système d’exploitation",
        options: [
          "Windows 95",
          "Windows 98",
          "Windows Me",
          "Windows XP",
          "Windows Vista",
          "Windows 7",
          "Windows 10",
          "Windows 11",
          "Linux",
          "Mac",
        ],

        expirationsDate: [
          "31 décembre 2001", // Windows 95
          "11 juillet 2006", // Windows 98
          "11 juillet 2006", // Windows Me
          "8 avril 2014", // Windows XP
          "11 avril 2017", // Windows Vista
          "14 janvier 2020", // Windows 7
          "14 octobre 2025", // Windows 10 (estimée)
          "2029", // Windows 11 (estimée)
          "Variable selon la distribution", // Linux
          "Variable selon la version (5 à 7 ans après la sortie)", // Mac
        ],
      },
    ],
  },

  "Station de travail": {
    components: [
      {
        name: "Processeur",
        options: [
          // Pentium (entrée de gamme, ancien)
          "Pentium 4",
          "Pentium D",
          "Pentium E5700",
          "Pentium G4400",
          "Pentium G4560",

          // Core 2 Duo (ancien, mais toujours fonctionnel)
          "Core 2 Duo E6300",
          "Core 2 Duo E7500",
          "Core 2 Duo E8400",

          // Core i3 (entrée de gamme moderne)
          "Core i3-2100",
          "Core i3-6100",
          "Core i3-10100",
          "Core i3-12100",

          // Core i5 (milieu de gamme)
          "Core i5-2500K",
          "Core i5-7400",
          "Core i5-9600K",
          "Core i5-11600K",
          "Core i5-12400",

          // Core i7 (haut de gamme)
          "Core i7-2600K",
          "Core i7-7700K",
          "Core i7-9700K",
          "Core i7-11700K",
          "Core i7-13700",

          // Core i9 (très haut de gamme)
          "Core i9-9900K",
          "Core i9-10900K",
          "Core i9-11900K",
          "Core i9-12900K",
          "Core i9-13900K",

          // Ryzen 3 (entrée de gamme moderne)
          "Ryzen 3 3200G",

          // Ryzen 5 (milieu de gamme moderne)
          "Ryzen 5 3600",
          "Ryzen 5 5600X",

          // Ryzen 7 (haut de gamme moderne)
          "Ryzen 7 3700X",
          "Ryzen 7 5800X",

          // Ryzen 9 (très haut de gamme moderne)
          "Ryzen 9 5900X",
          "Ryzen 9 7900X",
        ],
      },
      // { name: "Carte mère" },
      {
        name: "RAM",
        options: ["Ko", "Mo", "Go", "To"],
        capacity: " ",
        type: "number",
      },
      // { name: "Carte graphique", detail: "professionnelle" },
      { name: "Stockage", options: ["HDD", "SSD"], capacity: " " },
      { name: "Alimentation", options: ["robuste"] },
      { name: "Refroidissement", options: ["avancé"] },
    ],
  },
  Serveur: {
    components: [
      {
        name: "Processeur",
        options: ["Intel Xeon", "AMD EPYC", "GRAVITON(AWS)"],
      },
      {
        name: "Carte mère",
        options: [
          "SuperMicro",
          "ASUS SERVER",
          "TUF",
          "WS",
          "GIGABYTE SERVER",
          "ASROCK RACK",
          "DEll",
          "HP",
          "LENOVO(OEM)",
        ],
      },
      {
        name: "RAM",
        capacity: " ",
        type: "number",
        options: [
          "UDIMM (Unbuffered DIMM)",
          "RDIMM (Registered DIMM)",
          "LRDIMM (Load-Reduced DIMM)",
          "ECC",
        ],
      },
      {
        name: "Baies de stockage",
        options: [
          "DAS (Direct Attached Storage)",
          "NAS (Network Attached Storage)",
          "SAN (Storage Area Network)",
        ],
      },
      {
        name: "Alimentation",
        options: ["Standard (ATX)", "Redondante (1+1, 2+1, etc.)", "Hot-Plug"],
      },
      {
        name: "Carte réseau",
        options: [
          "10GbpsNIC intégrée",
          "NIC PCIe dédiée (ex: Intel X550-T2)",
          "Carte SFP+/QSFP+",
          "SmartNIC (NVIDIA BlueField, etc.)",
        ],
      },
    ],
  },
  Écran: {
    components: [
      { name: "Taille", capacity: " ", type: "number", options: ["pouces"] },
      {
        name: "Résolution",
        options: ["1920x1080 (Full HD)", "2560x1440 (QHD),", "3840x2160 (4K)"],
      },
      {
        name: "Taux de rafraîchissement",
        options: [
          "60Hz",
          "75Hz",
          "120Hz",
          "144Hz",
          "240Hz et +",
          "Variable(freeSync/G-sync)",
        ],
      },
      { name: "Connectique", options: ["HDMI", "DisplayPort", "VGA"] },
      { name: "Technologie", options: ["IPS", "TN", "OLED"] },
    ],
  },
  Clavier: {
    components: [
      {
        name: "Type",
        options: [
          "mécanique",
          "membrane",
          "sans fil",
          "ergonomique",
          "compact(tenkeyless)",
        ],
      },
      { name: "Disposition", options: ["AZERTY", "QWERTY"] },
      {
        name: "Rétroéclairage",
        options: ["Monochrome", "RGB(rainbow)", "Zone de retroéclerage"],
      },
    ],
  },
  Souris: {
    components: [
      {
        name: "Type",
        options: [
          "optique",
          "laser",
          "sans fil",
          "filaire",
          "ergonomique",
          "Gaming",
          "Trackball",
        ],
      },

      { name: "Boutons programmables", options: ["avec", "sans"] },
    ],
  },
  Imprimante: {
    components: [
      {
        name: "Type",
        options: [
          "laser",
          "jet d'encre",
          "Matricielle",
          "Imprimante 3D",
          "Thermique",
        ],
      },
      { name: "Couleur", options: ["Couleur", "Monochrome"] },
      {
        name: "Résolution d'impression",
        options: ["300 dpi", "600 dpi", "1200 dpi et +"],
      },
      { name: "Connectique", options: ["USB", "Wi-Fi"] },
    ],
  },
  Scanner: {
    components: [
      {
        name: "Type",
        options: [
          "à plat",
          "feuille",
          "à alimentation",
          "portable",
          "Scanner de film",
          "Scanner 3D",
          "Scanner de poche",
        ],
      },
      {
        name: "Résolution",
        options: ["300 dpi", "600 dpi", "1200 dpi", "2400 dpi et +"],
      },
      // { name: "Connectique" },
    ],
  },

  "Disque dur externe": {
    components: [
      {
        name: "Capacité",
        type: "number",
        capacity: " ",
        options: ["Ko", "Mo", "Go", "To"],
      },
      { name: "Type", options: ["HDD", "SSD"] },
      { name: "Connectique", options: ["USB Tashibo", "USB type C"] },
    ],
  },

  NAS: {
    components: [
      {
        name: "type",
        options: [
          "RAID 0",
          "RAID 1",
          "RAID 5",
          "RAID 6",
          "RAID 10(ou RAID 1+0)",
        ],
      },
      { name: "Baies de stockage", options: ["SSD", "HDD"] },
      { name: "Connectivité", options: ["Ethernet", "USB"] },
    ],
  },
  Routeur: {
    components: [
      {
        name: "type",
        options: ["Domestique", "Professionnel", "Sans-Fils", "De couche 3"],
      },
      {
        name: "Norme Wi-Fi",
        options: [
          "Wi-Fi 1 (802.11b)",
          "Wi-Fi 2 (802.11a)",
          "Wi-Fi 3 (802.11g)",
          "Wi-Fi 4 (802.11n)",
          "Wi-Fi 5 (802.11ac)",
          "Wi-Fi 6 (802.11ax)",
          "Wi-Fi 6E",
        ],
      },
      {
        name: "Bande passante",
        capacity: " ",
        options: ["kbps", "Mbps", "Gbps"],
      },
      {
        name: "Nombre de ports",
        capacity: " ",
        type: "number",
        options: ["LAN", "WAN"],
      },
      { name: "Sécurité", options: ["Aucun", "WPA2", "WPA3"] },
    ],
  },
  Switch: {
    components: [
      {
        name: "Type",
        options: [
          "Non managé",
          "Managé",
          "Switch PoE (Power over Ethernet)",
          "Switch empilable",
          " Switch Layer 3 (L3)",
        ],
      },
      { name: "Nombre de ports", type: "number", capacity: " " },
      {
        name: "Débit",
        capacity: " ",
        type: "number",
        options: ["Kbps", "Gbps", "Mbps"],
      },
    ],
  },

  Vidéoprojecteur: {
    components: [
      {
        name: "type",
        options: [
          "DLP (Digital Light Processing)",
          "LCD (Liquid Crystal Display)",
          "LCoS (Liquid Crystal on Silicon)",
          "LED",
          "LASER",
        ],
      },
      {
        name: "Résolution",
        options: [
          "SVGA (800x600)",
          "HD (1280x720)",
          "Full HD (1920x1080)",
          "4K (3840x2160)",
          "WUXGA (1920x1200) ",
        ],
      },
      {
        name: "Luminosité",
        options: [
          "2500-3000 lumens ",
          "3000-4000 lumens",
          "5000 lumens et plus",
        ],
      },
      { name: "Contraste", type: "number" },
      {
        name: "Connectique",
        options: ["HDMI", "VGA", "WIFI", "Bluetooth", "USB"],
      },
    ],
  },
  Onduleur: {
    components: [
      {
        name: "Type",
        options: [
          "Onduleur à ligne interactive ",
          "Onduleur à double conversion (ou onduleur en mode full-bridge)",
          "Onduleur hors ligne (standby)",
        ],
      },
      { name: "Puissance", capacity: " ", options: ["VA", "W", "KVA", "KW"] },
      // { name: "Autonomie" },
      { name: "Nombre de prises", type: "number" },
    ],
  },
  // "Casque audio": {
  //   components: [
  //     { name: "Type", options: ["filaire", "sans fil"] },
  //     { name: "Réduction de bruit" },
  //     { name: "Autonomie", condition: "si sans fil" },
  //   ],
  // },
};

export default devices;
