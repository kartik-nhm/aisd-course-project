/**
 * In-Memory Resilient Store & Model Adapter
 * Provides transparent zero-configuration fallback when MongoDB is offline,
 * ensuring all endpoints, tests, and UI prototypes work seamlessly.
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function makeQuery(execFn) {
  const query = {
    sort() { return this; },
    lean() { return this; },
    limit(n) {
      this._limit = n;
      return this;
    },
    then(onResolve, onReject) {
      return Promise.resolve(execFn()).then((res) => {
        if (this._limit && Array.isArray(res)) {
          return res.slice(0, this._limit);
        }
        return res;
      }).then(onResolve, onReject);
    },
    catch(onReject) {
      return Promise.resolve(execFn()).catch(onReject);
    },
  };
  return query;
}

class InMemoryCollection {
  constructor(name, initialData = []) {
    this.name = name;
    this.data = JSON.parse(JSON.stringify(initialData));
  }

  _matches(item, filter = {}) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const [key, val] of Object.entries(filter)) {
      if (val === undefined) continue;
      if (key === '_id') {
        if (String(item._id) !== String(val)) return false;
      } else if (key === '$or' && Array.isArray(val)) {
        const anyMatch = val.some((sub) => this._matches(item, sub));
        if (!anyMatch) return false;
      } else if (typeof val === 'object' && val !== null) {
        if (val.$gte !== undefined) {
          const itemVal = item[key] instanceof Date ? item[key] : new Date(item[key]);
          const target = val.$gte instanceof Date ? val.$gte : new Date(val.$gte);
          if (itemVal < target) return false;
        }
        if (val.$exists !== undefined) {
          const exists = item[key] !== undefined && item[key] !== null;
          if (exists !== val.$exists) return false;
        }
        if (val.$ne !== undefined) {
          if (item[key] === val.$ne) return false;
        }
      } else if (String(item[key]).toLowerCase() !== String(val).toLowerCase()) {
        return false;
      }
    }
    return true;
  }

  find(filter = {}) {
    return makeQuery(() => {
      const matched = this.data.filter((item) => this._matches(item, filter));
      return matched.map((item) => this._wrapDoc(item));
    });
  }

  findOne(filter = {}) {
    return makeQuery(() => {
      const item = this.data.find((i) => this._matches(i, filter));
      if (!item) return null;
      return this._wrapDoc(item);
    });
  }

  findById(id) {
    return makeQuery(() => {
      const item = this.data.find((i) => String(i._id) === String(id));
      if (!item) return null;
      return this._wrapDoc(item);
    });
  }

  async create(doc) {
    const newDoc = {
      _id: doc._id || uuidv4(),
      ...doc,
      createdAt: doc.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.data.unshift(newDoc);
    return this._wrapDoc(newDoc);
  }

  async updateOne(filter, update, options = {}) {
    let item = this.data.find((i) => this._matches(i, filter));
    if (!item) {
      if (options.upsert) {
        const toCreate = { ...(update.$set || update), ...filter };
        return await this.create(toCreate);
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }
    const changes = update.$set || update;
    Object.assign(item, changes, { updatedAt: new Date() });
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async findOneAndUpdate(filter, update, options = {}) {
    await this.updateOne(filter, update, options);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    const idx = this.data.findIndex((i) => this._matches(i, filter));
    if (idx !== -1) {
      this.data.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter) {
    const before = this.data.length;
    this.data = this.data.filter((i) => !this._matches(i, filter));
    return { deletedCount: before - this.data.length };
  }

  async aggregate(pipeline = []) {
    let filtered = [...this.data];
    for (const stage of pipeline) {
      if (stage.$match) {
        filtered = filtered.filter((item) => this._matches(item, stage.$match));
      }
      if (stage.$group) {
        const groups = {};
        for (const item of filtered) {
          const pincode = item.pincode;
          const condition = item.detectedCondition;
          const key = `${pincode}:::${condition}`;
          if (!groups[key]) {
            groups[key] = {
              condition,
              pincode,
              queryCount: 0,
              sampleQueries: [],
              lastDetectedAt: item.createdAt,
            };
          }
          groups[key].queryCount += 1;
          groups[key].sampleQueries.push(item.queryText);
          if (new Date(item.createdAt) > new Date(groups[key].lastDetectedAt)) {
            groups[key].lastDetectedAt = item.createdAt;
          }
        }
        filtered = Object.values(groups);
      }
    }
    return filtered;
  }

  _wrapDoc(doc) {
    if (!doc) return null;
    const copy = JSON.parse(JSON.stringify(doc));
    copy.lean = () => JSON.parse(JSON.stringify(doc));
    copy.save = async () => copy;
    return copy;
  }
}

// Demo Seed Dataset
const SEED_USERS = [
  {
    _id: 'usr-doc-1',
    name: 'Dr. Priya Sharma',
    email: 'dr.priya@telehealth.org',
    password: hashPassword('Doctor@123'),
    phone: '+919876500001',
    role: '0', // DOCTOR
  },
  {
    _id: 'usr-doc-2',
    name: 'Dr. Rajesh Verma',
    email: 'dr.rajesh@telehealth.org',
    password: hashPassword('Doctor@123'),
    phone: '+919876500002',
    role: '0',
  },
  {
    _id: 'usr-pat-1',
    name: 'Kartik Narayana',
    email: 'kartik@telehealth.org',
    password: hashPassword('Patient@123'),
    phone: '9876543210',
    role: '1', // PATIENT
  },
  {
    _id: 'usr-phar-1',
    name: 'Apollo Chief Pharmacist',
    email: 'pharmacist@apollo.org',
    password: hashPassword('Pharma@123'),
    phone: '+919876500003',
    role: '2', // PHARMACIST
  },
];

const SEED_DOCTORS = [
  {
    _id: 'doc-prof-1',
    email: 'dr.priya@telehealth.org',
    name: 'Dr. Priya Sharma, MD',
    specialty: 'Cardiology & General Medicine',
    regNumber: 'MCI-54812',
    clinicName: 'Apex Virtual Health Center',
  },
  {
    _id: 'doc-prof-2',
    email: 'dr.rajesh@telehealth.org',
    name: 'Dr. Rajesh Verma, MBBS',
    specialty: 'Internal Medicine & Telehealth',
    regNumber: 'MCI-29140',
    clinicName: 'Smart Telehealth Clinic',
  },
  {
    _id: 'doc-prof-3',
    email: 'dr.ananya@telehealth.org',
    name: 'Dr. Ananya Iyer, MD',
    specialty: 'Pediatrics & Community Health',
    regNumber: 'MCI-77319',
    clinicName: 'Lotus Children Care',
  },
];

const SEED_PATIENTS = [
  {
    _id: 'pat-1',
    name: 'Kartik Narayana',
    phone: '9876543210',
    age: '22',
    gender: 'Male',
    bloodType: 'O+',
    allergies: 'Penicillin, Cephalosporins',
    pincode: '560001',
  },
  {
    _id: 'pat-2',
    name: 'Sunita Rao',
    phone: '9876543211',
    age: '45',
    gender: 'Female',
    bloodType: 'B+',
    allergies: 'Sulfa Antibiotics',
    pincode: '560038',
  },
];

const SEED_PHARMACIES = [
  {
    _id: 'phar-1',
    name: 'Apollo Pharmacy Indira Nagar',
    email: 'indiranagar@apollo.com',
    phone: '+918025251234',
    pincode: '560038',
    licenseNumber: 'KA-BLR-PH-2024-001',
    address: '100 Feet Road, Indira Nagar, Bengaluru',
    stockAlertsEnabled: true,
  },
  {
    _id: 'phar-2',
    name: 'MedPlus Pharmacy Koramangala',
    email: 'koramangala@medplus.com',
    phone: '+918025539876',
    pincode: '560034',
    licenseNumber: 'KA-BLR-PH-2024-002',
    address: '80 Feet Road, 4th Block, Koramangala, Bengaluru',
    stockAlertsEnabled: true,
  },
  {
    _id: 'phar-3',
    name: 'City Health Chemist MG Road',
    email: 'pharmacist@apollo.org',
    phone: '+918025587654',
    pincode: '560001',
    licenseNumber: 'KA-BLR-PH-2024-003',
    address: 'MG Road, Shivaji Nagar, Bengaluru',
    stockAlertsEnabled: true,
  },
];

const SEED_CONSULTATIONS = [
  {
    _id: 'consult-demo-001',
    meetingUuid: 'meet-demo-101',
    patient_phonenumber: '9876543210',
    doctor_email_id: 'dr.priya@telehealth.org',
    context: 'Doctor: Good morning Kartik, what seems to be the trouble?\nPatient: Doctor, I have had high fever, dry cough, and body aches for the last 3 days.\nDoctor: Any chest congestion or breathlessness?\nPatient: No breathlessness, just very tired and throat is scratchy.\nDoctor: Let me check your vitals. Temperature is 100.8 F, SpO2 98%, Pulse 78 bpm. Your lungs sound clear. This looks like an acute viral upper respiratory infection. I am prescribing Paracetamol and Cetirizine.',
    summary_data: {
      symptoms: ['High fever (100.8 F)', 'Dry cough', 'Body aches', 'Scratchy throat', 'Fatigue'],
      diagnosis: ['Acute Upper Respiratory Tract Infection (Viral)'],
      prescription: [
        { drug: 'Paracetamol', dosage: '650mg', frequency: 'TDS', duration: '3 days', instructions: 'After meals' },
        { drug: 'Cetirizine', dosage: '10mg', frequency: 'OD', duration: '5 days', instructions: 'At bedtime' },
        { drug: 'Saline Nasal Spray', dosage: '2 puffs', frequency: 'BD', duration: '5 days', instructions: 'Both nostrils' },
      ],
      vitals: { bp: '118/76 mmHg', pulse: '78 bpm', spo2: '98%', temp: '100.8°F' },
      lifestyle_advice: ['Steam inhalation twice daily', 'Drink warm water and stay hydrated (3L/day)', 'Complete bed rest'],
      tests_recommended: ['CBC & ESR if fever does not subside in 48 hours'],
      follow_up_plan: ['Virtual follow-up in 3 days if symptoms persist'],
    },
    triage: {
      severity: 'Low',
      rationale: 'Stable respiratory vitals (SpO2 98%) with localized upper respiratory symptoms',
      recommendedUrgencyHours: 48,
    },
    datetime: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
];

const SEED_CHAT_LOGS = [
  {
    _id: 'log-01',
    queryText: 'Mujhe kal se tez bukhar hai aur sar dard hai',
    detectedCondition: 'fever',
    pincode: '560001',
    detectedLanguage: 'Romanized Hindi',
    isVernacular: true,
    userId: 'user-01',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    _id: 'log-02',
    queryText: 'High fever and shivering since yesterday evening',
    detectedCondition: 'fever',
    pincode: '560001',
    detectedLanguage: 'English',
    isVernacular: false,
    userId: 'user-02',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    _id: 'log-03',
    queryText: 'Nange jwara mattu mai novu ide',
    detectedCondition: 'fever',
    pincode: '560001',
    detectedLanguage: 'Romanized Kannada',
    isVernacular: true,
    userId: 'user-03',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    _id: 'log-04',
    queryText: 'Fever 101 with mild headache medicine recommendation',
    detectedCondition: 'fever',
    pincode: '560001',
    detectedLanguage: 'English',
    isVernacular: false,
    userId: 'user-04',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
];

const collections = {
  users: new InMemoryCollection('User', SEED_USERS),
  doctors: new InMemoryCollection('DoctorProfile', SEED_DOCTORS),
  patients: new InMemoryCollection('Patient', SEED_PATIENTS),
  pharmacies: new InMemoryCollection('Pharmacy', SEED_PHARMACIES),
  consultations: new InMemoryCollection('ConsultationSummary', SEED_CONSULTATIONS),
  chatLogs: new InMemoryCollection('ChatQueryLog', SEED_CHAT_LOGS),
  alerts: new InMemoryCollection('PharmacyAlert', []),
  otps: new InMemoryCollection('Otp', []),
};

function getCollectionForModel(modelName) {
  switch (modelName) {
    case 'User': return collections.users;
    case 'DoctorProfile': return collections.doctors;
    case 'Patient': return collections.patients;
    case 'Pharmacy': return collections.pharmacies;
    case 'ConsultationSummary': return collections.consultations;
    case 'ChatQueryLog': return collections.chatLogs;
    case 'PharmacyAlert': return collections.alerts;
    case 'Otp': return collections.otps;
    default: return new InMemoryCollection(modelName, []);
  }
}

module.exports = {
  collections,
  getCollectionForModel,
};
