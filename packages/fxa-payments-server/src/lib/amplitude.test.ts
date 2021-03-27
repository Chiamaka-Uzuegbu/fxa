import FlowEvent from '../lib/flow-event';
jest.mock('../lib/flow-event');

jest.mock('./sentry');

import * as Amplitude from './amplitude';
import { Store } from '../store';

beforeEach(() => {
  (<jest.Mock>FlowEvent.logAmplitudeEvent).mockClear();
});

it('should call logAmplitudeEvent with the correct event group and type names', () => {
  const testCases: Array<[keyof typeof Amplitude, ...string[][]]> = [
    ['manageSubscriptionsMounted', ['subManage', 'view']],
    ['manageSubscriptionsEngaged', ['subManage', 'engage']],
    ['createSubscriptionMounted', ['subPaySetup', 'view']],
    ['createSubscriptionEngaged', ['subPaySetup', 'engage']],
    ['createSubscription_PENDING', ['subPaySetup', 'submit']],
    [
      'createSubscription_FULFILLED',
      ['subPaySetup', 'success'],
      ['subPaySetup', 'complete'],
    ],
    ['createSubscription_REJECTED', ['subPaySetup', 'fail']],
    ['updateSubscriptionPlanMounted', ['subPayUpgrade', 'view']],
    ['updateSubscriptionPlanEngaged', ['subPayUpgrade', 'engage']],
    ['updateSubscriptionPlan_PENDING', ['subPayUpgrade', 'submit']],
    ['updateSubscriptionPlan_FULFILLED', ['subPayUpgrade', 'success']],
    ['updateSubscriptionPlan_REJECTED', ['subPayUpgrade', 'fail']],
    ['updatePaymentMounted', ['subPayManage', 'view']],
    ['updatePaymentEngaged', ['subPayManage', 'engage']],
    ['updatePayment_PENDING', ['subPayManage', 'submit']],
    ['updatePayment_FULFILLED', ['subPayManage', 'success']],
    ['updatePayment_REJECTED', ['subPayManage', 'fail']],
    ['cancelSubscriptionMounted', ['subCancel', 'view']],
    ['cancelSubscriptionEngaged', ['subCancel', 'engage']],
    ['cancelSubscription_PENDING', ['subCancel', 'submit']],
    [
      'cancelSubscription_FULFILLED',
      ['subCancel', 'success'],
      ['subCancel', 'complete'],
    ],
    ['cancelSubscription_REJECTED', ['subCancel', 'fail']],
  ];

  for (const [actionType, ...expectedArgs] of testCases) {
    Amplitude[actionType]({});

    for (const args of expectedArgs) {
      expect(FlowEvent.logAmplitudeEvent).toBeCalledWith(...args, {});
    }

    (<jest.Mock>FlowEvent.logAmplitudeEvent).mockClear();
  }
});

it('should capture error during logAmplitudeEvent', () => {
  (<jest.Mock>FlowEvent.logAmplitudeEvent).mockImplementationOnce(() => {
    throw 'oopsie';
  });
  expect(() => {
    Amplitude.createSubscription_PENDING({
      plan_id: '123xyz_hourly',
      product_id: '123xyz',
    });
  }).not.toThrow();
});

it('should call logAmplitudeEvent with subscription plan info', () => {
  const metricsData: Amplitude.EventProperties = {
    plan_id: '123xyz_hourly',
    product_id: '123xyz',
    paymentProvider: 'stripe',
  };
  Amplitude.createSubscription_PENDING(metricsData);
  const eventProps = (<jest.Mock>(
    FlowEvent.logAmplitudeEvent
  )).mock.calls[0].pop();

  expect(eventProps).toMatchObject({
    planId: metricsData.plan_id,
    productId: metricsData.product_id,
    paymentProvider: metricsData.paymentProvider,
  });
});

it('should call logAmplitudeEvent with reason for failure on fail event', () => {
  const metricsData: Amplitude.EventProperties = {
    plan_id: '123xyz_hourly',
    product_id: '123xyz',
  };
  const payload = { message: 'oopsie daisies' };
  Amplitude.createSubscription_REJECTED({
    ...metricsData,
    error: payload,
  });
  const eventProps = (<jest.Mock>(
    FlowEvent.logAmplitudeEvent
  )).mock.calls[0].pop();

  expect(eventProps).toMatchObject({
    planId: metricsData.plan_id,
    productId: metricsData.product_id,
    reason: payload.message,
  });
});

describe('subscribes to the redux store for the uid', () => {
  const uid = 'abc123xyz';
  const plan = { plan_id: '123xyz_hourly', product_id: '123xyz' };
  const payload = { message: 'oopsie daisies' };
  const unsubscribe = jest.fn();
  let callbackFromAmplitudeLib: Function;
  let storeMock = {
    subscribe: (cb: Function) => {
      callbackFromAmplitudeLib = cb;
      return unsubscribe;
    },
    getState: jest
      .fn()
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ profile: { result: { uid } } }),
  };

  it('should set the uid on the event properties then unsubscribe', () => {
    Amplitude.subscribeToReduxStore((storeMock as unknown) as Store);
    callbackFromAmplitudeLib();
    expect(unsubscribe).not.toHaveBeenCalled();
    callbackFromAmplitudeLib();
    expect(unsubscribe).toHaveBeenCalled();

    Amplitude.createSubscription_REJECTED({
      ...plan,
      error: payload,
    });

    const eventProps = (<jest.Mock>(
      FlowEvent.logAmplitudeEvent
    )).mock.calls[0].pop();

    expect(eventProps).toMatchObject({
      planId: plan.plan_id,
      productId: plan.product_id,
      reason: payload.message,
      uid: uid, // this was added
    });
  });
});
