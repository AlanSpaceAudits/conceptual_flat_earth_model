// Tiny i18n table. Keys are stable; values are user-visible.
// Subscribers (DOM elements that need re-translation on language
// change) register via `onLangChange(fn)`; the active language id
// lives on `state.Language` and gets pushed through `setLang`.

const STRINGS = {
  en: {
    tab_view: 'View', tab_time: 'Time', tab_show: 'Show',
    tab_tracker: 'Tracker', tab_demos: 'Demos', tab_info: 'Info',
    btn_show: 'Show', btn_gp_override: 'GP Override',
    btn_enable_all: 'Enable All', btn_disable_all: 'Disable All',
    btn_disable_satellites: 'Disable Satellites',
    tip_grids: 'Toggle FE grid + Optical-vault grid + heavenly-vault azimuth degrees',
    tip_map: 'Open Map Projection settings',
    tip_starfield: 'Cycle starfield',
    lang_label: 'Language',
    grp_observer: 'Observer', grp_camera: 'Camera',
    grp_vault_of_heavens: 'Vault of the Heavens',
    grp_optical_vault: 'Optical Vault',
    grp_body_vaults: 'Body Vaults', grp_rays: 'Rays',
    grp_cosmology: 'Cosmology', grp_map_projection: 'Map Projection',
    grp_misc: 'Misc', grp_ephemeris: 'Ephemeris',
    grp_starfield: 'Starfield', grp_tracker_options: 'Tracker Options',
    grp_celestial_bodies: 'Celestial Bodies', grp_cel_nav: 'Cel Nav',
    grp_constellations: 'Constellations', grp_black_holes: 'Black Holes',
    grp_quasars: 'Quasars', grp_galaxies: 'Galaxies',
    grp_satellites: 'Satellites',
    grp_bright_star_catalog: 'Bright Star Catalog',
    grp_calendar: 'Calendar', grp_autoplay: 'Autoplay',
  },
  cs: {
    tab_view: 'Pohled', tab_time: 'Čas', tab_show: 'Zobrazit',
    tab_tracker: 'Sledovač', tab_demos: 'Ukázky', tab_info: 'Info',
    btn_show: 'Zobrazit', btn_gp_override: 'Přepis GP',
    btn_enable_all: 'Povolit vše', btn_disable_all: 'Zakázat vše',
    btn_disable_satellites: 'Zakázat satelity',
    tip_grids: 'Přepnout FE mřížku + mřížku optické klenby + azimutové stupně nebeské klenby',
    tip_map: 'Otevřít nastavení mapové projekce',
    tip_starfield: 'Procházet hvězdná pole',
    lang_label: 'Jazyk',
    grp_observer: 'Pozorovatel', grp_camera: 'Kamera',
    grp_vault_of_heavens: 'Nebeská klenba',
    grp_optical_vault: 'Optická klenba',
    grp_body_vaults: 'Klenby těles', grp_rays: 'Paprsky',
    grp_cosmology: 'Kosmologie', grp_map_projection: 'Projekce mapy',
    grp_misc: 'Různé', grp_ephemeris: 'Efemeridy',
    grp_starfield: 'Hvězdné pole', grp_tracker_options: 'Možnosti sledovače',
    grp_celestial_bodies: 'Nebeská tělesa', grp_cel_nav: 'Cel Nav',
    grp_constellations: 'Souhvězdí', grp_black_holes: 'Černé díry',
    grp_quasars: 'Kvazary', grp_galaxies: 'Galaxie',
    grp_satellites: 'Satelity',
    grp_bright_star_catalog: 'Katalog jasných hvězd',
    grp_calendar: 'Kalendář', grp_autoplay: 'Automatické přehrávání',
  },
  es: {
    tab_view: 'Vista', tab_time: 'Tiempo', tab_show: 'Mostrar',
    tab_tracker: 'Rastreador', tab_demos: 'Demos', tab_info: 'Info',
    btn_show: 'Mostrar', btn_gp_override: 'Anular GP',
    btn_enable_all: 'Activar todo', btn_disable_all: 'Desactivar todo',
    btn_disable_satellites: 'Desactivar satélites',
    tip_grids: 'Alternar cuadrícula FE + cuadrícula óptica + grados azimutales del cielo',
    tip_map: 'Abrir ajustes de proyección de mapa',
    tip_starfield: 'Cambiar campo de estrellas',
    lang_label: 'Idioma',
    grp_observer: 'Observador', grp_camera: 'Cámara',
    grp_vault_of_heavens: 'Bóveda Celeste',
    grp_optical_vault: 'Bóveda Óptica',
    grp_body_vaults: 'Bóvedas de Cuerpos', grp_rays: 'Rayos',
    grp_cosmology: 'Cosmología', grp_map_projection: 'Proyección de Mapa',
    grp_misc: 'Misc', grp_ephemeris: 'Efemérides',
    grp_starfield: 'Campo de Estrellas', grp_tracker_options: 'Opciones del Rastreador',
    grp_celestial_bodies: 'Cuerpos Celestes', grp_cel_nav: 'Cel Nav',
    grp_constellations: 'Constelaciones', grp_black_holes: 'Agujeros Negros',
    grp_quasars: 'Cuásares', grp_galaxies: 'Galaxias',
    grp_satellites: 'Satélites',
    grp_bright_star_catalog: 'Catálogo de Estrellas Brillantes',
    grp_calendar: 'Calendario', grp_autoplay: 'Reproducción Automática',
  },
};

let _lang = 'en';
const _subs = new Set();

export function setLang(id) {
  if (!STRINGS[id]) return;
  if (_lang === id) return;
  _lang = id;
  for (const fn of _subs) { try { fn(); } catch (_) {} }
}

export function t(key) {
  return (STRINGS[_lang] && STRINGS[_lang][key])
      || STRINGS.en[key]
      || key;
}

export function onLangChange(fn) {
  _subs.add(fn);
  return () => _subs.delete(fn);
}

export const LANGUAGES = [
  { id: 'en', label: 'EN' },
  { id: 'cs', label: 'CZ' },
  { id: 'es', label: 'ES' },
];
