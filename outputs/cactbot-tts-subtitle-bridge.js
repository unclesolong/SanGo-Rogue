// cactbot TTS Subtitle Bridge
// Put this in cactbot's raidboss user config. It does not edit triggers.
(() => {
  'use strict';

  if (window.__cactbotTtsSubtitleBridgeInstalled)
    return;
  window.__cactbotTtsSubtitleBridgeInstalled = true;

  const oldTransformTts = Options.TransformTts ?? ((text) => text);

  Options.TransformTts = (text) => {
    const transformed = oldTransformTts(text);
    const clean = String(transformed ?? '').trim();

    if (clean && typeof callOverlayHandler === 'function') {
      void callOverlayHandler({
        call: 'broadcast',
        source: 'cactbot-tts-subtitle-bridge',
        msg: {
          kind: 'cactbot-tts-subtitle',
          text: clean,
          time: Date.now(),
        },
      });
    }

    return transformed;
  };

  console.log('[cactbot-tts-subtitle] bridge installed');
})();
