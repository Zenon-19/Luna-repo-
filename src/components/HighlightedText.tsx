import React from 'react';

interface HighlightedTextProps {
  text: string;
  highlight?: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Visually bolds and colors characters matching active search query
 * within project cards, table rows, and roadmap items.
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  highlight = '',
  className = '',
  highlightClassName = 'bg-amber-200/80 text-black font-bold px-0.5 rounded-xs border-b border-amber-400/80 selection:bg-amber-300',
}) => {
  if (!text) return null;
  const trimmed = highlight ? highlight.trim() : '';

  if (!trimmed) {
    return <span className={className}>{text}</span>;
  }

  // Split multiple search tokens (e.g. "enterprise ai" -> ["enterprise", "ai"])
  const terms = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = terms.some(
          (term) => part.toLowerCase() === term.toLowerCase()
        );

        if (isMatch) {
          return (
            <mark
              key={index}
              className={highlightClassName}
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};
