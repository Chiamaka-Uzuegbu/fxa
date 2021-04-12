/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { registerSuite } = intern.getInterface('object');
const FunctionalHelpers = require('./lib/helpers');
const selectors = require('./lib/selectors');
const uaStrings = require('./lib/ua-strings');

const {
  click,
  clearBrowserState,
  createEmail,
  createUser,
  fillOutChangePassword,
  fillOutDeleteAccount,
  fillOutEmailFirstSignIn,
  fillOutSignInTokenCode,
  noSuchBrowserNotification,
  noSuchElement,
  openPage,
  respondToWebChannelMessage,
  testElementExists,
  testIsBrowserNotified,
  visibleByQSA,
} = FunctionalHelpers;

const config = intern._config;
const ENTER_EMAIL_URL = `${config.fxaContentRoot}?context=fx_fennec_v1&service=sync`;
const SETTINGS_URL =
  config.fxaContentRoot + 'settings?context=fx_fennec_v1&service=sync';
const SETTINGS_NOCONTEXT_URL = config.fxaContentRoot + 'settings';

const FIRST_PASSWORD = 'password';
const SECOND_PASSWORD = 'new_password';
let email;

registerSuite('Fx Fennec Sync v1 settings', {
  beforeEach: function () {
    email = createEmail('sync{id}');

    return (
      this.remote
        .then(createUser(email, FIRST_PASSWORD, { preVerified: true }))
        .then(clearBrowserState())
        .then(
          openPage(ENTER_EMAIL_URL, selectors.ENTER_EMAIL.HEADER, {
            query: {
              forceUA: uaStrings['android_firefox'],
            },
          })
        )
        .then(
          respondToWebChannelMessage('fxaccounts:can_link_account', {
            ok: true,
          })
        )
        .then(fillOutEmailFirstSignIn(email, FIRST_PASSWORD))

        // User must confirm their Sync signin
        .then(testElementExists(selectors.SIGNIN_TOKEN_CODE.HEADER))
        .then(testIsBrowserNotified('fxaccounts:can_link_account'))

        .then(fillOutSignInTokenCode(email, 0))
        .then(testElementExists(selectors.CONNECT_ANOTHER_DEVICE.HEADER))
        .then(testIsBrowserNotified('fxaccounts:login'))

        // wait until account data is in localstorage before redirecting
        .then(
          FunctionalHelpers.pollUntil(
            function () {
              const accounts = Object.keys(
                JSON.parse(localStorage.getItem('__fxa_storage.accounts')) || {}
              );
              return accounts.length === 1 ? true : null;
            },
            [],
            10000
          )
        )

        .then(openPage(SETTINGS_URL, selectors.SETTINGS.HEADER))
    );
  },

  tests: {
    'sign in, change the password': function () {
      return this.remote
        .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))
        .then(visibleByQSA(selectors.CHANGE_PASSWORD.DETAILS))

        .then(fillOutChangePassword(FIRST_PASSWORD, SECOND_PASSWORD));
    },

    'sign in, change the password by browsing directly to settings': function () {
      return this.remote
        .then(openPage(SETTINGS_NOCONTEXT_URL, selectors.SETTINGS.HEADER))
        .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))
        .then(visibleByQSA(selectors.CHANGE_PASSWORD.DETAILS))
        .then(noSuchBrowserNotification('fxaccounts:change_password'))

        .then(fillOutChangePassword(FIRST_PASSWORD, SECOND_PASSWORD));
    },

    'sign in, delete the account': function () {
      return this.remote
        .then(click(selectors.SETTINGS_DELETE_ACCOUNT.DELETE_ACCOUNT_BUTTON))
        .then(visibleByQSA(selectors.SETTINGS_DELETE_ACCOUNT.DETAILS))

        .then(fillOutDeleteAccount(FIRST_PASSWORD))

        .then(testElementExists(selectors.SIGNIN_PASSWORD.HEADER));
    },

    'sign in, no way to sign out': function () {
      return (
        this.remote
          // make sure the sign out element doesn't exist
          .then(noSuchElement(selectors.SETTINGS.SIGNOUT))
      );
    },
  },
});
