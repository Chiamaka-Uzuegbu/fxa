/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedCache } from '../../models/_mocks';
import { getDefault } from '../../lib/config';
import Nav from '.';
import { ConfigContext } from 'fxa-settings/src/lib/config';

describe('Nav', () => {
  it('renders as expected', () => {
    render(
      <MockedCache>
        <ConfigContext.Provider value={getDefault()}>
          <Nav />
        </ConfigContext.Provider>
      </MockedCache>
    );

    expect(screen.getByTestId('nav-link-profile')).toHaveTextContent('Profile');
    expect(screen.getByTestId('nav-link-profile')).toHaveAttribute(
      'href',
      '#profile'
    );

    expect(screen.getByTestId('nav-link-security')).toHaveTextContent(
      'Security'
    );
    expect(screen.getByTestId('nav-link-security')).toHaveAttribute(
      'href',
      '#security'
    );

    expect(screen.getByTestId('nav-link-connected-services')).toHaveTextContent(
      'Connected Services'
    );
    expect(screen.getByTestId('nav-link-connected-services')).toHaveAttribute(
      'href',
      '#connected-services'
    );

    expect(screen.getByTestId('nav-link-newsletters')).toHaveTextContent(
      'Email Communications'
    );
    expect(screen.getByTestId('nav-link-newsletters')).toHaveAttribute(
      'href',
      `https://basket.mozilla.org/fxa/?email=${encodeURIComponent(
        'johndope@example.com'
      )}`
    );

    expect(screen.queryByTestId('nav-link-subscriptions')).toBeNull();
  });

  it('renders as expected with subscriptions link', () => {
    render(
      <MockedCache
        account={{ subscriptions: [{ created: 1, productName: 'x' }] }}
      >
        <Nav />
      </MockedCache>
    );

    expect(screen.getByTestId('nav-link-subscriptions')).toHaveTextContent(
      'Paid Subscriptions'
    );
    expect(screen.getByTestId('nav-link-subscriptions')).toHaveAttribute(
      'href',
      '/subscriptions'
    );
  });

  it('renders as expected without newsletters link', () => {
    const config = Object.assign({}, getDefault(), {
      marketingEmailPreferencesUrl: '',
    });

    render(
      <MockedCache>
        <ConfigContext.Provider value={ config }>
          <Nav />
        </ConfigContext.Provider>
      </MockedCache>
    );

    expect(screen.queryByTestId('nav-link-newsletters')).toBeNull();
  });
});
