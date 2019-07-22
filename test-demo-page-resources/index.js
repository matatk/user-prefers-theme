'use strict'
var KEY = 'user-prefers-theme'
var userPreference  // so we can restore it after running the tests

function log() {
	var argsString = Array.prototype.slice.call(arguments).toString()
	console.log('Demo page: ' + argsString)
}

function demoPageCallback(mode) {
	var otherMode = mode === 'light' ? 'dark' : 'light'
	log('callback: using ' + mode + ' theme.')
	document.getElementById('preferred-theme').innerText = mode
	document.getElementById('toggle-theme').innerText = otherMode

	// When the page loads, some tests will be run, but they do not alter
	// the user's stored mode preference (if applicable). We'd like to
	// restore it after the tests, so keep a record of it.
	userPreference = localStorage.getItem(KEY)
}

document.getElementById('set-light').onclick = function() {
	log('preferring light theme...')
	window.userPrefersTheme('light')
}

document.getElementById('set-dark').onclick = function() {
	log('preferring dark theme...')
	window.userPrefersTheme('dark')
}

document.getElementById('set-moo').onclick = function() {
	log('preferring "moo" theme...')
	window.userPrefersTheme('moo')
}

document.getElementById('toggle').onclick = function() {
	var switchTo = document.getElementById('toggle-theme').innerText
	log('toggling theme...')
	window.userPrefersTheme(switchTo)
}

document.getElementById('neither').onclick = function() {
	log('preferring neither theme...')
	window.userPrefersThemeNeither()
}

function wrapTests(runner, doneId, button, name) {
	log('Running wrapped tests (which may change settings)...')
	log("user's preference for this origin: " + userPreference)
	window.userPrefersThemeListener(function() {})
	runner()
	if (doneId) document.getElementById(doneId).innerText = '(done)'
	log('restoring initial user preference')
	if (userPreference) {
		localStorage.setItem(KEY, userPreference)
	}
	window.userPrefersThemeListener(demoPageCallback)
	if (button) {
		button.onclick = function() {
			alert(name + " tests have already been run; check the console for output, or reload the page if you'd like to run them again.")
		}
	}
}

document.getElementById('auto-tests').onclick = function() {
	wrapTests(window.runFlashyTests,
		'auto-tests-done', this, 'Flashy automated')
}

document.getElementById('manual-tests').onclick = function() {
	wrapTests(window.runUserInvolvedTests,
		'manual-tests-done', this, 'User-involved')
}

window.userPrefersThemeListener(demoPageCallback)  // sets userPreference

// Some tests are run when the page loads, which happens before this script
// runs. Others can run when it starts, but need to change the storage values,
// so need to be wrapped.
wrapTests(window.runNonFlashyTests)
