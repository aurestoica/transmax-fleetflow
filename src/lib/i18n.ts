// Full i18n implementation with persistence
import { create } from 'zustand';

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
  'nav.map': { ro: 'Hartă Live', en: 'Live Map', es: 'Mapa en Vivo' },
  'nav.logout': { ro: 'Deconectare', en: 'Logout', es: 'Cerrar sesión' },
  'nav.profile': { ro: 'Profil', en: 'Profile', es: 'Perfil' },

  // Dashboard
  'dash.activeTrips': { ro: 'Curse Active', en: 'Active Trips', es: 'Viajes Activos' },
  'dash.plannedTrips': { ro: 'Curse Planificate', en: 'Planned Trips', es: 'Viajes Planificados' },
  'dash.availableDrivers': { ro: 'Șoferi Disponibili', en: 'Available Drivers', es: 'Conductores Disponibles' },
  'dash.availableTrucks': { ro: 'Camioane Disponibile', en: 'Available Trucks', es: 'Camiones Disponibles' },
  'dash.delays': { ro: 'Întârzieri', en: 'Delays', es: 'Retrasos' },
  'dash.revenue': { ro: 'Venit Total', en: 'Total Revenue', es: 'Ingresos Totales' },
  'dash.recentTrips': { ro: 'Curse Recente', en: 'Recent Trips', es: 'Viajes Recientes' },
  'dash.notifications': { ro: 'Notificări', en: 'Notifications', es: 'Notificaciones' },
  'dash.customize': { ro: 'Personalizează', en: 'Customize', es: 'Personalizar' },
  'dash.reset': { ro: 'Resetare', en: 'Reset', es: 'Restablecer' },
  'dash.saved': { ro: 'Dashboard salvat!', en: 'Dashboard saved!', es: '¡Panel guardado!' },
  'dash.resetDone': { ro: 'Dashboard resetat la configurația implicită', en: 'Dashboard reset to default', es: 'Panel restablecido a la configuración predeterminada' },
  'dash.editHint': { ro: 'Trage widget-urile pentru a le reordona. Folosește iconița de ochi pentru a ascunde/afișa.', en: 'Drag widgets to reorder. Use the eye icon to hide/show.', es: 'Arrastra los widgets para reordenar. Usa el ícono del ojo para ocultar/mostrar.' },
  'dash.saving': { ro: 'Se salvează...', en: 'Saving...', es: 'Guardando...' },

  // Dashboard widgets
  'widget.stats': { ro: 'Statistici rapide', en: 'Quick Statistics', es: 'Estadísticas Rápidas' },
  'widget.expiry': { ro: 'Expirări Apropiate', en: 'Upcoming Expirations', es: 'Vencimientos Próximos' },
  'widget.recentTrips': { ro: 'Curse Recente', en: 'Recent Trips', es: 'Viajes Recientes' },
  'widget.driverStatus': { ro: 'Status Șoferi', en: 'Driver Status', es: 'Estado de Conductores' },
  'widget.fleet': { ro: 'Flotă Vehicule', en: 'Vehicle Fleet', es: 'Flota de Vehículos' },
  'widget.revenue': { ro: 'Sumar Financiar', en: 'Financial Summary', es: 'Resumen Financiero' },
  'widget.noExpiry': { ro: 'Nicio expirare în următoarele 30 de zile', en: 'No expirations in the next 30 days', es: 'Sin vencimientos en los próximos 30 días' },
  'widget.expired': { ro: 'Expirat', en: 'Expired', es: 'Vencido' },
  'widget.allDrivers': { ro: 'Toți →', en: 'All →', es: 'Todos →' },
  'widget.allVehicles': { ro: 'Toate →', en: 'All →', es: 'Todos →' },
  'widget.vehiclesInFleet': { ro: 'vehicule în flotă', en: 'vehicles in fleet', es: 'vehículos en la flota' },
  'widget.revenue.income': { ro: 'Venituri', en: 'Revenue', es: 'Ingresos' },
  'widget.revenue.expenses': { ro: 'Cheltuieli', en: 'Expenses', es: 'Gastos' },
  'widget.revenue.netProfit': { ro: 'Profit net', en: 'Net Profit', es: 'Beneficio Neto' },
  'widget.revenue.fuel': { ro: 'Combustibil', en: 'Fuel', es: 'Combustible' },
  'widget.revenue.roadTaxes': { ro: 'Taxe drum', en: 'Road Taxes', es: 'Impuestos de Carretera' },
  'widget.revenue.driverAdvances': { ro: 'Avans șoferi', en: 'Driver Advances', es: 'Anticipos de Conductores' },
  'widget.revenue.otherExpenses': { ro: 'Alte cheltuieli', en: 'Other Expenses', es: 'Otros Gastos' },
  'widget.revenue.tripsThisMonth': { ro: 'curse în această lună', en: 'trips this month', es: 'viajes este mes' },

  // Driver statuses (widget)
  'driverStatus.available': { ro: 'Disponibili', en: 'Available', es: 'Disponibles' },
  'driverStatus.onTrip': { ro: 'În cursă', en: 'On Trip', es: 'En Viaje' },
  'driverStatus.offDuty': { ro: 'Liber', en: 'Off Duty', es: 'Libre' },
  'driverStatus.unavailable': { ro: 'Indisponibili', en: 'Unavailable', es: 'No Disponibles' },

  // Vehicle statuses (widget)
  'vehicleStatus.available': { ro: 'Disponibile', en: 'Available', es: 'Disponibles' },
  'vehicleStatus.onTrip': { ro: 'În cursă', en: 'On Trip', es: 'En Viaje' },
  'vehicleStatus.maintenance': { ro: 'Service', en: 'Maintenance', es: 'Mantenimiento' },
  'vehicleStatus.other': { ro: 'Altele', en: 'Other', es: 'Otros' },

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
  'common.minimize': { ro: 'Minimizează', en: 'Minimize', es: 'Minimizar' },
  'common.active': { ro: 'Activă', en: 'Active', es: 'Activa' },
  'common.inactive': { ro: 'Inactivă', en: 'Inactive', es: 'Inactiva' },

  // Auth
  'auth.login': { ro: 'Autentificare', en: 'Login', es: 'Iniciar sesión' },
  'auth.email': { ro: 'Email', en: 'Email', es: 'Correo electrónico' },
  'auth.password': { ro: 'Parolă', en: 'Password', es: 'Contraseña' },
  'auth.loginBtn': { ro: 'Intră în cont', en: 'Sign In', es: 'Iniciar sesión' },
  'auth.loginError': { ro: 'Email sau parolă incorectă', en: 'Invalid email or password', es: 'Email o contraseña incorrectos' },
  'auth.subtitle': { ro: 'Platforma de Management Transport', en: 'Transport Management Platform', es: 'Plataforma de Gestión de Transporte' },
  'auth.registerCompany': { ro: 'Înregistrează o companie nouă', en: 'Register a new company', es: 'Registrar una empresa nueva' },
  'auth.copyright': { ro: '© 2026 Transport Management Platform', en: '© 2026 Transport Management Platform', es: '© 2026 Transport Management Platform' },

  // Register
  'register.title': { ro: 'Companie nouă', en: 'New Company', es: 'Nueva Empresa' },
  'register.subtitle': { ro: 'Completează datele pentru a solicita activarea contului', en: 'Fill in the details to request account activation', es: 'Complete los datos para solicitar la activación de la cuenta' },
  'register.backToLogin': { ro: 'Înapoi la autentificare', en: 'Back to login', es: 'Volver al inicio de sesión' },
  'register.companySection': { ro: 'Date companie', en: 'Company details', es: 'Datos de la empresa' },
  'register.companyName': { ro: 'Denumire companie', en: 'Company name', es: 'Nombre de la empresa' },
  'register.cif': { ro: 'CIF', en: 'Tax ID', es: 'CIF' },
  'register.phone': { ro: 'Telefon', en: 'Phone', es: 'Teléfono' },
  'register.address': { ro: 'Adresă', en: 'Address', es: 'Dirección' },
  'register.companyEmail': { ro: 'Email companie', en: 'Company email', es: 'Email de la empresa' },
  'register.adminSection': { ro: 'Cont administrator', en: 'Administrator account', es: 'Cuenta de administrador' },
  'register.fullName': { ro: 'Nume complet', en: 'Full name', es: 'Nombre completo' },
  'register.adminEmail': { ro: 'Email', en: 'Email', es: 'Email' },
  'register.adminEmailHint': { ro: 'va fi folosit pentru autentificare', en: 'will be used for login', es: 'se usará para iniciar sesión' },
  'register.passwordHint': { ro: 'minim 6 caractere', en: 'minimum 6 characters', es: 'mínimo 6 caracteres' },
  'register.submit': { ro: 'Trimite cererea de înregistrare', en: 'Submit registration request', es: 'Enviar solicitud de registro' },
  'register.disclaimer': { ro: 'Contul va fi verificat și activat de administratorul platformei în maxim 48 de ore.', en: 'The account will be verified and activated by the platform administrator within 48 hours.', es: 'La cuenta será verificada y activada por el administrador de la plataforma en un máximo de 48 horas.' },
  'register.errorGeneric': { ro: 'Eroare la înregistrare', en: 'Registration error', es: 'Error de registro' },

  // Register success
  'register.successTitle': { ro: 'Cerere trimisă!', en: 'Request sent!', es: '¡Solicitud enviada!' },
  'register.successMsg': { ro: 'a fost înregistrată cu succes.', en: 'has been registered successfully.', es: 'ha sido registrada con éxito.' },
  'register.successDetail': { ro: 'Contul va fi verificat și activat de administratorul platformei în maxim', en: 'The account will be verified and activated by the platform administrator within', es: 'La cuenta será verificada y activada por el administrador de la plataforma en un máximo de' },
  'register.successHours': { ro: '48 de ore', en: '48 hours', es: '48 horas' },
  'register.successLoginHint': { ro: 'Te poți autentifica imediat pentru a vizualiza panoul, dar funcționalitățile vor fi disponibile după activare.', en: 'You can log in now to view the panel, but features will be available after activation.', es: 'Puedes iniciar sesión ahora para ver el panel, pero las funciones estarán disponibles después de la activación.' },
  'register.loginNow': { ro: 'Autentifică-te acum', en: 'Log in now', es: 'Iniciar sesión ahora' },

  // Company blocked overlay
  'blocked.pendingTitle': { ro: 'Companie în curs de verificare', en: 'Company verification in progress', es: 'Verificación de empresa en curso' },
  'blocked.pendingMsg': { ro: 'Cererea ta de înregistrare a fost primită și este în curs de verificare de către administratorul platformei.', en: 'Your registration request has been received and is being reviewed by the platform administrator.', es: 'Su solicitud de registro ha sido recibida y está siendo revisada por el administrador de la plataforma.' },
  'blocked.pendingTime': { ro: 'Acest proces durează de obicei până la', en: 'This process usually takes up to', es: 'Este proceso suele tardar hasta' },
  'blocked.hours48': { ro: '48 de ore', en: '48 hours', es: '48 horas' },
  'blocked.pendingNotify': { ro: 'Vei primi o notificare când contul este activat.', en: 'You will receive a notification when the account is activated.', es: 'Recibirá una notificación cuando la cuenta sea activada.' },
  'blocked.verifying': { ro: 'Verificare în curs...', en: 'Verification in progress...', es: 'Verificación en curso...' },
  'blocked.deactivatedTitle': { ro: 'Companie dezactivată', en: 'Company deactivated', es: 'Empresa desactivada' },
  'blocked.deactivatedMsg': { ro: 'Contul companiei tale a fost dezactivat de administratorul platformei.', en: 'Your company account has been deactivated by the platform administrator.', es: 'La cuenta de su empresa ha sido desactivada por el administrador de la plataforma.' },
  'blocked.deactivatedHint': { ro: 'Pentru mai multe informații sau pentru a solicita reactivarea, contactează administratorul platformei.', en: 'For more information or to request reactivation, contact the platform administrator.', es: 'Para más información o para solicitar la reactivación, contacte al administrador de la plataforma.' },

  // Driver portal
  'driver.arrivedLoading': { ro: 'Am ajuns la încărcare', en: 'Arrived at Loading', es: 'Llegué a Carga' },
  'driver.departed': { ro: 'Am plecat', en: 'Departed', es: 'Salí' },
  'driver.arrivedUnloading': { ro: 'Am ajuns la descărcare', en: 'Arrived at Unloading', es: 'Llegué a Descarga' },
  'driver.delivered': { ro: 'Livrat', en: 'Delivered', es: 'Entregado' },
  'driver.sendLocation': { ro: 'Trimite locația', en: 'Send Location', es: 'Enviar Ubicación' },
  'driver.uploadDoc': { ro: 'Încarcă document', en: 'Upload Document', es: 'Subir Documento' },

  // Settings
  'settings.title': { ro: 'Setări', en: 'Settings', es: 'Configuración' },
  'settings.security': { ro: 'Securitate', en: 'Security', es: 'Seguridad' },
  'settings.changePassword': { ro: 'Schimbă parola', en: 'Change Password', es: 'Cambiar Contraseña' },
  'settings.notifications': { ro: 'Notificări Email', en: 'Email Notifications', es: 'Notificaciones por Email' },
  'settings.notificationsDesc': { ro: 'Configurează ce notificări prin email vrei să primești', en: 'Configure which email notifications you want to receive', es: 'Configura qué notificaciones por email quieres recibir' },
  'settings.enableEmail': { ro: 'Activează notificări prin email', en: 'Enable email notifications', es: 'Activar notificaciones por email' },
  'settings.enableEmailDesc': { ro: 'Primește notificări direct pe email', en: 'Receive notifications directly to email', es: 'Recibe notificaciones directamente por email' },
  'settings.company': { ro: 'Profil Companie', en: 'Company Profile', es: 'Perfil de Empresa' },
  'settings.companyLogo': { ro: 'Logo Companie', en: 'Company Logo', es: 'Logo de la Empresa' },
  'settings.uploadLogo': { ro: 'Încarcă logo', en: 'Upload logo', es: 'Subir logo' },
  'settings.removeLogo': { ro: 'Elimină logo', en: 'Remove logo', es: 'Eliminar logo' },
  'settings.userProfile': { ro: 'Profil Utilizator', en: 'User Profile', es: 'Perfil de Usuario' },
  'settings.language': { ro: 'Limbă', en: 'Language', es: 'Idioma' },
  'settings.activityLog': { ro: 'Jurnal Activitate', en: 'Activity Log', es: 'Registro de Actividad' },
  'settings.viewLog': { ro: 'Vizualizează logul complet de activitate', en: 'View full activity log', es: 'Ver registro completo de actividad' },
};

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Load initial language from localStorage
const getInitialLanguage = (): Language => {
  try {
    const stored = localStorage.getItem('app-language');
    if (stored && ['ro', 'en', 'es'].includes(stored)) return stored as Language;
  } catch {}
  return 'ro';
};

export const useI18n = create<I18nStore>((set, get) => ({
  language: getInitialLanguage(),
  setLanguage: (language) => {
    localStorage.setItem('app-language', language);
    set({ language });
  },
  t: (key: string) => {
    const lang = get().language;
    return translations[key]?.[lang] ?? key;
  },
}));
