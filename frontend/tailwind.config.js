/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Semantic surface colors */
        void:     '#F8FAFC',
        surface:  '#F8FAFC',
        elevated: '#FFFFFF',
        /* Accent — Deep Indigo */
        accent: {
          DEFAULT: '#4F46E5',
          hover:   '#4338CA',
          light:   '#EEF2FF',
          mid:     '#818CF8',
          border:  '#C7D2FE',
        },
        /* Legacy single-name shorthands (used in className="text-cyan-*" etc.) */
        cyan:      '#4F46E5',
        violet:    '#4F46E5',
        amber:     '#D97706',
        rose:      '#E11D48',
        blueprint: '#818CF8',
        /* Semantic */
        success: {
          DEFAULT: '#059669',
          light:   '#ECFDF5',
          mid:     '#34D399',
          border:  '#A7F3D0',
        },
        warning: {
          DEFAULT: '#D97706',
          light:   '#FFFBEB',
        },
        danger: {
          DEFAULT: '#E11D48',
          light:   '#FFF1F2',
        },
        /* Text */
        text: {
          primary:   '#0F172A',
          secondary: '#334155',
          tertiary:  '#64748B',
          muted:     '#94A3B8',
        },
        /* Borders */
        border: {
          subtle:  '#F1F5F9',
          default: '#E2E8F0',
          strong:  '#CBD5E1',
        },
        /* Model brand colors — kept for ModelLogo etc. */
        gpt:        '#10A37F',
        gemini:     '#4285F4',
        grok:       '#FF6B6B',
        deepseek:   '#6C63FF',
        perplexity: '#20B2AA',
        claude_ai:  '#D4A853',
        mistral:    '#FF7043',
        llama:      '#1877F2',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'Menlo', 'monospace'],
        display: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'ping-slow':  'ping-slow 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.6s ease-in-out infinite',
        'spin-slow':  'spin 8s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'card':       '0 0 0 1px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06)',
        'card-hover': '0 0 0 1px rgba(15,23,42,0.08), 0 8px 24px rgba(15,23,42,0.09)',
        'glow-cyan':   '0 0 0 1px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.06)',
        'glow-violet': '0 0 0 1px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.06)',
        'glow-amber':  '0 0 0 1px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.06)',
        'glow-rose':   '0 0 0 1px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.06)',
      },
      backgroundImage: {
        'grid-dots': 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
