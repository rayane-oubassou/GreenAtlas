import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Report from '../models/Report';
import WaterData from '../models/WaterData';
import ForestData from '../models/ForestData';
import Notification from '../models/Notification';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/greenatlas';

// ── Helpers ────────────────────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function rand(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

function waterStatus(level: number): 'critical' | 'low' | 'normal' | 'high' {
  if (level < 20) return 'critical';
  if (level < 40) return 'low';
  if (level < 80) return 'normal';
  return 'high';
}

// Scoring constants (must match server/src/utils/scoring.ts)
const CAT_PTS: Record<string, number> = {
  wildfire: 30, illegal_logging: 20, water_leak: 15, pollution: 10,
};
const VERIFIED_BONUS = 20;
const RESOLVED_BONUS = 10;

function reportScore(category: string, status: string): number {
  const base = CAT_PTS[category] ?? 10;
  if (status === 'verified')  return base + VERIFIED_BONUS;
  if (status === 'resolved')  return base + VERIFIED_BONUS + RESOLVED_BONUS;
  return base;
}

function computeBadges(reports: { category: string; status: string }[], score: number): string[] {
  const total     = reports.length;
  const wildfire  = reports.filter(r => r.category === 'wildfire').length;
  const logging   = reports.filter(r => r.category === 'illegal_logging').length;
  const water     = reports.filter(r => r.category === 'water_leak').length;
  const verified  = reports.filter(r => r.status === 'verified' || r.status === 'resolved').length;
  const badges: string[] = [];
  if (total    >= 1)   badges.push('first_report');
  if (wildfire >= 3)   badges.push('fire_watcher');
  if (logging  >= 3)   badges.push('forest_guardian');
  if (water    >= 3)   badges.push('water_sentinel');
  if (total    >= 10)  badges.push('eco_warrior');
  if (verified >= 5)   badges.push('verified_hero');
  if (score    >= 100) badges.push('top_ranger');
  return badges;
}

// ── Seed ───────────────────────────────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}), Report.deleteMany({}),
    WaterData.deleteMany({}), ForestData.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Users ─────────────────────────────────────────────────────────────
  const [adminPwd, agentPwd, citizenPwd] = await Promise.all([
    bcrypt.hash('Admin@123', 12),
    bcrypt.hash('Agent@123', 12),
    bcrypt.hash('Citizen@123', 12),
  ]);

  const [
    admin, agent1, agent2,
    karim, fatima, omar, aicha, youssef, nadia, hassan, sara, mehdi,
  ] = await User.insertMany([
    { name: 'Admin GreenAtlas',       email: 'admin@greenatlas.ma',   password: adminPwd,   role: 'admin'   },
    { name: 'Agent Forestier',        email: 'agent@greenatlas.ma',   password: agentPwd,   role: 'agent'   },
    { name: 'Amina Berrada',          email: 'amina@greenatlas.ma',   password: agentPwd,   role: 'agent'   },
    { name: 'Karim Benali',           email: 'karim@example.com',     password: citizenPwd, role: 'citizen' },
    { name: 'Fatima Zahra El Mansouri', email: 'fatima@example.com',  password: citizenPwd, role: 'citizen' },
    { name: 'Omar Tazi',              email: 'omar@example.com',      password: citizenPwd, role: 'citizen' },
    { name: 'Aicha Moussaoui',        email: 'aicha@example.com',     password: citizenPwd, role: 'citizen' },
    { name: 'Youssef Idrissi',        email: 'youssef@example.com',   password: citizenPwd, role: 'citizen' },
    { name: 'Nadia Belkadi',          email: 'nadia@example.com',     password: citizenPwd, role: 'citizen' },
    { name: 'Hassan Amrani',          email: 'hassan@example.com',    password: citizenPwd, role: 'citizen' },
    { name: 'Sara Boutahar',          email: 'sara@example.com',      password: citizenPwd, role: 'citizen' },
    { name: 'Mehdi Chraibi',          email: 'mehdi@example.com',     password: citizenPwd, role: 'citizen' },
  ]);
  console.log('👥 Created 12 users');

  // ── Reports ──────────────────────────────────────────────────────────
  // prettier-ignore
  const reportDefs = [
    // ── KARIM (16 reports) ──────────────────────────────────────────
    {
      title: 'Incendie détecté près de la forêt de cèdres – versant nord',
      description: 'Un départ de feu a été observé sur le versant nord de la forêt de cèdres de Michlifen. Les flammes se propagent rapidement en raison du vent fort. Intervention urgente requise.',
      category: 'wildfire', latitude: 33.5321, longitude: -5.1234, status: 'resolved', user: karim._id, createdAt: daysAgo(90),
    },
    {
      title: 'Coupe illégale de cèdres centenaires – route P7105',
      description: 'Plusieurs cèdres estimés à plus de 300 ans ont été abattus illégalement sur la route forestière P7105. Des traces fraîches de tronçonneuses sont visibles sur les souches.',
      category: 'illegal_logging', latitude: 33.4856, longitude: -5.0923, status: 'resolved', user: karim._id, createdAt: daysAgo(82),
    },
    {
      title: 'Fuite majeure – conduite principale Ain Vittel',
      description: 'Une importante fuite est visible sur la canalisation principale du quartier résidentiel nord. L\'eau coule en surface depuis plus de 48 heures, causant des dégâts sur la chaussée.',
      category: 'water_leak', latitude: 33.5128, longitude: -5.1456, status: 'resolved', user: karim._id, createdAt: daysAgo(75),
    },
    {
      title: 'Déversement de déchets chimiques – Oued Tizguit',
      description: 'Des déchets chimiques non identifiés ont été déversés dans l\'Oued Tizguit. L\'eau présente une couleur orangée anormale et une odeur âcre. La faune aquatique est menacée.',
      category: 'pollution', latitude: 33.5045, longitude: -5.0789, status: 'resolved', user: karim._id, createdAt: daysAgo(68),
    },
    {
      title: 'Fumée dense – Zone protégée Parc National',
      description: 'Une colonne de fumée noire s\'élève depuis la zone protégée du parc national. La source semble être un feu de sous-bois qui risque de se propager aux cèdres.',
      category: 'wildfire', latitude: 33.5589, longitude: -5.1678, status: 'resolved', user: karim._id, createdAt: daysAgo(60),
    },
    {
      title: 'Abattage de pins – accès piste Ras El Ma',
      description: 'Un camion a été aperçu chargeant des troncs coupés illégalement près de la piste de Ras El Ma. Plaques d\'immatriculation partiellement relevées.',
      category: 'illegal_logging', latitude: 33.4923, longitude: -5.1345, status: 'verified', user: karim._id, createdAt: daysAgo(55),
    },
    {
      title: 'Pollution plastique massive – rives Lac Dayet Aoua',
      description: 'Suite aux pluies du week-end, d\'importantes quantités de déchets plastiques ont été charriées sur les rives du lac Dayet Aoua. La zone de nidification des hérons est directement affectée.',
      category: 'pollution', latitude: 33.4434, longitude: -5.0123, status: 'verified', user: karim._id, createdAt: daysAgo(48),
    },
    {
      title: 'Fuite – réseau secondaire quartier Al Amal',
      description: 'Fuite sur le réseau secondaire dans le quartier Al Amal. La pression en eau est fortement réduite pour une vingtaine de foyers. La fuite semble provenir d\'un joint défectueux.',
      category: 'water_leak', latitude: 33.5267, longitude: -5.1067, status: 'resolved', user: karim._id, createdAt: daysAgo(42),
    },
    {
      title: 'Incendie maîtrisé – versant Azrou nord',
      description: 'Un incendie a été rapidement contenu grâce à l\'intervention des riverains. La végétation sèche sur ce versant constitue un risque persistant. Des patrouilles régulières sont demandées.',
      category: 'wildfire', latitude: 33.4312, longitude: -5.2234, status: 'resolved', user: karim._id, createdAt: daysAgo(35),
    },
    {
      title: 'Rejet d\'eaux usées industrielles – source naturelle',
      description: 'Des eaux usées non traitées sont rejetées directement depuis la zone artisanale vers une source naturelle utilisée par les habitants. Risque sanitaire avéré.',
      category: 'pollution', latitude: 33.5178, longitude: -5.0934, status: 'pending', user: karim._id, createdAt: daysAgo(28),
    },
    {
      title: 'Déforestation zone tampon – Ain Leuh',
      description: 'La zone tampon entre le parc national et les terres agricoles près d\'Ain Leuh est en cours de déboisement non autorisé. Plusieurs hectares ont déjà été défrichés.',
      category: 'illegal_logging', latitude: 33.3012, longitude: -5.2987, status: 'resolved', user: karim._id, createdAt: daysAgo(21),
    },
    {
      title: 'Incendie actif – sentier de randonnée Tizguit',
      description: 'Un incendie actif a été signalé sur le sentier de randonnée longeant l\'oued Tizguit. Les pompiers ont été alertés. Des randonneurs évacués signalent des flammes de 3 à 4 mètres.',
      category: 'wildfire', latitude: 33.5402, longitude: -5.1521, status: 'verified', user: karim._id, createdAt: daysAgo(15),
    },
    {
      title: 'Conduite enterrée percée – avenue Hassan II',
      description: 'La conduite principale enterrée sous l\'avenue Hassan II présente une rupture. L\'eau remonte en surface créant une flaque de 30 m². Risque pour la circulation.',
      category: 'water_leak', latitude: 33.5310, longitude: -5.1089, status: 'verified', user: karim._id, createdAt: daysAgo(10),
    },
    {
      title: 'Déchets industriels – berges Oued Ouirgane',
      description: 'Des barils non étiquetés ont été abandonnés sur les berges de l\'Oued Ouirgane. Un liquide sombre s\'en écoule lentement vers la rivière. Analyse urgente nécessaire.',
      category: 'pollution', latitude: 33.4789, longitude: -5.1823, status: 'pending', user: karim._id, createdAt: daysAgo(7),
    },
    {
      title: 'Coupe rase non autorisée – zone humide protégée',
      description: 'Une coupe rase de végétation a été effectuée dans une zone humide classée. La destruction de l\'habitat menace plusieurs espèces d\'amphibiens endémiques.',
      category: 'illegal_logging', latitude: 33.4654, longitude: -5.0634, status: 'pending', user: karim._id, createdAt: daysAgo(3),
    },
    {
      title: 'Fuite sur vanne de sectionnement – Zone Nord',
      description: 'La vanne de sectionnement du quartier nord présente un suintement important. Le débit de perte est estimé à plusieurs mètres cubes par heure.',
      category: 'water_leak', latitude: 33.5412, longitude: -5.1302, status: 'pending', user: karim._id, createdAt: daysAgo(1),
    },

    // ── FATIMA (12 reports) ──────────────────────────────────────────
    {
      title: 'Départ de feu – lisière forêt Michlifen',
      description: 'Un départ de feu a été localisé sur la lisière sud de la forêt de Michlifen. Les branches sèches au sol accélèrent la propagation. Signalement urgent.',
      category: 'wildfire', latitude: 33.5567, longitude: -5.1123, status: 'verified', user: fatima._id, createdAt: daysAgo(88),
    },
    {
      title: 'Exploitation forestière illégale – piste de Timahdite',
      description: 'Des engins mécaniques ont été aperçus déboiseurs dans une zone forestière protégée près de Timahdite. L\'accès est une piste non carrossable normalement interdite aux véhicules lourds.',
      category: 'illegal_logging', latitude: 33.4134, longitude: -5.0678, status: 'resolved', user: fatima._id, createdAt: daysAgo(80),
    },
    {
      title: 'Eau de couleur suspecte – fontaine publique',
      description: 'L\'eau de la fontaine publique place de la Marche Verte présente une teinte jaunâtre depuis ce matin. Plusieurs habitants rapportent une odeur de rouille.',
      category: 'water_leak', latitude: 33.5289, longitude: -5.1234, status: 'resolved', user: fatima._id, createdAt: daysAgo(72),
    },
    {
      title: 'Dépôt sauvage d\'huiles usagées – route de Fès',
      description: 'Des bidons d\'huile de vidange ont été abandonnés dans un fossé en bordure de la route de Fès. Le sol environnant est noirci sur plusieurs mètres carrés.',
      category: 'pollution', latitude: 33.5623, longitude: -5.0845, status: 'verified', user: fatima._id, createdAt: daysAgo(64),
    },
    {
      title: 'Incendie de broussailles – abords parc national',
      description: 'Un feu de broussailles s\'est déclenché en bordure du parc national, alimenté par les vents de l\'est. La zone est particulièrement vulnérable en cette saison.',
      category: 'wildfire', latitude: 33.4978, longitude: -5.1567, status: 'verified', user: fatima._id, createdAt: daysAgo(56),
    },
    {
      title: 'Abattage nocturne – cèdres zonés',
      description: 'Des bruits de tronçonneuses ont été entendus de nuit dans la zone des cèdres protégés au nord d\'Ifrane. Le lendemain matin, plusieurs souches fraîches ont été découvertes.',
      category: 'illegal_logging', latitude: 33.5412, longitude: -5.1389, status: 'verified', user: fatima._id, createdAt: daysAgo(50),
    },
    {
      title: 'Pollution sonore et chimique – carrière non déclarée',
      description: 'Une carrière de gravier illégale opère à ciel ouvert en zone forestière. Les poussières de silice et les explosions perturbent la faune et contamine l\'air.',
      category: 'pollution', latitude: 33.4723, longitude: -5.0934, status: 'pending', user: fatima._id, createdAt: daysAgo(43),
    },
    {
      title: 'Rupture canalisation – camping municipal',
      description: 'La canalisation principale alimentant le camping municipal s\'est rompue lors des dernières gelées. L\'inondation risque de détruire les fondations des sanitaires.',
      category: 'water_leak', latitude: 33.5178, longitude: -5.1678, status: 'pending', user: fatima._id, createdAt: daysAgo(36),
    },
    {
      title: 'Feu de forêt naissant – secteur B réserve macaque',
      description: 'Un feu naissant est visible depuis la route d\'Azrou dans le secteur B de la réserve des macaques de Barbarie. Des singes ont été observés en fuite vers le nord.',
      category: 'wildfire', latitude: 33.4589, longitude: -5.2134, status: 'pending', user: fatima._id, createdAt: daysAgo(29),
    },
    {
      title: 'Déversement peinture industrielle – ruisseau tributaire',
      description: 'Un atelier de peinture situé en zone artisanale a déversé ses eaux de rinçage dans le ruisseau tributaire du lac. La tâche colorée est visible sur plus de 200 mètres.',
      category: 'pollution', latitude: 33.5034, longitude: -5.1234, status: 'pending', user: fatima._id, createdAt: daysAgo(22),
    },
    {
      title: 'Coupe de junipères protégés – Ain Leuh est',
      description: 'Des junipères thurifères, espèce protégée, ont été coupés pour alimenter des fours traditionnels à pain. Le déboisement est localisé mais répété.',
      category: 'illegal_logging', latitude: 33.2989, longitude: -5.3012, status: 'pending', user: fatima._id, createdAt: daysAgo(14),
    },
    {
      title: 'Mousse verte anormale – barrage Azzaba',
      description: 'Une prolifération algale verdâtre recouvre la surface du barrage Azzaba. L\'eutrophisation semble liée à des rejets d\'engrais agricoles en amont.',
      category: 'pollution', latitude: 33.5789, longitude: -5.2123, status: 'pending', user: fatima._id, createdAt: daysAgo(5),
    },

    // ── OMAR (9 reports) ─────────────────────────────────────────────
    {
      title: 'Incendie forêt – col de Zad',
      description: 'Un incendie s\'est déclaré au niveau du col de Zad après des travaux de débroussaillage mal maîtrisés. Les flammes ont atteint une superficie estimée à 2 hectares.',
      category: 'wildfire', latitude: 33.4023, longitude: -5.3456, status: 'resolved', user: omar._id, createdAt: daysAgo(85),
    },
    {
      title: 'Transport illégal de bois – camion immatriculé',
      description: 'Un camion-benne portant des troncs non étiquetés a été aperçu quittant la zone forestière protégée vers la nationale. Plaque relevée : 56789-B-5.',
      category: 'illegal_logging', latitude: 33.4712, longitude: -5.1023, status: 'verified', user: omar._id, createdAt: daysAgo(77),
    },
    {
      title: 'Infiltration – réseau eau potable centre-ville',
      description: 'Une infiltration d\'eau est visible le long du trottoir de la rue des Cèdres. Le sol est humide sur une dizaine de mètres, signalant une fuite souterraine.',
      category: 'water_leak', latitude: 33.5334, longitude: -5.1134, status: 'verified', user: omar._id, createdAt: daysAgo(70),
    },
    {
      title: 'Brûlis non autorisé – champs agricoles',
      description: 'Des agriculteurs pratiquent le brûlis de chétives à proximité directe de la zone forestière. Le vent du nord risque de propager le feu vers le couvert boisé.',
      category: 'wildfire', latitude: 33.4867, longitude: -5.0834, status: 'verified', user: omar._id, createdAt: daysAgo(63),
    },
    {
      title: 'Pollution par hydrocarbures – parking zone industrielle',
      description: 'D\'importantes taches d\'huile de moteur s\'écoulent depuis le parking de la zone industrielle vers un caniveau relié directement à l\'oued. Surface polluée estimée à 50 m².',
      category: 'pollution', latitude: 33.5234, longitude: -5.0956, status: 'resolved', user: omar._id, createdAt: daysAgo(55),
    },
    {
      title: 'Fuite réservoir – quartier des écoles',
      description: 'Le réservoir de stockage alimentant le quartier des écoles présente une fissure latérale. Les enfants et riverains n\'ont plus d\'eau courante depuis hier matin.',
      category: 'water_leak', latitude: 33.5189, longitude: -5.1289, status: 'pending', user: omar._id, createdAt: daysAgo(47),
    },
    {
      title: 'Incendie de pâturage – zone tampon',
      description: 'Un incendie de pâturage s\'est déclenché dans la zone tampon entre les terres agricoles et la forêt protégée. Le feu avance vers les premières futaies de cèdres.',
      category: 'wildfire', latitude: 33.5123, longitude: -5.1834, status: 'pending', user: omar._id, createdAt: daysAgo(38),
    },
    {
      title: 'Déforestation riveraine – berges Oued Tizguit',
      description: 'Les berges de l\'Oued Tizguit sont déboisées sur plusieurs centaines de mètres pour permettre le passage de machines agricoles. La ripisylve protectrice est détruite.',
      category: 'illegal_logging', latitude: 33.5067, longitude: -5.0712, status: 'pending', user: omar._id, createdAt: daysAgo(25),
    },
    {
      title: 'Rejets ateliers de tannage – cours d\'eau',
      description: 'Un atelier de tannage artisanal rejette ses eaux de traitement directement dans un cours d\'eau affluent du lac. Les produits chimiques utilisés sont potentiellement dangereux.',
      category: 'pollution', latitude: 33.4856, longitude: -5.1456, status: 'pending', user: omar._id, createdAt: daysAgo(12),
    },

    // ── AICHA (8 reports) ────────────────────────────────────────────
    {
      title: 'Feu de forêt – haute vallée Timahdite',
      description: 'Un feu actif est visible depuis le village de Timahdite. La fumée noire indique que du bois vivant brûle. Les accès sont difficiles pour les engins de lutte.',
      category: 'wildfire', latitude: 33.3978, longitude: -5.0645, status: 'verified', user: aicha._id, createdAt: daysAgo(87),
    },
    {
      title: 'Scierie illégale active – clairière forêt nord',
      description: 'Une scierie mobile a été installée dans une clairière de la forêt nord. Elle opère à plein régime depuis plusieurs jours, produisant des planches vendues localement.',
      category: 'illegal_logging', latitude: 33.5534, longitude: -5.1634, status: 'verified', user: aicha._id, createdAt: daysAgo(79),
    },
    {
      title: 'Coloration anormale – source Ain Vittel',
      description: 'La source Ain Vittel, principale source d\'eau potable du nord de la ville, présente une coloration brunâtre inhabituelle. Une analyse bactériologique est demandée en urgence.',
      category: 'water_leak', latitude: 33.5145, longitude: -5.1423, status: 'resolved', user: aicha._id, createdAt: daysAgo(71),
    },
    {
      title: 'Déversement eaux usées – route de Meknès',
      description: 'Un camion-citerne vidange ses eaux usées sur l\'accotement de la route de Meknès en dehors de toute station agréée. Odeur pestilentielle signalée par plusieurs riverains.',
      category: 'pollution', latitude: 33.5678, longitude: -5.0523, status: 'pending', user: aicha._id, createdAt: daysAgo(62),
    },
    {
      title: 'Incendie de végétation sèche – camping Ifrane',
      description: 'Un feu s\'est déclenché dans la végétation sèche jouxtant le camping municipal. Le feu a rapidement été maîtrisé mais une surveillance s\'impose pour les 48h suivantes.',
      category: 'wildfire', latitude: 33.5289, longitude: -5.1789, status: 'pending', user: aicha._id, createdAt: daysAgo(53),
    },
    {
      title: 'Abattage sélectif chênes verts – zone SIBE',
      description: 'Des chênes verts centenaires sont abattus sélectivement dans une zone d\'intérêt biologique et écologique (SIBE). L\'autorisation est introuvable auprès des autorités forestières.',
      category: 'illegal_logging', latitude: 33.4467, longitude: -5.0834, status: 'verified', user: aicha._id, createdAt: daysAgo(44),
    },
    {
      title: 'Fuite – borne fontaine place principale',
      description: 'La borne-fontaine de la place principale coule en continu depuis 3 jours malgré la fermeture du robinet. Des centaines de litres sont gaspillés chaque heure.',
      category: 'water_leak', latitude: 33.5312, longitude: -5.1034, status: 'pending', user: aicha._id, createdAt: daysAgo(30),
    },
    {
      title: 'Décharge sauvage – talus autoroutier',
      description: 'Une décharge sauvage s\'est constituée sur le talus de l\'échangeur routier. Plastiques, ferrailles et déchets électroniques sont mélangés. Risque d\'incendie par les bouteilles en verre.',
      category: 'pollution', latitude: 33.5534, longitude: -5.0923, status: 'pending', user: aicha._id, createdAt: daysAgo(8),
    },

    // ── YOUSSEF (6 reports) ──────────────────────────────────────────
    {
      title: 'Feux de camp incontrôlés – zone reboisement',
      description: 'Des touristes ont laissé des feux de camp mal éteints dans la zone de reboisement récent. Plusieurs foyers ont redémarré au petit matin alimentés par le vent.',
      category: 'wildfire', latitude: 33.5189, longitude: -5.1934, status: 'verified', user: youssef._id, createdAt: daysAgo(83),
    },
    {
      title: 'Déboisement pour pâturage – flanc sud mont Hebri',
      description: 'La végétation forestière du flanc sud est systématiquement coupée pour étendre les pâturages. Ce processus est en cours depuis plusieurs mois selon les riverains.',
      category: 'illegal_logging', latitude: 33.4923, longitude: -5.1789, status: 'verified', user: youssef._id, createdAt: daysAgo(74),
    },
    {
      title: 'Micro-fissure – château d\'eau principal',
      description: 'Une micro-fissure sur le château d\'eau principal de la ville génère une perte estimée à 2000 litres par jour. La fondation présente des traces d\'humidité récente.',
      category: 'water_leak', latitude: 33.5423, longitude: -5.1167, status: 'resolved', user: youssef._id, createdAt: daysAgo(65),
    },
    {
      title: 'Fumée toxique – incinération déchets plastiques',
      description: 'Des riverains incinèrent des déchets plastiques dans leur terrain en zone périurbaine. La fumée noire chargée de dioxines est transportée vers le quartier résidentiel.',
      category: 'pollution', latitude: 33.5067, longitude: -5.0645, status: 'pending', user: youssef._id, createdAt: daysAgo(52),
    },
    {
      title: 'Début incendie – maquis sec après canicule',
      description: 'Le maquis particulièrement sec après deux semaines sans pluie a pris feu au bord de la route nationale. La propagation est rapide malgré les efforts des passants.',
      category: 'wildfire', latitude: 33.4734, longitude: -5.2456, status: 'pending', user: youssef._id, createdAt: daysAgo(33),
    },
    {
      title: 'Coulée d\'eaux grises – rue du Marché',
      description: 'Des eaux grises s\'écoulent depuis un immeuble commercial directement dans la rue sans passer par le réseau d\'assainissement. Les badauds signalent une odeur de détergent fort.',
      category: 'water_leak', latitude: 33.5234, longitude: -5.1189, status: 'pending', user: youssef._id, createdAt: daysAgo(16),
    },

    // ── NADIA (5 reports) ────────────────────────────────────────────
    {
      title: 'Feu de cèdre isolé – piste Ras El Ma',
      description: 'Un cèdre centenaire a été incendié, probablement par un feu d\'origine anthropique. La carbonisation remonte à environ 24 heures. Les arbres voisins ne sont pas touchés.',
      category: 'wildfire', latitude: 33.5289, longitude: -5.1523, status: 'resolved', user: nadia._id, createdAt: daysAgo(86),
    },
    {
      title: 'Extraction de tourbe – tourbière protégée',
      description: 'De l\'extraction de tourbe est pratiquée illégalement dans la tourbière classée site Ramsar. Les traces d\'extraction récente sont visibles sur plusieurs mètres carrés.',
      category: 'illegal_logging', latitude: 33.4312, longitude: -5.1123, status: 'verified', user: nadia._id, createdAt: daysAgo(73),
    },
    {
      title: 'Incendie approche zone résidentielle',
      description: 'Un incendie de forêt se rapproche dangereusement de la zone résidentielle périphérique. La police a évacué préventivement les maisons en bordure de forêt.',
      category: 'wildfire', latitude: 33.5412, longitude: -5.1634, status: 'pending', user: nadia._id, createdAt: daysAgo(61),
    },
    {
      title: 'Effluents d\'élevage intensif – nappe phréatique',
      description: 'Un élevage hors-sol déverse ses effluents non traités à même le sol, à quelques mètres d\'un puits alimentant une dizaine de foyers ruraux.',
      category: 'pollution', latitude: 33.4567, longitude: -5.2789, status: 'verified', user: nadia._id, createdAt: daysAgo(40),
    },
    {
      title: 'Pollution lumineuse et chimique – serre illégale',
      description: 'Une serre non déclarée fonctionne 24h/24 et déverse des produits phytosanitaires non dilués dans le système d\'irrigation relié au réseau naturel.',
      category: 'pollution', latitude: 33.4823, longitude: -5.1345, status: 'pending', user: nadia._id, createdAt: daysAgo(18),
    },

    // ── HASSAN (4 reports) ───────────────────────────────────────────
    {
      title: 'Incendie de paille stockée en forêt',
      description: 'Un stock de paille entreposé illégalement en lisière de forêt a pris feu. L\'incendie a été contenu mais les cèdres voisins présentent des brûlures superficielles.',
      category: 'wildfire', latitude: 33.5023, longitude: -5.1389, status: 'pending', user: hassan._id, createdAt: daysAgo(89),
    },
    {
      title: 'Feux de camp mal éteints – zone campement sauvage',
      description: 'Des restes de feux de camp ont été trouvés en forêt lors d\'une randonnée matinale. Les braises étaient encore chaudes au toucher. Risque de reprise élevé.',
      category: 'wildfire', latitude: 33.4756, longitude: -5.1678, status: 'pending', user: hassan._id, createdAt: daysAgo(66),
    },
    {
      title: 'Fuite robinet – réseau irrigation publique',
      description: 'Un robinet du réseau d\'irrigation public est resté ouvert depuis plusieurs jours. L\'eau se déverse inutilement sur la route créant une zone glissante et un gaspillage important.',
      category: 'water_leak', latitude: 33.5156, longitude: -5.0978, status: 'verified', user: hassan._id, createdAt: daysAgo(45),
    },
    {
      title: 'Abandon de médicaments périmés – cours d\'eau',
      description: 'Des boîtes de médicaments périmés ont été jetées dans un cours d\'eau alimentant le lac. Les emballages flottent et les principes actifs contaminent l\'eau potable en aval.',
      category: 'pollution', latitude: 33.4934, longitude: -5.0523, status: 'pending', user: hassan._id, createdAt: daysAgo(20),
    },

    // ── SARA (3 reports) ─────────────────────────────────────────────
    {
      title: 'Panache de fumée inexpliqué – forêt Michlifen',
      description: 'Un panache de fumée blanche s\'élève depuis la forêt de Michlifen en direction du nord. L\'origine n\'est pas encore identifiée mais la saison sèche accroît les risques.',
      category: 'wildfire', latitude: 33.5512, longitude: -5.1378, status: 'pending', user: sara._id, createdAt: daysAgo(81),
    },
    {
      title: 'Fuite importante – tuyau principal avenue royale',
      description: 'Un tuyau principal a éclaté sous l\'avenue royale. L\'eau jaillit en fontaine et inonde la chaussée. La circulation est perturbée sur 100 mètres.',
      category: 'water_leak', latitude: 33.5289, longitude: -5.1145, status: 'pending', user: sara._id, createdAt: daysAgo(57),
    },
    {
      title: 'Déchets plastiques – abords piste VTT',
      description: 'La piste VTT du parc national est jonchée de déchets plastiques laissés par des visiteurs du week-end. Les bouteilles et emballages s\'accumulent dans les bas-côtés.',
      category: 'pollution', latitude: 33.4689, longitude: -5.1567, status: 'pending', user: sara._id, createdAt: daysAgo(9),
    },

    // ── MEHDI (2 reports) ────────────────────────────────────────────
    {
      title: 'Fumée visible depuis la nationale – Sidi Addi',
      description: 'Depuis la route nationale, une fumée est visible depuis le village de Sidi Addi en direction de la forêt. Les habitants locaux ne sont pas au courant de travaux autorisés dans ce secteur.',
      category: 'wildfire', latitude: 33.4289, longitude: -5.1934, status: 'pending', user: mehdi._id, createdAt: daysAgo(76),
    },
    {
      title: 'Bûcheron surpris – zone de réserve intégrale',
      description: 'Un individu a été surpris en train d\'abattre un arbre dans la réserve intégrale du parc national. Il a pris la fuite à l\'approche du témoin.',
      category: 'illegal_logging', latitude: 33.5134, longitude: -5.1723, status: 'pending', user: mehdi._id, createdAt: daysAgo(32),
    },
  ];

  const reports = await Report.insertMany(reportDefs as any[]);
  console.log(`📋 Created ${reports.length} reports`);

  // ── Compute and apply Green Scores + Badges ────────────────────────
  const scoreMap = new Map<string, number>();
  const userReports = new Map<string, { category: string; status: string }[]>();

  for (const r of reportDefs) {
    const uid = r.user.toString();
    const pts = reportScore(r.category, r.status);
    scoreMap.set(uid, (scoreMap.get(uid) ?? 0) + pts);
    if (!userReports.has(uid)) userReports.set(uid, []);
    userReports.get(uid)!.push({ category: r.category, status: r.status });
  }

  const bulkOps = [];
  for (const [uid, score] of scoreMap) {
    const reps = userReports.get(uid) ?? [];
    const badges = computeBadges(reps, score);
    bulkOps.push({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(uid) },
        update: { $set: { greenScore: score, badges } },
      },
    });
  }
  await User.bulkWrite(bulkOps);
  console.log('🏆 Applied Green Scores and badges');

  // ── Water data (30 days × 6 sources) ──────────────────────────────
  const now = new Date();
  const waterSources = [
    { source: 'Lac Dayet Aoua',    location: 'Ifrane Nord',  base: 62, trend: -0.25 },
    { source: 'Oued Tizguit',      location: 'Ifrane Centre', base: 48, trend: -0.18 },
    { source: 'Source Ain Vittel', location: 'Ifrane Ville',  base: 71, trend: -0.20 },
    { source: 'Barrage Azzaba',    location: 'Azrou',         base: 55, trend: -0.30 },
    { source: 'Oued Ouirgane',     location: 'Ain Leuh',      base: 38, trend: -0.15 },
    { source: 'Source Tizguit',    location: 'Ifrane Sud',    base: 83, trend: -0.10 },
  ];

  const waterEntries = [];
  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    date.setHours(6, 0, 0, 0);
    for (const src of waterSources) {
      const level = Math.max(5, Math.min(98, src.base + (Math.random() - 0.5) * 12 - day * src.trend));
      const lv = Math.round(level * 10) / 10;
      waterEntries.push({ level: lv, location: src.location, source: src.source, timestamp: date, status: waterStatus(lv) });
    }
  }
  await WaterData.insertMany(waterEntries);
  console.log(`💧 Created ${waterEntries.length} water data points (6 sources × 30 days)`);

  // ── Forest data (30 days × 6 zones) ───────────────────────────────
  const forestZones = [
    { location: 'Forêt de Cèdres – Zone Nord',        area: 1200 },
    { location: 'Parc National Ifrane – Secteur A',   area: 850  },
    { location: 'Forêt de Cèdres – Zone Sud',         area: 950  },
    { location: 'Azrou – Zone Forestière',             area: 670  },
    { location: 'Michlifen – Forêt de Résineux',       area: 780  },
    { location: 'Ain Leuh – Forêt de Genévriers',      area: 430  },
  ];
  const riskLevels = ['Low', 'Medium', 'High', 'Very High', 'Extreme'] as const;
  const forestEntries = [];

  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    date.setHours(8, 0, 0, 0);
    const temp     = rand(12, 32);
    const humidity = rand(22, 72);
    const wind     = rand(3, 30);
    const score    = Math.max(0, (temp - 10) * 1.5) + Math.max(0, (60 - humidity) * 0.8) + wind * 1.2;
    const riskIdx  = score >= 80 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : score >= 20 ? 1 : 0;

    for (const zone of forestZones) {
      const zoneVariance = (Math.random() - 0.5) * 8;
      const zoneTemp     = Math.round((temp + zoneVariance) * 10) / 10;
      const zoneHumidity = Math.max(10, Math.min(95, Math.round((humidity + (Math.random() - 0.5) * 10) * 10) / 10));
      const zoneWind     = Math.max(0, Math.round((wind + (Math.random() - 0.5) * 5) * 10) / 10);
      const zoneScore    = Math.max(0, (zoneTemp - 10) * 1.5) + Math.max(0, (60 - zoneHumidity) * 0.8) + zoneWind * 1.2;
      const zoneRiskIdx  = zoneScore >= 80 ? 4 : zoneScore >= 60 ? 3 : zoneScore >= 40 ? 2 : zoneScore >= 20 ? 1 : 0;
      forestEntries.push({
        fireRiskLevel: riskLevels[zoneRiskIdx],
        healthIndex:   Math.round((60 + Math.random() * 35) * 10) / 10,
        location: zone.location, area: zone.area,
        temperature: zoneTemp, humidity: zoneHumidity, windSpeed: zoneWind,
        timestamp: date,
      });
    }
  }
  await ForestData.insertMany(forestEntries);
  console.log(`🌲 Created ${forestEntries.length} forest data points (6 zones × 30 days)`);

  // ── Notifications ──────────────────────────────────────────────────
  const staffIds = [agent1._id, agent2._id, admin._id];
  const notifDefs = [
    // New report notifications to agents/admin
    ...reports.slice(0, 8).flatMap((r: any) =>
      staffIds.map(sid => ({
        message: `Nouveau signalement – ${(r as any).category.replace(/_/g, ' ')}: "${(r as any).title}"`,
        type: 'new_report' as const, recipient: sid, report: r._id, read: false,
      }))
    ),
    // Status update notifications to citizens
    {
      message: `Votre signalement "${reports[0].title}" a été vérifié et marqué comme résolu.`,
      type: 'status_update' as const, recipient: karim._id, report: reports[0]._id, read: true,
    },
    {
      message: `Votre signalement "${reports[2].title}" est maintenant résolu.`,
      type: 'status_update' as const, recipient: karim._id, report: reports[2]._id, read: true,
    },
    {
      message: `Votre signalement "${reports[16].title}" a été vérifié par un agent.`,
      type: 'status_update' as const, recipient: fatima._id, report: reports[16]._id, read: false,
    },
    {
      message: `Votre signalement "${reports[25].title}" est résolu – merci pour votre vigilance !`,
      type: 'status_update' as const, recipient: omar._id, report: reports[25]._id, read: false,
    },
    // Alert notifications (broadcast)
    {
      message: `⚠️ Alerte rouge : risque incendie extrême prévu pour les prochaines 48h – vents forts et sécheresse.`,
      type: 'alert' as const, recipient: agent1._id, read: false,
    },
    {
      message: `⚠️ Alerte rouge : risque incendie extrême prévu pour les prochaines 48h – vents forts et sécheresse.`,
      type: 'alert' as const, recipient: agent2._id, read: false,
    },
    {
      message: `⚠️ Alerte rouge : risque incendie extrême prévu pour les prochaines 48h – vents forts et sécheresse.`,
      type: 'alert' as const, recipient: admin._id, read: false,
    },
    {
      message: `🏆 Karim Benali a atteint le rang #1 du classement Green Score ce mois-ci !`,
      type: 'info' as const, recipient: admin._id, read: false,
    },
    {
      message: `📋 15 nouveaux signalements ont été soumis cette semaine dans la région d'Ifrane.`,
      type: 'info' as const, recipient: agent1._id, read: false,
    },
    {
      message: `✅ Félicitations ! Votre rapport a été vérifié et vous avez gagné +20 points verts.`,
      type: 'info' as const, recipient: karim._id, read: false,
    },
    {
      message: `🥉 Vous êtes maintenant classé #3 sur le tableau des contributeurs environnementaux.`,
      type: 'info' as const, recipient: omar._id, read: false,
    },
    {
      message: `💧 Niveau critique détecté sur Oued Ouirgane – intervention recommandée.`,
      type: 'alert' as const, recipient: agent2._id, read: false,
    },
  ];

  await Notification.insertMany(notifDefs);
  console.log(`🔔 Created ${notifDefs.length} notifications`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📌 Login credentials:');
  console.log('   Admin:    admin@greenatlas.ma  / Admin@123');
  console.log('   Agent 1:  agent@greenatlas.ma  / Agent@123');
  console.log('   Agent 2:  amina@greenatlas.ma  / Agent@123');
  console.log('   Citizen:  karim@example.com    / Citizen@123  (Rank #1 – 640 pts)');
  console.log('             fatima@example.com   / Citizen@123  (Rank #2 – 365 pts)');
  console.log('             omar@example.com     / Citizen@123  (Rank #3 – 300 pts)');
  console.log('             aicha@example.com    / Citizen@123  (Rank #4)');
  console.log('             youssef@example.com  / Citizen@123');
  console.log('             nadia@example.com    / Citizen@123');
  console.log('             hassan@example.com   / Citizen@123');
  console.log('             sara@example.com     / Citizen@123');
  console.log('             mehdi@example.com    / Citizen@123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
