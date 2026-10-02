/** Content column of the YouTube page: the same width as `.yt-container` (96rem) inside the section padding (md:px-16). */
const CONTAINER_PX = 1536;
const SIDE_PADDING_PX = 64;
const DESKTOP_MIN_PX = 768;
/**
 * On desktop the button is never taller than this share of the column width, so on a narrow laptop it shrinks instead of crowding
 * the text. Mirrored in CSS as `--btn-h` (youtube.css), which places the hero chips around the button.
 */
export const BUTTON_MAX_OF_COLUMN = 0.24;

/** Width of the content column in px. */
export function columnWidth(viewportWidth: number): number {
  if (viewportWidth < DESKTOP_MIN_PX) return viewportWidth;
  return Math.min(viewportWidth - SIDE_PADDING_PX * 2, CONTAINER_PX);
}

/**
 * Width of the content column as a share of the viewport. Frame x positions are fractions of this column, not of the window, so on a
 * wide monitor the button stays next to its text instead of drifting to the screen edge.
 */
export function columnShare(viewportWidth: number): number {
  return columnWidth(viewportWidth) / viewportWidth;
}

/** Largest button height in px for this viewport (no limit on phones, where frames are already sized for the narrow screen). */
export function buttonMaxHeight(viewportWidth: number): number {
  return viewportWidth < DESKTOP_MIN_PX ? Infinity : columnWidth(viewportWidth) * BUTTON_MAX_OF_COLUMN;
}
