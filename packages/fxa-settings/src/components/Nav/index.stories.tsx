/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { storiesOf } from '@storybook/react';
import { MockedCache } from '../../models/_mocks';
import { getDefault } from '../../lib/config';
import { Nav } from '.';
import { ConfigContext } from 'fxa-settings/src/lib/config';

storiesOf('Components|Nav', module)
  .add('basic', () => (
    <MockedCache>
      <Nav />
    </MockedCache>
  ))
  .add('with link to Subscriptions', () => (
    <MockedCache
      account={{ subscriptions: [{ created: 1, productName: 'x' }] }}
    >
      <Nav />
    </MockedCache>
  ))
  .add('without link to Newsletters', () => {
    const config = Object.assign({}, getDefault(), {
      marketingEmailPreferencesUrl: '',
    });

    return (
      <MockedCache>
        <ConfigContext.Provider value={ config }>
          <Nav />
        </ConfigContext.Provider>
      </MockedCache>
    );
  });
