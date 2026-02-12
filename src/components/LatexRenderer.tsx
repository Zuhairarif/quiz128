import { useMemo } from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

type Props = { text: string; className?: string };

export default function LatexRenderer({ text, className = "" }: Props) {
  const html = useMemo(() => {
    // Replace $$ ... $$ (block) and $ ... $ (inline) with rendered KaTeX
    let result = text;

    // Block math: $$ ... $$
    result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
      } catch {
        return `$$${tex}$$`;
      }
    });

    // Inline math: $ ... $ (but not $$ which we already handled)
    result = result.replace(/(?<!\$)\$(?!\$)(.*?)\$(?!\$)/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `$${tex}$`;
      }
    });

    return result;
  }, [text]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
