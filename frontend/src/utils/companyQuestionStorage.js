const STORAGE_KEY = 'gsfc_company_uploaded_questions';

export const INITIAL_COMPANY_QUESTIONS = [];

export function getCompanyUploadedQuestions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const userUploaded = JSON.parse(raw);
    if (Array.isArray(userUploaded)) {
      return userUploaded.filter(q => !q.id?.startsWith('gsfc-co-'));
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function saveCompanyUploadedQuestion(newQ) {
  const existing = getCompanyUploadedQuestions();
  const created = {
    ...newQ,
    id: 'user-co-q-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    source: 'company_uploaded'
  };

  const currentCustomOnly = getCustomUploadedOnly();
  const updatedCustom = [created, ...currentCustomOnly];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
  } catch (e) {
    console.error('Failed saving custom company question:', e);
  }

  return [created, ...existing];
}

export function bulkUploadCompanyQuestions(qList) {
  const currentCustomOnly = getCustomUploadedOnly();
  const newCreated = qList.map((q, i) => ({
    ...q,
    id: 'user-co-q-' + Date.now() + '-' + i,
    source: 'company_uploaded'
  }));

  const updatedCustom = [...newCreated, ...currentCustomOnly];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
  } catch (e) {
    console.error('Failed bulk saving company questions:', e);
  }

  return [...newCreated, ...getCompanyUploadedQuestions()];
}

export function deleteCompanyUploadedQuestion(id) {
  const currentCustomOnly = getCustomUploadedOnly();
  const updatedCustom = currentCustomOnly.filter(q => q.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
  } catch (e) {
    console.error('Failed deleting company question:', e);
  }
  return [...updatedCustom, ...INITIAL_COMPANY_QUESTIONS];
}

function getCustomUploadedOnly() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}
