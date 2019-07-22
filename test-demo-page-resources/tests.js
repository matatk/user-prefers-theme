'use strict';
(function(win, doc) {
	var STORAGE_KEY = 'user-prefers-theme'

	var testCounter = 0
	var failureCounter = 0
	var pageLoadTests = []
	var nonFlashyTests = []
	var flashyTests = []
	var userInvolvedTests = []

	var listenerCallCount
	var lastArgsForListener


	//
	// Utilities
	//

	function log() {
		var argsString = Array.prototype.slice.call(arguments).toString()
		win.console.log('Automated tests: ' + argsString)
	}

	function summary() {
		var message = 'Totals: '
			+ testCounter + ' tests; ' + failureCounter + ' failed'
		var call = failureCounter === 0 ? console.info : console.error
		call(message)
	}

	function run(suite, descriptor, before, after) {
		var i = 0
		log('running ' + descriptor + ' tests...')
		for (i = 0; i < suite.length; i++) {
			if (before) before()
			suite[i]()
		}
		log(descriptor + ' tests complete.')
		if (after) after()
		summary()
	}

	function logTest(description) {
		testCounter++
		win.console.log('Test ' + testCounter + ': ' + description)
		return description
	}

	function assert(test) {
		console.assert.apply(this, arguments)
		if (!test) failureCounter++
	}

	function askUserToSwitchTheme(description) {
		alert('Test ' + testCounter + ': ' + description
			+ '\n\nPlease switch your system theme setting and press OK.')
	}


	//
	// Detecting the current settings
	//

	function currentSystemTheme() {
		// This is purposely done slightly differently to the main script
		var queryLight = win.matchMedia('(prefers-color-scheme: light)')
		var queryDark = win.matchMedia('(prefers-color-scheme: dark)')
		if (queryLight.matches) {
			return 'light'
		} else if (queryDark.matches) {
			return 'dark'
		}
		return 'light'  // no-preference
	}

	function currentUserPreference() {
		return localStorage.getItem(STORAGE_KEY)
	}

	function currentActualTheme() {
		var userPreference = currentUserPreference()
		if (userPreference) return userPreference
		return currentSystemTheme()
	}


	//
	// Set-up/tear-down and mock
	//

	function beforeEach() {
		listenerCallCount = 0
		lastArgsForListener = null
	}

	function beforeEachWithStorage() {
		localStorage.removeItem(STORAGE_KEY)
		beforeEach()
	}

	function afterAllWithStorage() {
		localStorage.removeItem(STORAGE_KEY)
	}

	function fakeListener() {
		listenerCallCount++
		lastArgsForListener = arguments
	}


	//
	// Tests that must run at startup and/or have no side-effects
	//

	pageLoadTests.push(function() {
		var PREFIX = 'user-prefers-theme-'
		logTest('<body> gets the right class at start-up')
		assert(doc.body.classList.length === 1, 'one class is applied')
		assert(doc.body.classList.item(0) === PREFIX + currentActualTheme(),
			'the class matches the current theme')
	})

	pageLoadTests.push(function() {
		logTest('setting a non-function listener throws')
		try {
			win.userPrefersThemeListener(42)
		} catch (error) {
			assert(error.message === 'Callback given is not a function.')
		}
	})

	pageLoadTests.push(function() {
		logTest('setting an invalid theme throws')
		try {
			win.userPrefersTheme('woo')
		} catch (error) {
			assert(error.message === 'Invalid theme "woo"')
		}
	})

	pageLoadTests.push(function() {
		logTest('listener is called back upon registration')
		win.userPrefersThemeListener(fakeListener)
		assert(listenerCallCount === 1, 'listener called when registered')
		assert(lastArgsForListener.length === 1,
			'listener called with one argument in default (sys pref) set-up')
		assert(lastArgsForListener[0] === currentActualTheme(),
			'listener called with current theme in default (sys pref) set-up')
	})

	pageLoadTests.push(function() {
		logTest('previous callback is no longer called')
		win.userPrefersThemeListener(fakeListener)  // called once
		win.userPrefersThemeListener(function() {})  // called once
		assert(listenerCallCount === 1, 'first callback was only called once')
	})


	//
	// Non-flashy tests that use storage
	//

	nonFlashyTests.push(function() {
		var currentTheme = currentActualTheme()
		logTest('preferring the current theme saves setting')
		assert(localStorage.getItem(STORAGE_KEY) === null,
			'storage was cleared successfully')
		win.userPrefersTheme(currentTheme)
		assert(localStorage.getItem(STORAGE_KEY) === currentTheme,
			'current theme preference was stored')
	})

	nonFlashyTests.push(function() {
		var currentTheme = currentActualTheme()
		logTest("preferring the current theme doesn't call back")
		win.userPrefersThemeListener(fakeListener)
		// already tested that it'll get called once
		win.userPrefersTheme(currentTheme)
		assert(listenerCallCount === 1, 'listener not called again')
	})


	//
	// Flashy tests that change storage
	//

	flashyTests.push(function() {
		var currentTheme = currentActualTheme()
		var otherTheme = currentTheme === 'light' ? 'dark' : 'light'
		logTest('preferring the non-current theme calls back')
		win.userPrefersThemeListener(fakeListener)  // called once
		win.userPrefersTheme(otherTheme)
		assert(listenerCallCount === 2, 'listener was called again')
	})

	flashyTests.push(function() {
		logTest('correct class and background set in light mode')
		win.userPrefersTheme('light')
		assert(doc.body.style.backgroundColor === '')
		assert(doc.body.classList.length === 1, 'one class is applied')
		assert(doc.body.classList.item(0) === 'user-prefers-theme-light',
			'the class matches the current theme')
	})

	flashyTests.push(function() {
		logTest('correct class and background set in dark mode')
		win.userPrefersTheme('dark')
		assert(
			getComputedStyle(doc.body).backgroundColor === 'rgb(51, 51, 51)')
		assert(doc.body.classList.length === 1, 'one class is applied')
		assert(doc.body.classList.item(0) === 'user-prefers-theme-dark',
			'the class matches the current theme')
	})

	flashyTests.push(function() {
		logTest('preferring neither theme removes setting')
		win.userPrefersTheme('light')
		// already tested this will set the key
		win.userPrefersThemeNeither()
		assert(localStorage.getItem(STORAGE_KEY) === null,
			'storage key is removed when user prefers neither theme')
	})

	flashyTests.push(function() {
		logTest("preferring neither theme, when the current and preferred themes are the same, doesn't call back")
		win.userPrefersThemeListener(fakeListener)
		// already tested that it'll get called once
		win.userPrefersThemeNeither()
		assert(listenerCallCount === 1, 'listener not called again')
	})


	//
	// Tests that require user involvement
	//

	// Note: these don't work in Safari, nor Firefox on Windows (but does work
	//       in Firefox on macOS); seems like problems with Safari and Windows.

	userInvolvedTests.push(function() {
		var desc = logTest('responds to system theme setting changes')
		var startingClass = doc.body.classList.item(0)
		askUserToSwitchTheme(desc)
		assert(startingClass !== doc.body.classList.item(0),
			'classes on <body> are different after mode flip')
	})

	userInvolvedTests.push(function() {
		var desc = logTest("doesn't track system setting after user expresses a choice")
		var currentTheme = currentActualTheme()
		win.userPrefersThemeListener(fakeListener)  // called once
		win.userPrefersTheme(currentTheme)  // not called again
		askUserToSwitchTheme(desc)  // shouldn't be called again
		assert(listenerCallCount === 1,
			'listener not called when system setting changes')
	})

	userInvolvedTests.push(function() {
		var desc = logTest('resumes tracking the system setting if user rescinds their choice')
		var currentTheme = currentActualTheme()
		win.userPrefersThemeListener(fakeListener)  // called once
		win.userPrefersTheme(currentTheme)  // not called again
		win.userPrefersThemeNeither()  // not called again
		askUserToSwitchTheme(desc)  // should be called again
		assert(listenerCallCount === 2,
			'listener was called when system setting changed')
	})


	//
	// Public API
	//

	run(pageLoadTests, 'page-load', beforeEach)

	win.runNonFlashyTests = function() {
		run(nonFlashyTests, 'non-flashy storage-based',
			beforeEachWithStorage, afterAllWithStorage)
	}

	win.runFlashyTests = function() {
		run(flashyTests, 'flashy storage-based',
			beforeEachWithStorage, afterAllWithStorage)
	}

	win.runUserInvolvedTests = function() {
		run(userInvolvedTests, 'user-involved storage-based',
			beforeEachWithStorage, afterAllWithStorage)
	}
})(window, document)
