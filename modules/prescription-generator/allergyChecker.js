/**
 * Module 3: Clinical Safety Engine - Drug Allergy Conflict Checker
 * Cross-references patient allergy profile against prescribed medications to detect
 * direct allergies and immunological cross-reactivities before issuing prescriptions.
 */

const DRUG_ALLERGY_MATRIX = {
  penicillin: {
    aliases: ['penicillin', 'penicillin g', 'penicillin v', 'benzylpenicillin'],
    crossReactiveGroups: [
      {
        name: 'Aminopenicillins',
        drugs: ['amoxicillin', 'ampicillin', 'augmentin', 'amoxil', 'amoxiclav'],
        risk: 'HIGH',
        reason: 'Shared beta-lactam core structure causes direct hypersensitivity cross-reactivity (>90% correlation).',
        alternatives: ['Azithromycin 500mg', 'Clarithromycin 500mg', 'Doxycycline 100mg'],
      },
      {
        name: 'First & Second-Gen Cephalosporins',
        drugs: ['cephalexin', 'cefadroxil', 'cefazolin', 'cefaclor', 'cefuroxime'],
        risk: 'MODERATE',
        reason: 'Shared beta-lactam ring with identical C7 side chains can trigger cross-allergy in 5-10% of patients.',
        alternatives: ['Azithromycin 500mg', 'Levofloxacin 500mg'],
      },
      {
        name: 'Third-Gen Cephalosporins',
        drugs: ['cefixime', 'ceftriaxone', 'cefotaxime', 'cefpodoxime'],
        risk: 'LOW_TO_MODERATE',
        reason: 'Differing side-chain structures; use with caution or switch to macrolides.',
        alternatives: ['Azithromycin 500mg', 'Ciprofloxacin 500mg'],
      },
    ],
  },
  sulfa: {
    aliases: ['sulfa', 'sulfonamide', 'sulfamethoxazole', 'septra', 'bactrim'],
    crossReactiveGroups: [
      {
        name: 'Sulfonamide Antibiotics',
        drugs: ['trimethoprim-sulfamethoxazole', 'bactrim', 'septra', 'cotrimoxazole', 'sulfadiazine'],
        risk: 'HIGH',
        reason: 'Direct arylamine substitution at N4 position triggers severe IgE/T-cell mediated hypersensitivity.',
        alternatives: ['Nitrofurantoin 100mg', 'Fosfomycin 3g', 'Amoxicillin-Clavulanate (if non-penicillin allergic)'],
      },
    ],
  },
  nsaid: {
    aliases: ['nsaid', 'aspirin', 'ibuprofen', 'naproxen', 'diclofenac'],
    crossReactiveGroups: [
      {
        name: 'COX-1 / Non-selective NSAIDs',
        drugs: ['aspirin', 'ibuprofen', 'brufen', 'combiflam', 'naproxen', 'diclofenac', 'mefenamic acid'],
        risk: 'HIGH',
        reason: 'Inhibition of COX-1 enzymes shunts arachidonic acid into leukotriene pathway triggering bronchospasm/urticaria.',
        alternatives: ['Paracetamol 650mg', 'Tramadol 50mg (short-term for severe pain)'],
      },
    ],
  },
};

/**
 * Checks for direct and cross-reactive drug allergy conflicts.
 * @param {string|Array<string>} patientAllergies - Patient allergies string or array
 * @param {Array<object|string>} prescribedMedicines - Array of prescribed medicine objects or names
 * @returns {object} { hasConflict: boolean, conflicts: Array }
 */
function checkDrugAllergyConflict(patientAllergies = '', prescribedMedicines = []) {
  const allergyList = Array.isArray(patientAllergies)
    ? patientAllergies.map((a) => String(a).toLowerCase().trim())
    : String(patientAllergies || '')
        .toLowerCase()
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  const conflicts = [];

  for (const item of prescribedMedicines) {
    const medName = String(typeof item === 'object' ? item.medicine || item.drug || '' : item)
      .toLowerCase()
      .trim();

    if (!medName) continue;

    for (const allergy of allergyList) {
      for (const [key, profile] of Object.entries(DRUG_ALLERGY_MATRIX)) {
        const matchesAllergy =
          allergy.includes(key) || profile.aliases.some((alias) => allergy.includes(alias));

        if (!matchesAllergy) continue;

        // Check direct allergy alias match
        if (profile.aliases.some((alias) => medName.includes(alias))) {
          conflicts.push({
            drug: medName,
            allergyMatch: allergy,
            risk: 'CRITICAL',
            reason: `Direct allergy: ${medName} belongs directly to the ${key.toUpperCase()} drug family recorded in patient EHR.`,
            recommendedAlternatives: profile.crossReactiveGroups[0]?.alternatives || ['Paracetamol 650mg'],
          });
          break;
        }

        // Check cross-reactive groups
        for (const group of profile.crossReactiveGroups) {
          if (group.drugs.some((d) => medName.includes(d))) {
            conflicts.push({
              drug: medName,
              allergyMatch: allergy,
              risk: group.risk,
              group: group.name,
              reason: group.reason,
              recommendedAlternatives: group.alternatives,
            });
            break;
          }
        }
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    criticalCount: conflicts.filter((c) => c.risk === 'CRITICAL' || c.risk === 'HIGH').length,
    conflicts,
  };
}

module.exports = {
  checkDrugAllergyConflict,
  DRUG_ALLERGY_MATRIX,
};
