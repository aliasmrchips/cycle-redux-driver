import { Driver } from '@cycle/run';
import { applyMiddleware, createStore } from 'redux';
import { Middleware, Reducer, Store } from 'redux';
import MainActionSource from './MainActionSource';
import MainStateSource from './MainStateSource';
import { isolateActionSource, isolateActionSink } from './isolate';
import {
  ActionSink,
  ActionSource,
  ReduxSource,
  StateSource
} from './interfaces';

export default function makeReduxDriver (
  reducer: Reducer<any>,
  initialState: any,
  actionsForStore: string[],
  ...middlewares: Middleware[],
): Driver<ActionSink, ReduxSource> {
  return function reduxDriver(action$$: ActionSink): ReduxSource {
    const store: Store<any> = createStore(
      reducer,
      initialState,
      applyMiddleware(...(middlewares || [])),
    );

    const stateSource: StateSource = new MainStateSource(store);
    const actionSource: ActionSource = new MainActionSource(
      action$$,
      store,
      actionsForStore
    );

    action$$.addListener({ next() {}, error() {}, complete() {} });

    const isolateSink = isolateActionSink;
    const isolateSource = (source, scope) => ({
      action: isolateActionSource(source.action, scope),
      state: source.state.select(scope),
      isolateSource,
      isolateSink,
    });

    return {
      action: actionSource,
      state: stateSource,
      isolateSource,
      isolateSink,
    };
  };
};
