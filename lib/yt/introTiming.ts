/**
 * One clock for the hand-off from the loader to the hero, so CSS (the loader's circle) and JS (button and text entrances) cannot
 * drift apart. The loader reads these as CSS variables; YtSceneLayer schedules the entrances from them. All values in ms after
 * the loader is marked done.
 */
export const LOADER_OPEN_DELAY = 600;
export const LOADER_OPEN_MS = 1050;
/** The circle is fully open; the loader turns invisible and can unmount a little later. */
export const LOADER_HIDDEN_AT = LOADER_OPEN_DELAY + LOADER_OPEN_MS;
export const LOADER_UNMOUNT_AT = LOADER_HIDDEN_AT + 300;

/**
 * The circle opens on cubic-bezier(0.7, 0, 0.25, 1) up to 150vmax. It uncovers the button (about a sixth of the radius, desktop and
 * phone alike) some 370 ms into the opening and the far corner of the text column (about a third) some 450 ms in. The button starts
 * a little before it shows, so the first thing seen is it rising; the text intro's own base delay (250 ms, globals.css) lands its
 * first line as the circle reaches it.
 */
export const BUTTON_IN_AT = LOADER_OPEN_DELAY + 250;
export const TEXT_IN_AT = LOADER_OPEN_DELAY + 450 - 250;
