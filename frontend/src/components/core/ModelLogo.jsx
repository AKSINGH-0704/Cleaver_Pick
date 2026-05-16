// Inline SVG logos for 8 models. Monochrome — fill driven by brand color.
// Simplified glyphs designed to read cleanly at 16–48px.

const LOGOS = {
  gpt: (
    <path d="M12 2.2a9.8 9.8 0 0 1 8.49 14.7A9.8 9.8 0 0 1 3.51 7.1 9.78 9.78 0 0 1 12 2.2Zm0 2.2a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2Zm-.1 3.1 3.9 2.25v4.5l-3.9 2.25-3.9-2.25v-4.5L11.9 7.5Z" />
  ),
  gemini: (
    <path d="M12 2 13.6 8.6 20.2 10.3 13.6 12 12 18.6 10.4 12 3.8 10.3 10.4 8.6 12 2Z" />
  ),
  grok: (
    <path d="M4 3h3.3l5 6.7L17.2 3H20l-6.2 8L20.5 21H17l-5.3-7.1L6.4 21H3.5l6.7-8.7L4 3Z" />
  ),
  deepseek: (
    <path d="M3 12a9 9 0 1 1 9 9v-3a6 6 0 1 0-6-6H3Zm7.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
  ),
  perplexity: (
    <path d="M12 2 4 7v10l8 5 8-5V7l-8-5Zm0 2.4 5.8 3.6L12 11.6 6.2 8 12 4.4Zm-6 5.3 5 3.1v7l-5-3.1v-7Zm12 0v7l-5 3.1v-7l5-3.1Z" />
  ),
  claude: (
    <path d="M7.5 4h3L14 12l-2 6h-3l1.5-4H7l-1.5 4h-3L7.5 4Zm5 14 4-10h3l4 10h-3l-.8-2h-3.4l-.8 2h-3Zm4.6-4.2h2l-1-2.8-1 2.8Z" />
  ),
  mistral: (
    <path d="M3 4h4v4H3V4Zm0 6h4v4H3v-4Zm0 6h4v4H3v-4ZM9 4h4v4H9V4Zm6 0h4v4h-4V4ZM9 10h4v4H9v-4Zm0 6h4v4H9v-4Zm6 0h4v4h-4v-4Z" />
  ),
  llama: (
    <path d="M4 3h4v6l4-3 4 3V3h4v18h-4v-6l-4 3-4-3v6H4V3Z" />
  ),
};

export default function ModelLogo({ id, size = 20, color = 'currentColor', className = '' }) {
  const glyph = LOGOS[id];
  if (!glyph) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
        fill={color}
      >
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={color}
      aria-label={`${id} logo`}
    >
      {glyph}
    </svg>
  );
}
