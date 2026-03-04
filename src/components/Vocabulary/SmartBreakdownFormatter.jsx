/**
 * SmartBreakdownFormatter.jsx
 *
 * Premium Markdown renderer for the Kanji Breakdown panel.
 * Uses react-markdown (100% offline) with rich, beautiful custom styling.
 *
 * Special bold label → badge:
 *   **Word:**                    → blue gradient badge
 *   **Reading:**                 → green gradient badge
 *   **Bangla Meaning:**          → purple gradient badge
 *   **Bangla & English Meaning:**→ purple gradient badge
 *   **Meaning:**                 → purple gradient badge
 *   All other **bold**           → styled <strong>
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { getStyles } from '../../utils/breakdown/breakdownStyles.js';

// ─────────────────────────────────────────────────────────────────
//  Label → badge colour key
// ─────────────────────────────────────────────────────────────────
const BADGE_MAP = {
    // Core word info
    'word': 'blue',
    'word:': 'blue',
    'reading': 'green',
    'reading:': 'green',
    'bangla meaning': 'purple',
    'bangla meaning:': 'purple',
    'bangla & english meaning': 'purple',
    'bangla & english meaning:': 'purple',
    'bangla and english meaning': 'purple',
    'bangla and english meaning:': 'purple',
    'meaning': 'purple',
    'meaning:': 'purple',
    // Japanese readings
    "on'yomi": 'orange',
    "on'yomi:": 'orange',
    'onyomi': 'orange',
    'onyomi:': 'orange',
    'on-yomi': 'orange',
    'on-yomi:': 'orange',
    "kun'yomi": 'teal',
    "kun'yomi:": 'teal',
    'kunyomi': 'teal',
    'kunyomi:': 'teal',
    'kun-yomi': 'teal',
    'kun-yomi:': 'teal',
    // Extras
    'example': 'rose',
    'example:': 'rose',
    'note': 'amber',
    'note:': 'amber',
    'tip': 'amber',
    'tip:': 'amber',
    'stroke count': 'blue',
    'stroke count:': 'blue',
    'radical': 'orange',
    'radical:': 'orange',
    'logic': 'purple',
    'logic:': 'purple',
    'লজিক': 'purple',
    'লজিক:': 'purple',
};

// ─────────────────────────────────────────────────────────────────
//  Badge colour presets (light + dark)
// ─────────────────────────────────────────────────────────────────
const COLOURS = {
    blue: {
        light: { bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', text: '#1d4ed8', border: '#93c5fd', shadow: 'rgba(59,130,246,0.25)' },
        dark: { bg: 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(37,99,235,0.2))', text: '#93c5fd', border: 'rgba(59,130,246,0.4)', shadow: 'rgba(59,130,246,0.35)' },
    },
    green: {
        light: { bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', text: '#15803d', border: '#86efac', shadow: 'rgba(34,197,94,0.25)' },
        dark: { bg: 'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(22,163,74,0.15))', text: '#86efac', border: 'rgba(34,197,94,0.4)', shadow: 'rgba(34,197,94,0.3)' },
    },
    purple: {
        light: { bg: 'linear-gradient(135deg,#f3e8ff,#e9d5ff)', text: '#7e22ce', border: '#d8b4fe', shadow: 'rgba(168,85,247,0.25)' },
        dark: { bg: 'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(147,51,234,0.15))', text: '#d8b4fe', border: 'rgba(168,85,247,0.4)', shadow: 'rgba(168,85,247,0.3)' },
    },
    orange: {
        light: { bg: 'linear-gradient(135deg,#ffedd5,#fed7aa)', text: '#c2410c', border: '#fdba74', shadow: 'rgba(249,115,22,0.25)' },
        dark: { bg: 'linear-gradient(135deg,rgba(249,115,22,0.2),rgba(234,88,12,0.15))', text: '#fdba74', border: 'rgba(249,115,22,0.4)', shadow: 'rgba(249,115,22,0.3)' },
    },
    teal: {
        light: { bg: 'linear-gradient(135deg,#ccfbf1,#99f6e4)', text: '#0f766e', border: '#5eead4', shadow: 'rgba(20,184,166,0.25)' },
        dark: { bg: 'linear-gradient(135deg,rgba(20,184,166,0.2),rgba(13,148,136,0.15))', text: '#5eead4', border: 'rgba(20,184,166,0.4)', shadow: 'rgba(20,184,166,0.3)' },
    },
    rose: {
        light: { bg: 'linear-gradient(135deg,#ffe4e6,#fecdd3)', text: '#be123c', border: '#fda4af', shadow: 'rgba(244,63,94,0.25)' },
        dark: { bg: 'linear-gradient(135deg,rgba(244,63,94,0.2),rgba(225,29,72,0.15))', text: '#fda4af', border: 'rgba(244,63,94,0.4)', shadow: 'rgba(244,63,94,0.3)' },
    },
    amber: {
        light: { bg: 'linear-gradient(135deg,#fef9c3,#fef08a)', text: '#a16207', border: '#fde047', shadow: 'rgba(234,179,8,0.25)' },
        dark: { bg: 'linear-gradient(135deg,rgba(234,179,8,0.2),rgba(202,138,4,0.15))', text: '#fde047', border: 'rgba(234,179,8,0.4)', shadow: 'rgba(234,179,8,0.3)' },
    },
};

// ─────────────────────────────────────────────────────────────────
//  Badge component — gradient pill with glow shadow
// ─────────────────────────────────────────────────────────────────
function Badge({ label, colourKey, isDark }) {
    const palette = (COLOURS[colourKey] || COLOURS.blue)[isDark ? 'dark' : 'light'];
    return (
        <span style={{
            display: 'inline-block',
            background: palette.bg,
            color: palette.text,
            border: `1px solid ${palette.border}`,
            boxShadow: `0 1px 6px ${palette.shadow}`,
            fontWeight: '700',
            fontSize: '0.68rem',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: '9999px',
            marginRight: '6px',
            verticalAlign: 'middle',
            whiteSpace: 'nowrap',
        }}>
            {label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────
//  Custom <strong> renderer
// ─────────────────────────────────────────────────────────────────
function makeStrongRenderer(isDark) {
    return function StrongRenderer({ children }) {
        const raw = React.Children.toArray(children)
            .map(c => (typeof c === 'string' ? c : ''))
            .join('');

        // Normalise: lowercase + replace smart-quotes/curly apostrophes with straight
        const normalised = raw
            .trim()
            .toLowerCase()
            .replace(/[\u2018\u2019\u02bc]/g, "'");   // smart apostrophes → '

        const colourKey = BADGE_MAP[normalised];
        if (colourKey) {
            return <Badge label={raw.trim()} colourKey={colourKey} isDark={isDark} />;
        }

        // Styled bold (not a badge)
        return (
            <strong style={{
                fontWeight: '700',
                color: isDark ? '#e2e8f0' : '#0f172a',
                padding: '0 1px',
            }}>
                {children}
            </strong>
        );
    };
}

// ─────────────────────────────────────────────────────────────────
//  Heading renderer — tiered visual hierarchy
//
//  H1 emoji  → large gradient BANNER CARD  (main sections)
//  H1 plain  → strong gradient bar + large text
//  H2 emoji  → medium accent card
//  H2 plain  → medium bar
//  H3/H4     → thin bar, smaller text (sub-sections)
// ─────────────────────────────────────────────────────────────────

// Per-level gradient presets
const H_GRADIENTS = [
    'linear-gradient(135deg,#6366f1,#8b5cf6)',  // h1 indigo→purple
    'linear-gradient(135deg,#0ea5e9,#6366f1)',  // h2 sky→indigo
    'linear-gradient(135deg,#10b981,#0ea5e9)',  // h3 emerald→sky
    'linear-gradient(135deg,#f59e0b,#10b981)',  // h4 amber→emerald
];

// Background tints for emoji banner cards (light / dark)
const H_BG_LIGHT = [
    'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))',
    'linear-gradient(135deg,rgba(14,165,233,0.07),rgba(99,102,241,0.05))',
    'linear-gradient(135deg,rgba(16,185,129,0.07),rgba(14,165,233,0.04))',
    'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(16,185,129,0.04))',
];
const H_BG_DARK = [
    'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))',
    'linear-gradient(135deg,rgba(14,165,233,0.15),rgba(99,102,241,0.10))',
    'linear-gradient(135deg,rgba(16,185,129,0.14),rgba(14,165,233,0.09))',
    'linear-gradient(135deg,rgba(245,158,11,0.14),rgba(16,185,129,0.09))',
];
const H_BORDER_LIGHT = [
    'rgba(99,102,241,0.18)',
    'rgba(14,165,233,0.15)',
    'rgba(16,185,129,0.15)',
    'rgba(245,158,11,0.15)',
];
const H_BORDER_DARK = [
    'rgba(99,102,241,0.30)',
    'rgba(14,165,233,0.28)',
    'rgba(16,185,129,0.26)',
    'rgba(245,158,11,0.26)',
];

function makeHeadingRenderer(level, isDark) {
    return function HeadingRenderer({ children }) {
        const text = React.Children.toArray(children)
            .map(c => (typeof c === 'string' ? c : c?.props?.children ?? ''))
            .join('');

        const isEmoji = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(text.trim());
        const idx = Math.min(level - 1, H_GRADIENTS.length - 1);
        const gradient = H_GRADIENTS[idx];

        // ── Font sizes & bar widths by level ─────────────────────
        const fontSizes = ['1.25rem', '1.08rem', '0.97rem', '0.90rem'];
        const barWidths = [4, 3, 3, 2];
        const fontSize = fontSizes[Math.min(level - 1, fontSizes.length - 1)];
        const barWidth = barWidths[Math.min(level - 1, barWidths.length - 1)];

        // ── EMOJI headings → gradient banner card ─────────────────
        if (isEmoji) {
            const isMain = level <= 2;           // h1/h2 = main sections
            const bgGradient = isDark ? H_BG_DARK[idx] : H_BG_LIGHT[idx];
            const border = isDark ? H_BORDER_DARK[idx] : H_BORDER_LIGHT[idx];

            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: isMain ? '2rem' : '1.4rem',
                    marginBottom: isMain ? '0.85rem' : '0.55rem',
                    padding: isMain ? '10px 16px' : '7px 13px',
                    borderRadius: isMain ? '12px' : '9px',
                    background: bgGradient,
                    border: `1px solid ${border}`,
                    // Left accent stripe via box-shadow
                    boxShadow: `inset 3px 0 0 0 ${isDark ? H_BORDER_DARK[idx] : gradient}`,
                    fontWeight: '700',
                    fontSize: isMain ? (level === 1 ? '1.2rem' : '1.05rem') : fontSize,
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    lineHeight: '1.4',
                }}>
                    {children}
                </div>
            );
        }

        // ── PLAIN headings → gradient left bar ───────────────────
        const isMain = level <= 2;
        return (
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: isMain ? '12px' : '9px',
                marginTop: isMain ? '1.8rem' : '1.2rem',
                marginBottom: isMain ? '0.7rem' : '0.45rem',
            }}>
                {/* Gradient accent bar */}
                <div style={{
                    width: `${barWidth}px`,
                    minWidth: `${barWidth}px`,
                    borderRadius: '9999px',
                    background: gradient,
                    alignSelf: 'stretch',
                    minHeight: '1.2em',
                }} />
                <div style={{
                    fontWeight: isMain ? '800' : '700',
                    fontSize,
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    lineHeight: '1.35',
                    flexGrow: 1,
                }}>
                    {children}
                </div>
            </div>
        );
    };
}

// ─────────────────────────────────────────────────────────────────
//  Build full components map
// ─────────────────────────────────────────────────────────────────
function buildComponents(styles, isDark) {

    const textColour = isDark ? '#cbd5e1' : '#334155';
    const mutedColour = isDark ? '#94a3b8' : '#64748b';

    return {
        strong: makeStrongRenderer(isDark),
        h1: makeHeadingRenderer(1, isDark),
        h2: makeHeadingRenderer(2, isDark),
        h3: makeHeadingRenderer(3, isDark),
        h4: makeHeadingRenderer(4, isDark),
        h5: makeHeadingRenderer(4, isDark),
        h6: makeHeadingRenderer(4, isDark),

        // Paragraph
        // Special case: if the first child is a WORD badge (blue),
        // render the sibling Kanji text in large, dominant typography.
        // All other paragraphs render normally. Dark mode untouched.
        p({ children }) {
            const arr = React.Children.toArray(children);
            const first = arr[0];

            // Detect WORD badge: Badge component + blue colour key
            const isWordBadge =
                first &&
                React.isValidElement(first) &&
                first.type === Badge &&
                first.props.colourKey === 'blue';

            if (isWordBadge) {
                // Siblings = everything after the badge (the actual Kanji text)
                const siblings = arr.slice(1);
                return (
                    <p style={{
                        margin: '0.5rem 0',
                        display: 'flex',
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                        gap: '10px',
                        lineHeight: '1.3',
                    }}>
                        {/* WORD badge — unchanged, stays small */}
                        {first}

                        {/* Kanji — visually dominant, dictionary-style */}
                        <span style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            letterSpacing: '0.06em',
                            color: isDark ? '#f1f5f9' : '#0f172a',
                            lineHeight: '1.2',
                        }}>
                            {siblings}
                        </span>
                    </p>
                );
            }

            // Default paragraph — unchanged
            return (
                <p style={{
                    margin: '0.6rem 0',
                    lineHeight: '1.85',
                    fontSize: '0.94rem',
                    color: textColour,
                }}>
                    {children}
                </p>
            );
        },

        // Unordered list — custom bullet
        ul({ children }) {
            return (
                <ul style={{
                    listStyle: 'none',
                    padding: '0',
                    margin: '0.75rem 0',
                }}>
                    {children}
                </ul>
            );
        },

        // Ordered list
        ol({ children }) {
            return (
                <ol style={{
                    listStyleType: 'decimal',
                    paddingLeft: '1.4rem',
                    margin: '0.75rem 0',
                }}>
                    {children}
                </ol>
            );
        },

        // List item — gradient dot bullet for <ul>
        // Special case: if the first meaningful child is a WORD badge (blue),
        // render the Kanji sibling text in large dominant typography.
        li({ children, ordered }) {
            if (ordered) {
                return (
                    <li style={{
                        fontSize: '0.93rem',
                        lineHeight: '1.8',
                        color: textColour,
                        marginBottom: '0.3rem',
                    }}>
                        {children}
                    </li>
                );
            }

            // Flatten children to detect WORD badge
            const arr = React.Children.toArray(children);

            // ReactMarkdown wraps li text in a <p> — unwrap if single p child
            let innerArr = arr;
            if (
                arr.length === 1 &&
                React.isValidElement(arr[0]) &&
                arr[0].type === 'p'
            ) {
                innerArr = React.Children.toArray(arr[0].props.children);
            }

            const first = innerArr[0];
            const isWordBadge =
                first &&
                React.isValidElement(first) &&
                first.type === Badge &&
                first.props.colourKey === 'blue';

            if (isWordBadge) {
                const siblings = innerArr.slice(1);
                return (
                    <li style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                        gap: '10px',
                        marginBottom: '0.4rem',
                        paddingLeft: '2px',
                        listStyle: 'none',
                    }}>
                        {/* Gradient dot */}
                        <span style={{
                            width: '6px',
                            minWidth: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            flexShrink: 0,
                            boxShadow: '0 0 6px rgba(139,92,246,0.55)',
                            alignSelf: 'center',
                            marginBottom: '2px',
                        }} />

                        {/* WORD badge — unchanged, stays small */}
                        {first}

                        {/* Kanji — visually dominant, dictionary-style */}
                        <span style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            letterSpacing: '0.06em',
                            color: isDark ? '#f1f5f9' : '#0f172a',
                            lineHeight: '1.2',
                        }}>
                            {siblings}
                        </span>
                    </li>
                );
            }

            // Default list item
            return (
                <li style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '9px',
                    fontSize: '0.93rem',
                    lineHeight: '1.8',
                    color: textColour,
                    marginBottom: '0.35rem',
                    paddingLeft: '2px',
                }}>
                    {/* Gradient glow bullet */}
                    <span style={{
                        marginTop: '0.55em',
                        width: '6px',
                        minWidth: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        flexShrink: 0,
                        boxShadow: '0 0 6px rgba(139,92,246,0.55)',
                    }} />
                    <span style={{ flex: 1 }}>{children}</span>
                </li>

            );
        },

        // Horizontal rule — gradient line
        hr() {
            return (
                <div style={{
                    height: '1px',
                    background: isDark
                        ? 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)'
                        : 'linear-gradient(90deg,transparent,rgba(0,0,0,0.12),transparent)',
                    margin: '1.2rem 0',
                }} />
            );
        },

        // Blockquote — left gradient border + tinted bg
        blockquote({ children }) {
            return (
                <div style={{
                    borderLeft: '3px solid',
                    borderImage: 'linear-gradient(180deg,#6366f1,#8b5cf6) 1',
                    paddingLeft: '12px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    margin: '0.75rem 0',
                    borderRadius: '0 6px 6px 0',
                    background: isDark
                        ? 'rgba(99,102,241,0.07)'
                        : 'rgba(99,102,241,0.05)',
                    color: mutedColour,
                    fontStyle: 'italic',
                    fontSize: '0.93rem',
                    lineHeight: '1.75',
                }}>
                    {children}
                </div>
            );
        },

        // Inline code
        code({ inline, children }) {
            if (inline) {
                return (
                    <code style={{
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        color: isDark ? '#c4b5fd' : '#7c3aed',
                        padding: '1px 6px',
                        borderRadius: '5px',
                        fontSize: '0.865em',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                    }}>
                        {children}
                    </code>
                );
            }
            return (
                <pre style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    overflowX: 'auto',
                    margin: '0.75rem 0',
                    fontSize: '0.875rem',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    lineHeight: '1.6',
                }}>
                    <code>{children}</code>
                </pre>
            );
        },

        // Emphasis / italic
        em({ children }) {
            return (
                <em style={{
                    fontStyle: 'italic',
                    color: isDark ? '#a5b4fc' : '#4f46e5',
                }}>
                    {children}
                </em>
            );
        },

        // Links — render as styled span (keeps offline)
        a({ children, href }) {
            return (
                <span style={{
                    color: isDark ? '#93c5fd' : '#2563eb',
                    fontWeight: '500',
                    borderBottom: isDark ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(37,99,235,0.35)',
                    paddingBottom: '1px',
                }}>
                    {children}
                </span>
            );
        },
    };
}

// ─────────────────────────────────────────────────────────────────
//  Pre-process raw text before passing to ReactMarkdown
//
//  Fixes:
//  1. Strip standalone square brackets [content] → content
//     (Only when NOT followed by '(' so markdown links are preserved)
//  2. Collapse 3+ blank lines → max 2 (avoid huge gaps)
// ─────────────────────────────────────────────────────────────────
function preprocessText(raw) {
    return raw
        // Remove standalone [ ... ] wrappers — keep inner content
        // Regex: '[' not preceded by '!' (images), content, ']' not followed by '('
        .replace(/(?<!!)\[([^\]]+)\](?!\()/g, '$1')
        // Collapse excessive blank lines (3+) → double newline
        .replace(/\n{3,}/g, '\n\n');
}

// ─────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────
const SmartBreakdownFormatter = React.memo(({ text, isDark = false }) => {
    const styles = getStyles(isDark);
    const components = React.useMemo(
        () => buildComponents(styles, isDark),
        [isDark]
    );

    if (!text || text.trim().length === 0) {
        return (
            <div style={styles.container}>
                <p style={{ fontSize: '0.93rem', color: isDark ? '#64748b' : '#94a3b8', fontStyle: 'italic' }}>
                    No breakdown available.
                </p>
            </div>
        );
    }

    const processed = preprocessText(text);

    return (
        <div style={{
            ...styles.container,
            padding: '4px 0 12px',
        }}>
            <ReactMarkdown components={components}>
                {processed}
            </ReactMarkdown>
        </div>
    );
});

SmartBreakdownFormatter.displayName = 'SmartBreakdownFormatter';
export default SmartBreakdownFormatter;
