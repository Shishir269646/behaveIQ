// sdk/fingerprint.js - Fingerprint Generator
class FingerprintGenerator {
    async generate() {
      const components = {
        canvas: await this.getCanvasFingerprint(),
        webgl: await this.getWebGLFingerprint(),
        audio: await this.getAudioFingerprint(),
        fonts: await this.getFontFingerprint()
      };

      const hash = await this.hashComponents(components);

      return { hash, components };
    }

    async getCanvasFingerprint() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 200;
      canvas.height = 50;
      
      // Draw text
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('BehaveIQ', 2, 15);
      
      // Draw shapes
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillRect(10, 10, 50, 50);
      
      return canvas.toDataURL();
    }

    async getWebGLFingerprint() {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return 'not_supported';
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return 'no_debug_info';
      
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      return `${vendor}~${renderer}`;
    }

    async getAudioFingerprint() {
      return new Promise((resolve) => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return resolve('not_supported');
          
          const context = new AudioContext();
          const oscillator = context.createOscillator();
          const analyser = context.createAnalyser();
          const gainNode = context.createGain();
          const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

          gainNode.gain.value = 0;
          oscillator.type = 'triangle';
          oscillator.connect(analyser);
          analyser.connect(scriptProcessor);
          scriptProcessor.connect(gainNode);
          gainNode.connect(context.destination);

          scriptProcessor.onaudioprocess = function(event) {
            const output = event.outputBuffer.getChannelData(0);
            const hash = Array.from(output).slice(0, 30).reduce((a, b) => a + b, 0);
            oscillator.disconnect();
            scriptProcessor.disconnect();
            context.close();
            resolve(hash.toString());
          };

          oscillator.start(0);
        } catch (error) {
          resolve('error');
        }
      });
    }

    async getFontFingerprint() {
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const testFonts = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New',
        'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS'
      ];

      const detectedFonts = [];
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const baseMeasurements = {};
      baseFonts.forEach(font => {
        ctx.font = `${testSize} ${font}`;
        baseMeasurements[font] = ctx.measureText(testString).width;
      });

      testFonts.forEach(font => {
        let detected = false;
        baseFonts.forEach(baseFont => {
          ctx.font = `${testSize} ${font}, ${baseFont}`;
          const width = ctx.measureText(testString).width;
          if (width !== baseMeasurements[baseFont]) {
            detected = true;
          }
        });
        if (detected) detectedFonts.push(font);
      });

      return detectedFonts;
    }

    async hashComponents(components) {
      const str = JSON.stringify(components);
      const buffer = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }

export default FingerprintGenerator;