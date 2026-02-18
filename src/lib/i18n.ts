// Simple i18n implementation
export type Language = 'ro' | 'en' | 'es';

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.dashboard': { ro: 'Panou de bord', en: 'Dashboard', es: 'Panel' },
  'nav.trips': { ro: 'Curse', en: 'Trips', es: 'Viajes' },
  'nav.drivers': { ro: 'Șoferi', en: 'Drivers', es: 'Conductores' },
  'nav.vehicles': { ro: 'Camioane', en: 'Trucks', es: 'Camiones' },
  'nav.trailers': { ro: 'Remorci', en: 'Trailers', es: 'Remolques' },
  'nav.clients': { ro: 'Clienți', en: 'Clients', es: 'Clientes' },
  'nav.financial': { ro: 'Financiar', en: 'Financial', es: 'Financiero' },
  'nav.chat': { ro: 'Mesaje', en: 'Messages', es: 'Mensajes' },
  'nav.users': { ro: 'Utilizatori', en: 'Users', es: 'Usuarios' },
  'nav.settings': { ro: 'Setări', en: 'Settings', es: 'Configuración' },
  'nav.myTrip': { ro: 'Cursa mea', en: 'My Trip', es: 'Mi Viaje' },
  'nav.documents': { ro: 'Documente', en: 'Documents', es: 'Documentos' },
  'nav.location': { ro: 'Locație', en: 'Location', es: 'Ubicación' },
  'nav.logout': { ro: 'Deconectare', en: 'Logout', es: 'Cerrar sesión' },

  // Dashboard
  'dash.activeTrips': { ro: 'Curse Active', en: 'Active Trips', es: 'Viajes Activos' },
  'dash.plannedTrips': { ro: 'Curse Planificate', en: 'Planned Trips', es: 'Viajes Planificados' },
  'dash.availableDrivers': { ro: 'Șoferi Disponibili', en: 'Available Drivers', es: 'Conductores Disponibles' },
  'dash.availableTrucks': { ro: 'Camioane Disponibile', en: 'Available Trucks', es: 'Camiones Disponibles' },
  'dash.delays': { ro: 'Întârzieri', en: 'Delays', es: 'Retrasos' },
  'dash.revenue': { ro: 'Venit Total', en: 'Total Revenue', es: 'Ingresos Totales' },
  'dash.recentTrips': { ro: 'Curse Recente', en: 'Recent Trips', es: 'Viajes Recientes' },
  'dash.notifications': { ro: 'Notificări', en: 'Notifications', es: 'Notificaciones' },

  // Status
  'status.planned': { ro: 'Planificată', en: 'Planned', es: 'Planificado' },
  'status.loading': { ro: 'La încărcare', en: 'Loading', es: 'Cargando' },
  'status.in_transit': { ro: 'În tranzit', en: 'In Transit', es: 'En Tránsito' },
  'status.unloading': { ro: 'La descărcare', en: 'Unloading', es: 'Descargando' },
  'status.completed': { ro: 'Finalizată', en: 'Completed', es: 'Completado' },
  'status.cancelled': { ro: 'Anulată', en: 'Cancelled', es: 'Cancelado' },
  'status.delayed': { ro: 'Întârziată', en: 'Delayed', es: 'Retrasado' },
  'status.available': { ro: 'Disponibil', en: 'Available', es: 'Disponible' },
  'status.on_trip': { ro: 'În cursă', en: 'On Trip', es: 'En Viaje' },
  'status.leave': { ro: 'Concediu', en: 'On Leave', es: 'De Permiso' },
  'status.inactive': { ro: 'Inactiv', en: 'Inactive', es: 'Inactivo' },
  'status.maintenance': { ro: 'Mentenanță', en: 'Maintenance', es: 'Mantenimiento' },

  // Common
  'common.add': { ro: 'Adaugă', en: 'Add', es: 'Añadir' },
  'common.edit': { ro: 'Editează', en: 'Edit', es: 'Editar' },
  'common.delete': { ro: 'Șterge', en: 'Delete', es: 'Eliminar' },
  'common.save': { ro: 'Salvează', en: 'Save', es: 'Guardar' },
  'common.cancel': { ro: 'Anulează', en: 'Cancel', es: 'Cancelar' },
  'common.search': { ro: 'Caută...', en: 'Search...', es: 'Buscar...' },
  'common.filter': { ro: 'Filtrează', en: 'Filter', es: 'Filtrar' },
  'common.export': { ro: 'Exportă', en: 'Export', es: 'Exportar' },
  'common.loading': { ro: 'Se încarcă...', en: 'Loading...', es: 'Cargando...' },
  'common.noData': { ro: 'Nu există date', en: 'No data', es: 'Sin datos' },
  'common.from': { ro: 'De la', en: 'From', es: 'Desde' },
  'common.to': { ro: 'Către', en: 'To', es: 'Hacia' },
  'common.date': { ro: 'Data', en: 'Date', es: 'Fecha' },
  'common.status': { ro: 'Status', en: 'Status', es: 'Estado' },
  'common.actions': { ro: 'Acțiuni', en: 'Actions', es: 'Acciones' },
  'common.details': { ro: 'Detalii', en: 'Details', es: 'Detalles' },
  'common.back': { ro: 'Înapoi', en: 'Back', es: 'Volver' },
  'common.confirm': { ro: 'Confirmă', en: 'Confirm', es: 'Confirmar' },

  // Auth
  'auth.login': { ro: 'Autentificare', en: 'Login', es: 'Iniciar sesión' },
  'auth.email': { ro: 'Email', en: 'Email', es: 'Correo electrónico' },
  'auth.password': { ro: 'Parolă', en: 'Password', es: 'Contraseña' },
  'auth.loginBtn': { ro: 'Intră în cont', en: 'Sign In', es: 'Iniciar sesión' },
  'auth.loginError': { ro: 'Email sau parolă incorectă', en: 'Invalid email or password', es: 'Email o contraseña incorrectos' },

  // Driver portal
  'driver.arrivedLoading': { ro: 'Am ajuns la încărcare', en: 'Arrived at Loading', es: 'Llegué a Carga' },
  'driver.departed': { ro: 'Am plecat', en: 'Departed', es: 'Salí' },
  'driver.arrivedUnloading': { ro: 'Am ajuns la descărcare', en: 'Arrived at Unloading', es: 'Llegué a Descarga' },
  'driver.delivered': { ro: 'Livrat', en: 'Delivered', es: 'Entregado' },
  'driver.sendLocation': { ro: 'Trimite locația', en: 'Send Location', es: 'Enviar Ubicación' },
  'driver.uploadDoc': { ro: 'Încarcă document', en: 'Upload Document', es: 'Subir Documento' },
};

import { create } from 'zustand';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nStore>((set, get) => ({
  language: 'ro',
  setLanguage: (language) => set({ language }),
  t: (key: string) => {
    const lang = get().language;
    return translations[key]?.[lang] ?? key;
  },
}));
