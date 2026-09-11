'use client';
export type Lang = 'en' | 'es';

const S = {
  todayJobs:      { en: 'Today', es: 'Hoy' },
  noJobs:         { en: 'No jobs assigned', es: 'Sin trabajos asignados' },
  noJobsBody:     { en: 'When the office schedules you, jobs appear here.',
                    es: 'Cuando la oficina te asigne un trabajo, aparecera aqui.' },
  clockIn:        { en: 'Start work', es: 'Empezar' },
  clockOut:       { en: 'Stop work', es: 'Terminar' },
  working:        { en: 'On the clock', es: 'Trabajando' },
  closeout:       { en: 'Close out job', es: 'Cerrar trabajo' },
  yes:            { en: 'Yes', es: 'Si' },
  no:             { en: 'No', es: 'No' },
  na:             { en: 'N/A', es: 'N/A' },
  photoNeeded:    { en: 'Add a photo showing the problem.',
                    es: 'Agrega una foto del problema.' },
  addNote:        { en: 'What happened? (optional)', es: 'Que paso? (opcional)' },
  submit:         { en: 'Submit closeout', es: 'Enviar cierre' },
  remaining:      { en: 'left', es: 'faltan' },
  needPhotos:     { en: 'Add the missing photos first', es: 'Agrega las fotos faltantes' },
  submitted:      { en: 'Sent to the office', es: 'Enviado a la oficina' },
  offline:        { en: 'Offline — your work is saved and will send when you have signal',
                    es: 'Sin senal — se guardo y se enviara cuando haya senal' },
  signIn:         { en: 'Sign in', es: 'Entrar' },
  email:          { en: 'Email', es: 'Correo' },
  password:       { en: 'Password', es: 'Contrasena' },
  back:           { en: 'Back', es: 'Atras' },
  progressPhotos: { en: 'Progress photos', es: 'Fotos de avance' },
  hoursToday:     { en: 'Hours today', es: 'Horas hoy' },
};

export function t(key: keyof typeof S, lang: Lang) { return S[key][lang]; }

export function useLang(): [Lang, (l: Lang) => void] {
  if (typeof window === 'undefined') return ['en', () => {}];
  const get = () => (localStorage.getItem('lang') as Lang) || 'en';
  const set = (l: Lang) => { localStorage.setItem('lang', l); location.reload(); };
  return [get(), set];
}
