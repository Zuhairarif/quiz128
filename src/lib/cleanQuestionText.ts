/**
 * Cleans and normalizes question text imported from PDFs.
 * Merges broken lines, removes excess whitespace, and keeps
 * numbers inline with their units.
 */
export function cleanQuestionText(text: string): string {
  if (!text) return text;

  // Preserve LaTeX blocks by temporarily replacing them
  const latexBlocks: string[] = [];
  let cleaned = text.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
    latexBlocks.push(match);
    return `__LATEX_BLOCK_${latexBlocks.length - 1}__`;
  });

  const inlineLatex: string[] = [];
  cleaned = cleaned.replace(/(?<!\$)\$(?!\$).*?\$(?!\$)/g, (match) => {
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
