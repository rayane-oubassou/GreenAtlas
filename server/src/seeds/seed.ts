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

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Report.deleteMany({}),
    WaterData.deleteMany({}),
    ForestData.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // Create users (passwords pre-hashed)
  const adminPwd = await bcrypt.hash('Admin@123', 12);
  const agentPwd = await bcrypt.hash('Agent@123', 12);
  const citizenPwd = await bcrypt.hash('Citizen@123', 12);

  const [admin, agent, citizen1, citizen2] = await User.insertMany([
    {
      name: 'Admin GreenAtlas',
      email: 'admin@greenatlas.ma',
      password: adminPwd,
      role: 'admin',
    },
    {
      name: 'Agent Forestier',
      email: 'agent@greenatlas.ma',
      password: agentPwd,
      role: 'agent',
    },
    {
      name: 'Karim Benali',
      email: 'karim@example.com',
      password: citizenPwd,
      role: 'citizen',
    },
    {
      name: 'Fatima Zahra',
      email: 'fatima@example.com',
      password: citizenPwd,
      role: 'citizen',
    },
  ]);
  console.log('👥 Created users');

  // Create reports
  const reports = await Report.insertMany([
    {
      title: 'Incendie détecté près de la forêt de cèdres',
      description: 'Un départ de feu a été observé sur le versant nord de la forêt de cèdres. Les flammes semblent se propager vers le bas. Intervention urgente nécessaire.',
      category: 'wildfire',
      latitude: 33.5321,
      longitude: -5.1234,
      status: 'verified',
      user: citizen1._id,
    },
    {
      title: 'Coupe illégale de cèdres au bord de la route',
      description: 'Plusieurs cèdres centenaires ont été abattus illégalement sur la route forestière P7105. Des traces de tronçonneuses fraîches sont visibles.',
      category: 'illegal_logging',
      latitude: 33.4856,
      longitude: -5.0923,
      status: 'pending',
      user: citizen2._id,
    },
    {
      title: 'Fuite sur la conduite principale - Ain Vittel',
      description: 'Une importante fuite d\'eau est visible sur la canalisation principale alimentant le quartier résidentiel. L\'eau coule depuis au moins 48 heures.',
      category: 'water_leak',
      latitude: 33.5128,
      longitude: -5.1456,
      status: 'resolved',
      user: citizen1._id,
    },
    {
      title: 'Déversement de déchets dans l\'Oued Tizguit',
      description: 'Des déchets industriels semblent avoir été déversés dans l\'Oued Tizguit. L\'eau présente une couleur anormale et une odeur forte.',
      category: 'pollution',
      latitude: 33.5045,
      longitude: -5.0789,
      status: 'verified',
      user: citizen2._id,
    },
    {
      title: 'Fumée suspecte dans le Parc National d\'Ifrane',
      description: 'Une colonne de fumée blanche est visible depuis la route nationale. La source n\'est pas encore identifiée mais semble provenir de la zone protégée.',
      category: 'wildfire',
      latitude: 33.5589,
      longitude: -5.1678,
      status: 'pending',
      user: citizen1._id,
    },
    {
      title: 'Abattage d\'arbres sans autorisation - Zone protégée',
      description: 'Un groupe d\'individus a été aperçu en train d\'abattre des arbres dans une zone protégée du parc. Un camion était présent pour transporter le bois.',
      category: 'illegal_logging',
      latitude: 33.4923,
      longitude: -5.1345,
      status: 'pending',
      user: citizen2._id,
    },
    {
      title: 'Pollution plastique au Lac Dayet Aoua',
      description: 'D\'importantes quantités de déchets plastiques ont été retrouvées sur les rives du lac Dayet Aoua, affectant la faune locale notamment les oiseaux migrateurs.',
      category: 'pollution',
      latitude: 33.4434,
      longitude: -5.0123,
      status: 'pending',
      user: citizen1._id,
    },
    {
      title: 'Fuite d\'eau sur le réseau secondaire',
      description: 'Une fuite sur le réseau secondaire d\'approvisionnement en eau est signalée dans le quartier Al Amal. La pression est fortement réduite dans tout le secteur.',
      category: 'water_leak',
      latitude: 33.5267,
      longitude: -5.1067,
      status: 'verified',
      user: citizen2._id,
    },
    {
      title: 'Début d\'incendie - Versant Azrou',
      description: 'Un début d\'incendie a été maîtrisé rapidement grâce à l\'intervention des habitants. La végétation sèche reste un risque élevé dans ce secteur.',
      category: 'wildfire',
      latitude: 33.4312,
      longitude: -5.2234,
      status: 'resolved',
      user: citizen1._id,
    },
    {
      title: 'Rejet d\'eaux usées dans la nature',
      description: 'Des eaux usées non traitées sont rejetées directement dans le milieu naturel au niveau de la zone industrielle artisanale, polluant une source naturelle proche.',
      category: 'pollution',
      latitude: 33.5178,
      longitude: -5.0934,
      status: 'pending',
      user: citizen2._id,
    },
  ]);
  console.log('📋 Created reports');

  // Water data for various sources in Ifrane region
  const now = new Date();
  const waterEntries = [];
  const sources = [
    { source: 'Lac Dayet Aoua', location: 'Ifrane Nord' },
    { source: 'Oued Tizguit', location: 'Ifrane Centre' },
    { source: 'Source Ain Vittel', location: 'Ifrane Ville' },
    { source: 'Barrage Azzaba', location: 'Azrou' },
  ];

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);

    for (const source of sources) {
      const baseLevel = source.source === 'Barrage Azzaba' ? 55 : 45;
      const level = Math.max(5, Math.min(95, baseLevel + (Math.random() - 0.5) * 20 - dayOffset * 0.3));
      waterEntries.push({
        level: Math.round(level * 10) / 10,
        location: source.location,
        source: source.source,
        timestamp: date,
      });
    }
  }

  await WaterData.insertMany(waterEntries);
  console.log('💧 Created water data');

  // Forest data for various zones
  const forestZones = [
    { location: 'Forêt de Cèdres - Zone Nord', area: 1200 },
    { location: 'Parc National Ifrane - Secteur A', area: 850 },
    { location: 'Forêt de Cèdres - Zone Sud', area: 950 },
    { location: 'Azrou - Zone Forestière', area: 670 },
  ];

  const forestEntries = [];
  const riskLevels = ['Low', 'Medium', 'High', 'Very High', 'Extreme'] as const;

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const temperature = 15 + Math.random() * 20;
    const humidity = 30 + Math.random() * 50;
    const windSpeed = 5 + Math.random() * 25;

    const score = Math.max(0, (temperature - 10) * 1.5) +
      Math.max(0, (60 - humidity) * 0.8) + windSpeed * 1.2;

    let riskIdx = 0;
    if (score >= 80) riskIdx = 4;
    else if (score >= 60) riskIdx = 3;
    else if (score >= 40) riskIdx = 2;
    else if (score >= 20) riskIdx = 1;

    for (const zone of forestZones) {
      forestEntries.push({
        fireRiskLevel: riskLevels[riskIdx],
        healthIndex: Math.round((70 + Math.random() * 25) * 10) / 10,
        location: zone.location,
        area: zone.area,
        temperature: Math.round(temperature * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        windSpeed: Math.round(windSpeed * 10) / 10,
        timestamp: date,
      });
    }
  }

  await ForestData.insertMany(forestEntries);
  console.log('🌲 Created forest data');

  // Notifications
  await Notification.insertMany([
    {
      message: `Nouveau signalement incendie: "${reports[0].title}"`,
      type: 'new_report',
      recipient: agent._id,
      report: reports[0]._id,
      read: false,
    },
    {
      message: `Votre signalement "${reports[2].title}" a été résolu.`,
      type: 'status_update',
      recipient: citizen1._id,
      report: reports[2]._id,
      read: true,
    },
    {
      message: `Nouveau signalement pollution: "${reports[3].title}"`,
      type: 'new_report',
      recipient: admin._id,
      report: reports[3]._id,
      read: false,
    },
    {
      message: `Alerte: Risque d'incendie élevé prévu pour les prochaines 48h dans la région.`,
      type: 'alert',
      recipient: agent._id,
      read: false,
    },
    {
      message: `Nouveau signalement reçu: "${reports[1].title}"`,
      type: 'new_report',
      recipient: agent._id,
      report: reports[1]._id,
      read: false,
    },
  ]);
  console.log('🔔 Created notifications');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📌 Login credentials:');
  console.log('   Admin:   admin@greenatlas.ma / Admin@123');
  console.log('   Agent:   agent@greenatlas.ma / Agent@123');
  console.log('   Citizen: karim@example.com / Citizen@123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
