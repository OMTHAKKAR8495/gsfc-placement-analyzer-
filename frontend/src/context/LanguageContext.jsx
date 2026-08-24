import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', nativeLabel: 'English' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', nativeLabel: 'हिन्दी (Hindi)' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳', nativeLabel: 'ગુજરાતી (Gujarati)' }
];

export const TRANSLATIONS = {
  en: {
    // Nav & Brand
    portal_title: 'GSFC University Placement Portal',
    portal_subtitle: 'Training & Placement Cell (TPC)',
    login: 'Sign In',
    logout: 'Log Out',
    settings: 'Settings',
    notifications: 'Notifications',
    role_student: 'Student Workspace',
    role_admin: 'TPC Admin',
    role_company: 'Company Recruiter',
    role_faculty: 'Faculty Hub',
    role_alumni: 'Alumni Network',

    // Dashboard Hero & Metrics
    welcome_back: 'Welcome back',
    placement_readiness: 'Placement Readiness Score',
    ats_resume_score: 'ATS Resume Score',
    active_applications: 'Active Applications',
    upcoming_interviews: 'Upcoming Interviews',
    points_badge: 'Career Points',
    leaderboard_rank: 'Campus Rank',

    // Action Buttons
    apply_now: 'Apply Now',
    applied: 'Applied',
    view_details: 'View Details',
    ai_mock_interview: 'AI Mock Interview',
    download_resume: 'Download Resume',
    add_to_calendar: 'Add to Calendar',
    google_calendar: 'Google Calendar',
    download_ics: 'Download (.ics)',
    verify_document: 'Verify Document',
    share_whatsapp: 'Share on WhatsApp',

    // Tabs
    tab_drives: 'Placement Drives',
    tab_applications: 'My Applications',
    tab_leaderboard: '🏆 Leaderboard & Badges',
    tab_ai_prep: 'AI Interview Coach',
    tab_fairs: 'Job Fairs & Fests',
    tab_qa: 'Q&A Board',

    // Gamification
    badges_title: 'Career Badges & Achievements',
    leaderboard_title: 'Placement Readiness Leaderboard',
    opt_in_privacy: 'Anonymous Nickname Mode',
    level: 'Level',

    // 2FA & Auth
    two_fa_title: 'Two-Factor Authentication (2FA)',
    two_fa_prompt: 'Enter the 6-digit code from Google Authenticator or Authy',
    two_fa_verify: 'Verify & Sign In',
    two_fa_enabled_badge: '2FA Protected 🛡️',

    // Document Verification
    doc_verify_title: 'Blockchain-Anchored Document Verification',
    doc_verify_subtitle: 'Cryptographic SHA-256 Verification against GSFC University TPC Ledger',
    doc_search_placeholder: 'Enter Document ID (e.g. GSFC-CERT-2026-001) or Drag & Drop File...',
    doc_verified_badge: 'Verified Authentic ✅',
    doc_invalid_badge: 'Tampered / Unregistered ❌',

    // Footer
    official_seal: 'Official Training & Placement Cell • GSFC University, Vigyan Bhavan, Vadodara'
  },
  hi: {
    // Nav & Brand
    portal_title: 'जीएसएफसी विश्वविद्यालय प्लेसमेंट पोर्टल',
    portal_subtitle: 'प्रशिक्षण एवं प्लेसमेंट सेल (टीपीसी)',
    login: 'साइन इन करें',
    logout: 'लॉग आउट',
    settings: 'सेटिंग्स',
    notifications: 'सूचनाएं',
    role_student: 'छात्र कार्यक्षेत्र',
    role_admin: 'टीपीसी व्यवस्थापक',
    role_company: 'कंपनी रिक्रूटर',
    role_faculty: 'संकाय हब',
    role_alumni: 'एलुमनाई नेटवर्क',

    // Dashboard Hero & Metrics
    welcome_back: 'वापसी पर स्वागत है',
    placement_readiness: 'प्लेसमेंट तैयारी स्कोर',
    ats_resume_score: 'एटीएस रिज्यूमे स्कोर',
    active_applications: 'सक्रिय आवेदन',
    upcoming_interviews: 'आगामी साक्षात्कार',
    points_badge: 'कैरियर पॉइंट्स',
    leaderboard_rank: 'कैंपस रैंक',

    // Action Buttons
    apply_now: 'आवेदन करें',
    applied: 'आवेदित',
    view_details: 'विवरण देखें',
    ai_mock_interview: 'एआई मॉक इंटरव्यू',
    download_resume: 'रिज्यूमे डाउनलोड करें',
    add_to_calendar: 'कैलेंडर में जोड़ें',
    google_calendar: 'गूगल कैलेंडर',
    download_ics: 'डाउनलोड (.ics)',
    verify_document: 'दस्तावेज़ सत्यापित करें',
    share_whatsapp: 'व्हाट्सएप पर शेयर करें',

    // Tabs
    tab_drives: 'प्लेसमेंट ड्राइव्स',
    tab_applications: 'मेरे आवेदन',
    tab_leaderboard: '🏆 लीडरबोर्ड एवं बैज',
    tab_ai_prep: 'एआई साक्षात्कार कोच',
    tab_fairs: 'जॉब फेयर एवं फेस्ट',
    tab_qa: 'सवाल-जवाब मंच',

    // Gamification
    badges_title: 'कैरियर बैज एवं उपलब्धियां',
    leaderboard_title: 'प्लेसमेंट तैयारी लीडरबोर्ड',
    opt_in_privacy: 'गुमनाम उपनाम मोड',
    level: 'स्तर',

    // 2FA & Auth
    two_fa_title: 'द्वि-चरणीय प्रमाणीकरण (2FA)',
    two_fa_prompt: 'गूगल ऑथेंटिकेटर या ऑथी से 6-अंकीय कोड दर्ज करें',
    two_fa_verify: 'सत्यापित करें और साइन इन करें',
    two_fa_enabled_badge: '2FA सुरक्षित 🛡️',

    // Document Verification
    doc_verify_title: 'ब्लॉकचेन-एंकर दस्तावेज़ सत्यापन',
    doc_verify_subtitle: 'जीएसएफसी विश्वविद्यालय टीपीसी लेजर के खिलाफ क्रिप्टोग्राफिक SHA-256 सत्यापन',
    doc_search_placeholder: 'दस्तावेज़ आईडी (जैसे GSFC-CERT-2026-001) दर्ज करें या फ़ाइल अपलोड करें...',
    doc_verified_badge: 'सत्यापित प्रमाणिक ✅',
    doc_invalid_badge: 'अमान्य / छेड़छाड़ किया हुआ ❌',

    // Footer
    official_seal: 'आधिकारिक प्रशिक्षण एवं प्लेसमेंट सेल • जीएसएफसी विश्वविद्यालय, विज्ञान भवन, वडोदरा'
  },
  gu: {
    // Nav & Brand
    portal_title: 'GSFC યુનિવર્સિટી પ્લેસમેન્ટ પોર્ટલ',
    portal_subtitle: 'તાલીમ અને પ્લેસમેન્ટ સેલ (TPC)',
    login: 'સાઇન ઇન કરો',
    logout: 'લૉગ આઉટ',
    settings: 'સેટિંગ્સ',
    notifications: 'સૂચનાઓ',
    role_student: 'વિદ્યાર્થી કાર્યક્ષેત્ર',
    role_admin: 'TPC એડમિન',
    role_company: 'કંપની રિક્રૂટર',
    role_faculty: 'ફેકલ્ટી હબ',
    role_alumni: 'ભૂતપૂર્વ વિદ્યાર્થી નેટવર્ક',

    // Dashboard Hero & Metrics
    welcome_back: 'સ્વાગત છે',
    placement_readiness: 'પ્લેસમેન્ટ તૈયારી સ્કોર',
    ats_resume_score: 'ATS રેઝ્યૂમે સ્કોર',
    active_applications: 'સક્રિય અરજીઓ',
    upcoming_interviews: 'આગામી ઇન્ટરવ્યુ',
    points_badge: 'કારકિર્દી પોઈન્ટ્સ',
    leaderboard_rank: 'કેમ્પસ રેન્ક',

    // Action Buttons
    apply_now: 'અરજી કરો',
    applied: 'અરજી કરેલ',
    view_details: 'વિગત જુઓ',
    ai_mock_interview: 'AI મૉક ઇન્ટરવ્યુ',
    download_resume: 'રેઝ્યૂમે ડાઉનલોડ કરો',
    add_to_calendar: 'કેલેન્ડરમાં ઉમેરો',
    google_calendar: 'ગૂગલ કેલેન્ડર',
    download_ics: 'ડાઉનલોડ (.ics)',
    verify_document: 'દસ્તાવેજ ચકાસો',
    share_whatsapp: 'WhatsApp પર શેર કરો',

    // Tabs
    tab_drives: 'પ્લેસમેન્ટ ડ્રાઇવ્સ',
    tab_applications: 'મારી અરજીઓ',
    tab_leaderboard: '🏆 લીડરબોર્ડ અને બેજ',
    tab_ai_prep: 'AI ઇન્ટરવ્યુ કોચ',
    tab_fairs: 'જોબ ફેર અને ફેસ્ટ',
    tab_qa: 'પ્રશ્નોત્તરી બોર્ડ',

    // Gamification
    badges_title: 'કારકિર્દી બેજ અને સિદ્ધિઓ',
    leaderboard_title: 'પ્લેસમેન્ટ તૈયારી લીડરબોર્ડ',
    opt_in_privacy: 'અનામી ઉપનામ મોડ',
    level: 'લેવલ',

    // 2FA & Auth
    two_fa_title: 'ટુ-ફેક્ટર ઓથેન્ટિકેશન (2FA)',
    two_fa_prompt: 'Google Authenticator અથવા Authy માંથી 6-અંકનો કોડ દાખલ કરો',
    two_fa_verify: 'ચકાસો અને સાઇન ઇન કરો',
    two_fa_enabled_badge: '2FA સુરક્ષિત 🛡️',

    // Document Verification
    doc_verify_title: 'બ્લોકચેન-એન્કર્ડ દસ્તાવેજ ચકાસણી',
    doc_verify_subtitle: 'GSFC યુનિવર્સિટી TPC ખાતાવહી સામે ક્રિપ્ટોગ્રાફિક SHA-256 ચકાસણી',
    doc_search_placeholder: 'દસ્તાવેજ ID (જેમ કે GSFC-CERT-2026-001) દાખલ કરો અથવા ફાઇલ ખેંચો...',
    doc_verified_badge: 'ચકાસાયેલ પ્રમાણિક ✅',
    doc_invalid_badge: 'અમાન્ય / છેડછાડ કરેલ ❌',

    // Footer
    official_seal: 'સત્તાવાર તાલીમ અને પ્લેસમેન્ટ સેલ • GSFC યુનિવર્સિટી, વિજ્ઞાન ભવન, વડોદરા'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('gsfc_language') || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gsfc_language', language);
      document.documentElement.lang = language;
    } catch (e) {}
  }, [language]);

  const t = (key, fallback = '') => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (k, fb = '') => TRANSLATIONS.en[k] || fb || k,
      languages: LANGUAGES
    };
  }
  return context;
}
