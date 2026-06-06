import { createContext, useContext, useEffect, useState } from 'react'

const STRINGS = {
  en: {
    addCard: 'Add a card',
    addColumn: 'Add a column',
    emptyColumn: 'Drop cards here',
    cardTitlePlaceholder: 'Card title… (Enter to add)',
    add: 'Add',
    done: 'Done',
    newColumn: 'New Column',
    dragColumn: 'Drag to reorder column',
    deleteColumn: 'Delete column',
    deleteColumnConfirm: (t) => `Delete column "${t}" and its cards?`,
    title: 'Title',
    description: 'Description',
    descriptionPlaceholder: 'Add more detail…',
    labels: 'Labels',
    dueDate: 'Due date',
    clear: 'Clear',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    share: 'Share board',
    copied: 'Copied!',
    noPeers: 'No peers',
    peerConnected: (n) => `${n} peer${n > 1 ? 's' : ''} connected`,
    undo: 'Undo (Ctrl/Cmd+Z)',
    redo: 'Redo (Ctrl/Cmd+Shift+Z)',
    langToggle: 'العربية',
    overdue: 'Overdue',
    welcome: 'Welcome to SyncBoard',
    welcomeSubtitle: "Enter a name so teammates know who's editing.",
    yourName: 'Your name',
    namePlaceholder: 'e.g. Alisha',
    pickColor: 'Pick a color',
    joinBoard: 'Join board',
    editProfile: 'Edit your profile',
    you: 'You',
    connected: 'Connected',
    connecting: 'Connecting…',
    offline: 'Offline',
  },
  ar: {
    addCard: 'إضافة بطاقة',
    addColumn: 'إضافة عمود',
    emptyColumn: 'أفلت البطاقات هنا',
    cardTitlePlaceholder: 'عنوان البطاقة… (Enter للإضافة)',
    add: 'إضافة',
    done: 'تم',
    newColumn: 'عمود جديد',
    dragColumn: 'اسحب لإعادة ترتيب العمود',
    deleteColumn: 'حذف العمود',
    deleteColumnConfirm: (t) => `حذف العمود "${t}" وبطاقاته؟`,
    title: 'العنوان',
    description: 'الوصف',
    descriptionPlaceholder: 'أضف المزيد من التفاصيل…',
    labels: 'التصنيفات',
    dueDate: 'تاريخ الاستحقاق',
    clear: 'مسح',
    delete: 'حذف',
    cancel: 'إلغاء',
    save: 'حفظ',
    share: 'مشاركة اللوحة',
    copied: 'تم النسخ!',
    noPeers: 'لا يوجد أقران',
    peerConnected: (n) => `${n} ${n > 2 ? 'أقران متصلون' : 'قرين متصل'}`,
    undo: 'تراجع (Ctrl/Cmd+Z)',
    redo: 'إعادة (Ctrl/Cmd+Shift+Z)',
    langToggle: 'English',
    overdue: 'متأخر',
    welcome: 'مرحباً بك في SyncBoard',
    welcomeSubtitle: 'أدخل اسمك ليعرف زملاؤك من يقوم بالتعديل.',
    yourName: 'اسمك',
    namePlaceholder: 'مثال: أليشا',
    pickColor: 'اختر لوناً',
    joinBoard: 'انضمام للوحة',
    editProfile: 'تعديل ملفك الشخصي',
    you: 'أنت',
    connected: 'متصل',
    connecting: 'جارٍ الاتصال…',
    offline: 'غير متصل',
  },
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('sb-lang') || 'en')

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('sb-lang', lang)
  }, [lang])

  const t = (key, ...args) => {
    const v = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key
    return typeof v === 'function' ? v(...args) : v
  }

  const toggleLang = () => setLang((l) => (l === 'en' ? 'ar' : 'en'))

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
