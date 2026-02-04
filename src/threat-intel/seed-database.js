const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DATABASE_PATH || 'threat_intel.db';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString();
}

async function seedDatabase() {
  const db = new sqlite3.Database(DB_PATH);

  console.log('Creating tables...');
  
  const schema = `
    CREATE TABLE IF NOT EXISTS threat_actors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      country_origin TEXT,
      first_seen TIMESTAMP,
      last_seen TIMESTAMP,
      sophistication_level TEXT CHECK(sophistication_level IN ('low', 'medium', 'high', 'advanced')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      first_seen TIMESTAMP,
      last_seen TIMESTAMP,
      status TEXT CHECK(status IN ('active', 'dormant', 'completed')),
      target_sectors TEXT,
      target_regions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS indicators (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('ip', 'domain', 'url', 'hash')),
      value TEXT NOT NULL,
      confidence INTEGER CHECK(confidence BETWEEN 0 AND 100),
      first_seen TIMESTAMP,
      last_seen TIMESTAMP,
      tags TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, value)
    );

    CREATE TABLE IF NOT EXISTS actor_campaigns (
      threat_actor_id TEXT,
      campaign_id TEXT,
      confidence INTEGER CHECK(confidence BETWEEN 0 AND 100),
      PRIMARY KEY (threat_actor_id, campaign_id),
      FOREIGN KEY (threat_actor_id) REFERENCES threat_actors(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS campaign_indicators (
      campaign_id TEXT,
      indicator_id TEXT,
      observed_at TIMESTAMP,
      PRIMARY KEY (campaign_id, indicator_id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (indicator_id) REFERENCES indicators(id)
    );

    CREATE TABLE IF NOT EXISTS indicator_relationships (
      source_indicator_id TEXT,
      target_indicator_id TEXT,
      relationship_type TEXT,
      confidence INTEGER CHECK(confidence BETWEEN 0 AND 100),
      first_observed TIMESTAMP,
      PRIMARY KEY (source_indicator_id, target_indicator_id, relationship_type),
      FOREIGN KEY (source_indicator_id) REFERENCES indicators(id),
      FOREIGN KEY (target_indicator_id) REFERENCES indicators(id)
    );

    CREATE TABLE IF NOT EXISTS observations (
      id TEXT PRIMARY KEY,
      indicator_id TEXT,
      observed_at TIMESTAMP,
      source TEXT,
      notes TEXT,
      FOREIGN KEY (indicator_id) REFERENCES indicators(id)
    );

    CREATE INDEX IF NOT EXISTS idx_indicators_type ON indicators(type);
    CREATE INDEX IF NOT EXISTS idx_indicators_value ON indicators(value);
    CREATE INDEX IF NOT EXISTS idx_indicators_first_seen ON indicators(first_seen);
    CREATE INDEX IF NOT EXISTS idx_indicators_last_seen ON indicators(last_seen);
    CREATE INDEX IF NOT EXISTS idx_campaign_indicators_campaign ON campaign_indicators(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_campaign_indicators_indicator ON campaign_indicators(indicator_id);
    CREATE INDEX IF NOT EXISTS idx_observations_indicator ON observations(indicator_id);
    CREATE INDEX IF NOT EXISTS idx_observations_timestamp ON observations(observed_at);
    CREATE INDEX IF NOT EXISTS idx_actor_campaigns_actor ON actor_campaigns(threat_actor_id);
    CREATE INDEX IF NOT EXISTS idx_actor_campaigns_campaign ON actor_campaigns(campaign_id);
  `;

  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log('Seeding threat actors...');
  const threatActors = [];
  const actorNames = [
    'APT-North', 'Lazarus Group', 'Fancy Bear', 'Cozy Bear', 'Carbanak',
    'Equation Group', 'Sandworm', 'APT28', 'APT29', 'Turla',
    'OceanLotus', 'Winnti', 'APT33', 'APT34', 'APT38',
    'Charming Kitten', 'MuddyWater', 'DarkHotel', 'Kimsuky', 'Silence',
    'TA505', 'FIN7', 'FIN8', 'Cobalt Group', 'Magecart',
    'Dragonfly', 'Energetic Bear', 'Leafminer', 'APT32', 'APT37',
    'APT39', 'APT40', 'APT41', 'Gallmaker', 'Gorgon Group',
    'Inception', 'Ke3chang', 'Leviathan', 'Machete', 'Molerats',
    'Naikon', 'Patchwork', 'Rancor', 'Scarlet Mimic', 'Scarcruft',
    'Sidewinder', 'TA459', 'TA551', 'Threat Group-3390', 'Tropic Trooper'
  ];

  const countries = ['CN', 'RU', 'KP', 'IR', 'Unknown'];
  const sophisticationLevels = ['low', 'medium', 'high', 'advanced'];

  for (let i = 0; i < 50; i++) {
    const id = `actor-${uuidv4()}`;
    const firstSeen = randomDate(new Date(2020, 0, 1), new Date(2023, 0, 1));
    const lastSeen = randomDate(firstSeen, new Date());
    
    threatActors.push({
      id,
      name: actorNames[i],
      description: `Threat actor group ${actorNames[i]}`,
      country_origin: countries[randomInt(0, countries.length - 1)],
      first_seen: formatDate(firstSeen),
      last_seen: formatDate(lastSeen),
      sophistication_level: sophisticationLevels[randomInt(0, sophisticationLevels.length - 1)],
    });
  }

  const insertActor = db.prepare('INSERT INTO threat_actors (id, name, description, country_origin, first_seen, last_seen, sophistication_level) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const actor of threatActors) {
    insertActor.run(actor.id, actor.name, actor.description, actor.country_origin, actor.first_seen, actor.last_seen, actor.sophistication_level);
  }
  insertActor.finalize();

  console.log('Seeding campaigns...');
  const campaigns = [];
  const campaignNames = [
    'Operation ShadowNet', 'Operation GhostWriter', 'Operation DreamJob', 'Operation AppleJeus',
    'Operation Sharpshooter', 'Operation Oceansalt', 'Operation Smoke Screen', 'Operation Soft Cell',
    'Operation Cloud Hopper', 'Operation Night Dragon', 'Operation Aurora', 'Operation Cleaver',
    'Operation Blockbuster', 'Operation Dust Storm', 'Operation Pawn Storm', 'Operation Iron Tiger',
    'Operation Quantum', 'Operation SMB Worm', 'Operation Transparent Tribe', 'Operation Wilted Tulip',
  ];

  const statuses = ['active', 'dormant', 'completed'];
  const sectors = ['Finance', 'Healthcare', 'Government', 'Technology', 'Energy', 'Retail'];
  const regions = ['North America', 'Europe', 'Asia', 'Middle East', 'Global'];

  for (let i = 0; i < 100; i++) {
    const id = `camp-${uuidv4()}`;
    const firstSeen = randomDate(new Date(2022, 0, 1), new Date(2024, 0, 1));
    const lastSeen = randomDate(firstSeen, new Date());
    
    campaigns.push({
      id,
      name: i < campaignNames.length ? campaignNames[i] : `Campaign-${i}`,
      description: `Targeted campaign ${i}`,
      first_seen: formatDate(firstSeen),
      last_seen: formatDate(lastSeen),
      status: statuses[randomInt(0, statuses.length - 1)],
      target_sectors: sectors.slice(0, randomInt(1, 3)).join(','),
      target_regions: regions.slice(0, randomInt(1, 2)).join(','),
    });
  }

  const insertCampaign = db.prepare('INSERT INTO campaigns (id, name, description, first_seen, last_seen, status, target_sectors, target_regions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const campaign of campaigns) {
    insertCampaign.run(campaign.id, campaign.name, campaign.description, campaign.first_seen, campaign.last_seen, campaign.status, campaign.target_sectors, campaign.target_regions);
  }
  insertCampaign.finalize();

  console.log('Seeding indicators...');
  const indicators = [];
  const types = ['ip', 'domain', 'url', 'hash'];

  for (let i = 0; i < 10000; i++) {
    const type = types[randomInt(0, types.length - 1)];
    let value;
    
    switch (type) {
      case 'ip':
        value = `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`;
        break;
      case 'domain':
        value = `malicious-${randomInt(1000, 9999)}.example.com`;
        break;
      case 'url':
        value = `https://phishing-${randomInt(1000, 9999)}.com/login`;
        break;
      case 'hash':
        value = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        break;
    }

    const id = `ind-${uuidv4()}`;
    const firstSeen = randomDate(new Date(2023, 0, 1), new Date(2024, 6, 1));
    const lastSeen = randomDate(firstSeen, new Date());
    
    indicators.push({
      id,
      type,
      value,
      confidence: randomInt(50, 100),
      first_seen: formatDate(firstSeen),
      last_seen: formatDate(lastSeen),
    });
  }

  const insertIndicator = db.prepare('INSERT INTO indicators (id, type, value, confidence, first_seen, last_seen) VALUES (?, ?, ?, ?, ?, ?)');
  for (const indicator of indicators) {
    insertIndicator.run(indicator.id, indicator.type, indicator.value, indicator.confidence, indicator.first_seen, indicator.last_seen);
  }
  insertIndicator.finalize();

  console.log('Linking actors to campaigns...');
  const insertActorCampaign = db.prepare('INSERT INTO actor_campaigns (threat_actor_id, campaign_id, confidence) VALUES (?, ?, ?)');
  for (const campaign of campaigns) {
    const numActors = randomInt(1, 3);
    const selectedActors = [];
    for (let i = 0; i < numActors; i++) {
      const actor = threatActors[randomInt(0, threatActors.length - 1)];
      if (!selectedActors.includes(actor.id)) {
        selectedActors.push(actor.id);
        insertActorCampaign.run(actor.id, campaign.id, randomInt(70, 100));
      }
    }
  }
  insertActorCampaign.finalize();

  console.log('Linking campaigns to indicators...');
  const insertCampaignIndicator = db.prepare('INSERT OR IGNORE INTO campaign_indicators (campaign_id, indicator_id, observed_at) VALUES (?, ?, ?)');
  for (const campaign of campaigns) {
    const numIndicators = randomInt(20, 100);
    for (let i = 0; i < numIndicators; i++) {
      const indicator = indicators[randomInt(0, indicators.length - 1)];
      const observedAt = randomDate(new Date(campaign.first_seen), new Date(campaign.last_seen));
      insertCampaignIndicator.run(campaign.id, indicator.id, formatDate(observedAt));
    }
  }
  insertCampaignIndicator.finalize();

  console.log('Creating indicator relationships...');
  const insertRelationship = db.prepare('INSERT OR IGNORE INTO indicator_relationships (source_indicator_id, target_indicator_id, relationship_type, confidence, first_observed) VALUES (?, ?, ?, ?, ?)');
  const relationshipTypes = ['same_campaign', 'same_infrastructure', 'co_occurring'];
  
  for (let i = 0; i < 5000; i++) {
    const source = indicators[randomInt(0, indicators.length - 1)];
    const target = indicators[randomInt(0, indicators.length - 1)];
    if (source.id !== target.id) {
      insertRelationship.run(
        source.id,
        target.id,
        relationshipTypes[randomInt(0, relationshipTypes.length - 1)],
        randomInt(60, 95),
        formatDate(randomDate(new Date(2023, 0, 1), new Date()))
      );
    }
  }
  insertRelationship.finalize();

  console.log('Creating observations...');
  const insertObservation = db.prepare('INSERT INTO observations (id, indicator_id, observed_at, source, notes) VALUES (?, ?, ?, ?, ?)');
  const sources = ['honeypot', 'sandbox', 'customer_report', 'threat_feed', 'internal_detection'];
  
  for (let i = 0; i < 20000; i++) {
    const indicator = indicators[randomInt(0, indicators.length - 1)];
    insertObservation.run(
      `obs-${uuidv4()}`,
      indicator.id,
      formatDate(randomDate(new Date(indicator.first_seen), new Date(indicator.last_seen))),
      sources[randomInt(0, sources.length - 1)],
      `Observation ${i}`
    );
  }
  insertObservation.finalize();

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database seeding completed successfully!');
      console.log(`Database location: ${DB_PATH}`);
    }
  });
}

seedDatabase().catch(console.error);
