/**
 * Wraps every word in a clipping mask so the reveal can slide words up from below their own baseline. Server-rendered and readable
 * as plain text; without the 3D bundle nothing animates and the words simply stay in place.
 */
export function SplitWords({ text }: { text: string }) {
  return text.split(" ").map((word, i) => (
    <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <span data-word className="inline-block will-change-transform">
        {word}
      </span>
      {" "}
    </span>
  ));
}
