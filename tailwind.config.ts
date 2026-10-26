import type { Config } from 'tailwindcss'

// Design tokens follow the Atlassian Design System (see design.md).
// Colour names mirror ADS semantic tokens so that the intent of each colour is
// clear at the point of use (e.g. `bg-danger-subtle text-danger-text`).
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		colors: {
			transparent: 'transparent',
			current: 'currentColor',
			white: '#FFFFFF',
			black: '#000000',

			// Brand (Blue 700 primary, 800 hover, 900 pressed).
			brand: {
				DEFAULT: '#1868DB',
				hover: '#0055CC',
				pressed: '#09326C',
				subtlest: '#E9F2FF',
				subtle: '#CCE0FF',
				bolder: '#082145'
			},

			// Neutral ramp (ADS N0 - N1100).
			n: {
				0: '#FFFFFF',
				100: '#F7F8F9',
				200: '#F1F2F4',
				300: '#DCDFE4',
				400: '#B3B9C4',
				500: '#8590A2',
				600: '#758195',
				700: '#626F86',
				800: '#44546F',
				900: '#2C3E5D',
				1000: '#172B4D',
				1100: '#091E42'
			},
			// Alpha neutrals used for hover/pressed backgrounds.
			na: {
				100: 'rgba(9, 30, 66, 0.03)',
				200: 'rgba(9, 30, 66, 0.06)',
				300: 'rgba(9, 30, 66, 0.14)',
				400: 'rgba(9, 30, 66, 0.31)',
				500: 'rgba(9, 30, 66, 0.49)'
			},

			// Text.
			ink: {
				DEFAULT: '#172B4D',
				subtle: '#44546F',
				subtlest: '#626F86',
				disabled: 'rgba(9, 30, 66, 0.31)',
				inverse: '#FFFFFF'
			},

			// Surfaces.
			surface: {
				DEFAULT: '#FFFFFF',
				sunken: '#F7F8F9',
				raised: '#FFFFFF',
				overlay: '#FFFFFF'
			},

			// Borders.
			line: {
				DEFAULT: 'rgba(9, 30, 66, 0.14)',
				bold: '#758195',
				input: '#8590A2',
				disabled: 'rgba(9, 30, 66, 0.06)'
			},

			// Status colours. `DEFAULT` is the icon/accent colour from design.md,
			// `subtle` the tinted background, `text` the text colour used on it and
			// `bold` the solid background with inverse text.
			success: {
				DEFAULT: '#22A06B',
				subtle: '#DCFFF1',
				'subtle-hover': '#BAF3DB',
				text: '#216E4E',
				bold: '#1F845A',
				'bold-hover': '#216E4E',
				border: '#22A06B'
			},
			warning: {
				DEFAULT: '#B38600',
				subtle: '#FFF7D6',
				'subtle-hover': '#F8E6A0',
				text: '#7F5F01',
				bold: '#F5CD47',
				'bold-hover': '#E2B203',
				'bold-pressed': '#CF9F02',
				border: '#B38600'
			},
			danger: {
				DEFAULT: '#CA3521',
				subtle: '#FFECEB',
				'subtle-hover': '#FFD5D2',
				text: '#AE2E24',
				bold: '#CA3521',
				'bold-hover': '#AE2E24',
				'bold-pressed': '#5D1F1A',
				border: '#E2483D'
			},
			info: {
				DEFAULT: '#1D7F8C',
				subtle: '#E7F9FF',
				'subtle-hover': '#C6EDFB',
				text: '#206A83',
				bold: '#1D7F8C',
				border: '#1D7F8C'
			},
			discovery: {
				DEFAULT: '#6E5DC6',
				subtle: '#F3F0FF',
				'subtle-hover': '#DFD8FD',
				text: '#5E4DB2',
				bold: '#6E5DC6',
				border: '#8270DB'
			}
		},

		fontFamily: {
			sans: [
				'ui-sans-serif',
				'-apple-system',
				'BlinkMacSystemFont',
				'"Segoe UI"',
				'Roboto',
				'Oxygen',
				'Ubuntu',
				'"Fira Sans"',
				'"Droid Sans"',
				'"Helvetica Neue"',
				'sans-serif'
			],
			mono: [
				'"SFMono-Medium"',
				'"SF Mono"',
				'"Segoe UI Mono"',
				'"Roboto Mono"',
				'"Ubuntu Mono"',
				'Menlo',
				'Consolas',
				'Courier',
				'monospace'
			]
		},

		// Type scale from design.md. Each entry carries its line height (and
		// weight for headings) so that `text-h2` is a complete text style.
		fontSize: {
			display: ['35px', { lineHeight: '40px', fontWeight: '500' }],
			h1: ['29px', { lineHeight: '32px', fontWeight: '600' }],
			h2: ['24px', { lineHeight: '28px', fontWeight: '500' }],
			h3: ['20px', { lineHeight: '24px', fontWeight: '500' }],
			h4: ['16px', { lineHeight: '20px', fontWeight: '600' }],
			h5: ['14px', { lineHeight: '16px', fontWeight: '600' }],
			h6: ['12px', { lineHeight: '16px', fontWeight: '600' }],
			'body-lg': ['16px', { lineHeight: '24px' }],
			body: ['14px', { lineHeight: '20px' }],
			small: ['12px', { lineHeight: '16px' }],
			caption: ['11px', { lineHeight: '16px' }]
		},

		extend: {
			borderRadius: {
				'ds-sm': 'var(--ds-radius-sm)',
				ds: 'var(--ds-radius)',
				'ds-lg': 'var(--ds-radius-lg)',
				'ds-xl': 'var(--ds-radius-xl)'
			},
			boxShadow: {
				raised: '0 1px 1px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
				overlay: '0 8px 12px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31)'
			},
			maxWidth: {
				page: '1200px',
				prose: '640px'
			},
			spacing: {
				// Fixed layout sizes.
				appbar: '56px',
				sidenav: '240px'
			},
			screens: {
				xs: '480px'
			}
		}
	},

	plugins: []
} satisfies Config
