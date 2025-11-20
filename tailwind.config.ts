import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: '#ffffff',
				foreground: '#0f172a',
				primary: {
					DEFAULT: '#2563eb',
					foreground: '#ffffff',
				},
				secondary: {
					DEFAULT: '#f1f5f9',
					foreground: '#0f172a',
				},
				destructive: {
					DEFAULT: '#ef4444',
					foreground: '#ffffff',
				},
				muted: {
					DEFAULT: '#e5e7eb',
					foreground: '#334155',
				},
				accent: {
					DEFAULT: '#38bdf8',
					foreground: '#0f172a',
				},
				popover: {
					DEFAULT: '#f8fafc',
					foreground: '#0f172a',
				},
				card: {
					DEFAULT: '#f8fafc',
					foreground: '#0f172a',
				},
				sidebar: {
					DEFAULT: '#f1f5f9',
					foreground: '#0f172a',
					primary: '#2563eb',
					'primary-foreground': '#ffffff',
					accent: '#38bdf8',
					'accent-foreground': '#0f172a',
					border: '#e5e7eb',
					ring: '#2563eb',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'glow': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
					'50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }
				},
				'shimmer': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				},
				'bounce-slow': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'pulse-glow': {
					'0%, 100%': { opacity: '1', transform: 'scale(1)' },
					'50%': { opacity: '0.8', transform: 'scale(1.05)' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-down': {
					'0%': { transform: 'translateY(-20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.9)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite',
				'shimmer': 'shimmer 2s ease-in-out infinite',
				'bounce-slow': 'bounce-slow 2s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'slide-up': 'slide-up 0.5s ease-out',
				'slide-down': 'slide-down 0.5s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.3s ease-out'
			},
			fontFamily: {
				'inter': ['Inter', 'sans-serif'],
			},
			boxShadow: {
				'3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
				'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
				'glow-lg': '0 0 30px rgba(59, 130, 246, 0.5)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
