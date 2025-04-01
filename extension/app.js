/**
 * Ultimate Incognito Tab Opener (Friendly Edition)
 * ------------------------------------------------
 * Hey friend! This little script is here to help you open links in incognito mode only,
 * without Chrome opening an extra, unwanted tab. It listens for when you press Shift+Alt
 * while clicking a link, and then it works its magic to only open one incognito tab—no duplicates!
 * 
 * We know browser shortcuts can be stubborn, so this script uses every trick we know to stop the
 * default behavior and give you a smooth incognito experience.
 */

/**
 * This function walks up the DOM tree to find the closest <a> tag that has a link (href).
 * It’s like playing detective to find the real link you meant to click.
 *
 * @param {Node} node - The starting point (where you clicked).
 * @returns {HTMLAnchorElement | undefined} - The found link, or undefined if nothing’s found.
 */
const getLink = (node) => {
	while (node && node !== document) {
		if (node.tagName === 'A' && node.href) return node;
		node = node.parentNode;
	}
	return undefined;
};

// A little flag to make sure we don't open more than one incognito tab by accident.
let incognitoTabOpened = false;
// How long we wait (in milliseconds) before we let you open another tab.
const DEBOUNCE_TIMEOUT = 300;

/**
 * This function is our superhero. It stops Chrome's usual behavior when you press Shift+Alt,
 * and it makes sure only one incognito tab opens for each click.
 *
 * @param {Event} event - The event that happens when you click.
 */
const handleUltimateEvent = (event) => {
	// If you’re holding Shift, we step in immediately.
	if (event.shiftKey) {
		// We stop everything right here to prevent any normal tab opening.
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		event.cancelBubble = true;
	}

	// Now, if you're holding both Shift and Alt, let's get to work.
	if (event.shiftKey && event.altKey) {
		// If we already opened a tab, we don't want to do it again.
		if (incognitoTabOpened) return;
		incognitoTabOpened = true;

		const link = getLink(event.target);
		if (link) {
			// We use a microtask (Promise) to schedule our incognito-opening action just after the native stuff.
			Promise.resolve().then(() => {
				chrome.runtime.sendMessage({
					action: 'CREATE_INCOGNITO_WINDOW',
					url: link.href
				});
			});
		}

		// After a short wait, we reset our flag so you can open more tabs later.
		setTimeout(() => {
			incognitoTabOpened = false;
		}, DEBOUNCE_TIMEOUT);
	}
};

// These are the events we’re watching—every little click or key press that might trigger a tab.
const eventsToIntercept = [
	'pointerdown',
	'mousedown',
	'mouseup',
	'click',
	'beforeinput',
	'keydown', // Just in case keyboard events join the party.
	'keyup'
];

// We attach our superhero function to each event at the very highest level.
// This means we're trying really hard to catch every possible trigger before the browser does.
eventsToIntercept.forEach((evName) => {
	document.addEventListener(evName, handleUltimateEvent, {
		capture: true,
		passive: false
	});
});

// Just in case the page changes or new content pops in, we watch the whole document.
// If things change, we reapply our event listeners to keep our magic alive.
new MutationObserver(() => {
	eventsToIntercept.forEach((evName) => {
		document.documentElement.removeEventListener(evName, handleUltimateEvent, {
			capture: true
		});
		document.documentElement.addEventListener(evName, handleUltimateEvent, {
			capture: true,
			passive: false
		});
	});
}).observe(document.documentElement, {
	childList: true,
	subtree: true
});
