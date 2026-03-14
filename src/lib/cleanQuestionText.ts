/**
 * Cleans and normalizes question text imported from PDFs.
 * Merges broken lines, removes excess whitespace, and keeps
 * numbers inline with their units.
 * Converts block-math $$...$$ containing simple values to inline.
 */
export function cleanQuestionText(text: string): string {
  if (!text) return text;

  // Step 1: Convert $$ blocks containing only simple numbers/units to inline $ or plain text
  // This prevents numbers like $$200$$ from rendering as block-level (separate lines)
  let cleaned = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
    const trimmed = inner.trim();
    // If the content is a simple number, number with unit, or simple expression
    // (no complex LaTeX commands like \frac, \int, \sum, \sqrt, \begin, etc.)
    const isComplex = /\\(?:frac|int|sum|sqrt|begin|end|matrix|align|left|right|displaystyle|lim|prod|bigcup|bigcap)/.test(trimmed);
    const isMultiLine = trimmed.includes('\n');
    
    if (!isComplex && !isMultiLine) {
      // Simple expression - use inline math instead of block math
      return `$${trimmed}$`;
    }
    return match;
  });

  // Step 2: Preserve remaining LaTeX blocks by temporarily replacing them
  const latexBlocks: string[] = [];
  cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
    latexBlocks.push(match);
    return `__LATEX_BLOCK_${latexBlocks.length - 1}__`;
  });

  const inlineLatex: string[] = [];
  cleaned = cleaned.replace(/(?<!\$)\$(?!\$)(.*?)\$(?!\$)/g, (match) => {
    inlineLatex.push(match);
    return `__LATEX_INLINE_${inlineLatex.length - 1}__`;
  });

  // Replace all newlines and multiple spaces with a single space
  cleaned = cleaned.replace(/\r?\n/g, " ");
  cleaned = cleaned.replace(/\s{2,}/g, " ");
  cleaned = cleaned.trim();

  // Restore LaTeX
  cleaned = cleaned.replace(/__LATEX_BLOCK_(\d+)__/g, (_, i) => latexBlocks[Number(i)]);
  cleaned = cleaned.replace(/__LATEX_INLINE_(\d+)__/g, (_, i) => inlineLatex[Number(i)]);

  return cleaned;
}
