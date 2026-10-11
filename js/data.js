/* Dilo Fácil — datos iniciales.
   Todo es editable por la persona usuaria. Para añadir otro idioma en el futuro,
   se puede crear un archivo similar (por ejemplo data.en.js) con la misma estructura. */
window.DF = window.DF || {};

DF.DEFAULT_CATEGORIES = [
  { id: 'necesidades', name: 'Necesidades básicas', icon: '🍽️' },
  { id: 'comunicacion', name: 'Comunicación cotidiana', icon: '💬' },
  { id: 'emociones', name: 'Emociones y sensaciones', icon: '🫶' },
  { id: 'sensorial', name: 'Descanso y necesidades sensoriales', icon: '🎧' },
  { id: 'ayuda', name: 'Ayuda y seguridad', icon: '🆘' },
  { id: 'estudios', name: 'Estudios y trabajo', icon: '📚' },
  { id: 'salud', name: 'Salud y citas', icon: '🩺' },
  { id: 'personal', name: 'Frases personalizadas', icon: '⭐' }
];

// [texto, icono, categoría]
DF.DEFAULT_PHRASES = [
  ['Tengo hambre.', '🍽️', 'necesidades'],
  ['Tengo sed.', '🥤', 'necesidades'],
  ['Necesito ir al baño.', '🚻', 'necesidades'],
  ['Tengo frío.', '🥶', 'necesidades'],
  ['Tengo calor.', '🥵', 'necesidades'],
  ['Necesito descansar.', '🛏️', 'necesidades'],

  ['Sí.', '✅', 'comunicacion'],
  ['No.', '❌', 'comunicacion'],
  ['No estoy seguro.', '🤔', 'comunicacion'],
  ['No entiendo.', '❓', 'comunicacion'],
  ['¿Puedes repetirlo?', '🔁', 'comunicacion'],
  ['Necesito más tiempo.', '⏳', 'comunicacion'],
  ['Prefiero escribir.', '✏️', 'comunicacion'],
  ['Quiero comunicar algo.', '🙋', 'comunicacion'],

  ['Me siento bien.', '🙂', 'emociones'],
  ['Estoy incómodo.', '😣', 'emociones'],
  ['Me siento nervioso.', '😬', 'emociones'],
  ['Estoy cansado.', '🥱', 'emociones'],
  ['Me cuesta explicar cómo me siento.', '💭', 'emociones'],
  ['No sé cómo me siento ahora.', '🌫️', 'emociones'],

  ['Hay demasiado ruido.', '🔊', 'sensorial'],
  ['La luz me molesta.', '💡', 'sensorial'],
  ['Necesito un lugar tranquilo.', '🌿', 'sensorial'],
  ['Necesito reducir los estímulos.', '🎧', 'sensorial'],
  ['Necesito una pausa.', '⏸️', 'sensorial'],
  ['Quiero salir de este lugar.', '🚪', 'sensorial'],
  ['Necesito silencio.', '🤫', 'sensorial'],
  ['Necesito [una pausa] porque [hay demasiado ruido].', '📝', 'sensorial'],

  ['Necesito ayuda.', '🆘', 'ayuda'],
  ['No me encuentro bien.', '🤒', 'ayuda'],
  ['Necesito contactar con alguien.', '📞', 'ayuda'],
  ['Por favor, dame espacio.', '↔️', 'ayuda'],
  ['Necesito que me expliques qué está pasando.', '🧭', 'ayuda'],

  ['¿Me lo puedes dar por escrito?', '📄', 'estudios'],
  ['Necesito instrucciones claras, paso a paso.', '📋', 'estudios'],
  ['Necesito más tiempo para esta tarea.', '⏳', 'estudios'],

  ['Tengo una cita.', '📅', 'salud'],
  ['Me duele [aquí].', '🩹', 'salud'],
  ['Necesito que me hables despacio.', '🐢', 'salud']
];

// Frases del modo rápido (por texto, se convierten en ids al crear los datos)
DF.DEFAULT_QUICK = ['Necesito ayuda.', 'Necesito descansar.', 'Sí.', 'No.', 'Necesito silencio.', 'Quiero comunicar algo.'];

DF.ICON_SUGGESTIONS = ['🙂', '😣', '🆘', '✅', '❌', '🍽️', '🥤', '🚻', '🛏️', '🎧', '🔊', '💡', '🏠', '🚪', '📞', '❤️', '⭐', '❓'];

DF.COLORS = ['', 'blue', 'green', 'yellow', 'purple', 'red', 'grey'];
