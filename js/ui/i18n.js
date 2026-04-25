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
