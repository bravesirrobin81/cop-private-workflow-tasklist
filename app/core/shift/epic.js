import * as types from './actionTypes';
import * as actions from './actions';
import { combineEpics } from 'redux-observable';
import { errorObservable } from '../../core/error/epicUtil';
import PubSub from 'pubsub-js';
import * as Rx from 'rxjs/Observable';
import { retry } from '../../core/util/retry';


const shift = (email, token, client) => {
  console.log(`Requesting shift details for ${email}`);
  return client({
    method: 'GET',
    path: `/api/platform-data/shift?email=eq.${encodeURIComponent(email)}`,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};


const endShift = (action$, store, { client }) =>
  action$.ofType(types.END_SHIFT)
    .mergeMap(action =>
      client({
        method: 'DELETE',
        path: `/api/workflow/shift/${encodeURIComponent(store.getState().keycloak.tokenParsed.email)}?deletedReason=finished`,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${store.getState().keycloak.token}`
        }
      })
        .retryWhen(retry)
        .map(payload => actions.endShiftSuccess(payload))
        .catch(error => {
            return errorObservable(actions.endShiftFailure(), error);
          }
        ));


const fetchStaffDetails = (action$, store, { client }) =>
  action$.ofType(types.FETCH_STAFF_DETAILS)
    .mergeMap(action =>
      client({
        method: 'POST',
        path: `/api/platform-data/rpc/staffdetails`,
        entity: {
          'argstaffemail': `${store.getState().keycloak.tokenParsed.email}`
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.getState().keycloak.token}`
        }
      })
        .retryWhen(retry)
        .map(payload => actions.fetchStaffDetailsSuccess(payload))
        .catch(error => {
            return errorObservable(actions.fetchStaffDetailsFailure(), error);
          }
        ));


const fetchShiftForm = (action$, store, { client }) =>
  action$.ofType(types.FETCH_SHIFT_FORM)
    .mergeMap(action =>
      client({
        method: 'GET',
        path: `/api/translation/form/startShift`,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${store.getState().keycloak.token}`
        }
      })
        .retryWhen(retry)
        .map(payload => actions.fetchShiftFormSuccess(payload))
        .catch(error => {
            return errorObservable(actions.fetchShiftFormFailure(), error);
          }
        ));

const fetchActiveShift = (action$, store, { client }) =>
  action$.ofType(types.FETCH_ACTIVE_SHIFT)
    .mergeMap(action =>
      shift(store.getState().keycloak.tokenParsed.email, store.getState().keycloak.token, client)
        .retryWhen(retry)
        .map(payload => {
          if (payload.status.code === 200 && payload.entity.length === 0) {
            console.log('No data');
            throw {
              status: {
                code: 403
              }
            };
          } else {
            return actions.fetchActiveShiftSuccess(payload);
          }
        })
        .retryWhen((errors) => {
          return errors
            .takeWhile(error => error.status.code === 403)
            .take(0)
            .concat(errors.flatMap(s => {
              return Rx.Observable.throw(s);
            }));
        })
        .catch(error => {
            return errorObservable(actions.fetchActiveShiftFailure(), error);
          }
        ));


const submit = (action$, store, { client }) =>
  action$.ofType(types.SUBMIT_VALIDATION)
    .mergeMap(action => {
      const shiftData = action.submissionData;
      return client({
        method: 'POST',
        path: `/api/form/${action.formId}/submission`,
        entity: {
          'data': shiftData
        },
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${store.getState().keycloak.token}`,
          'Content-Type': 'application/json'
        }
      }).take(1).map(payload => {
        return {
          type: types.CREATE_ACTIVE_SHIFT,
          shiftInfo: payload.entity.data
        };
      }).retryWhen(retry).catch(error => {
            return errorObservable(actions.submitFailure(), error);
          }
        )
    });


const createActiveShift = (action$, store, { client }) =>
  action$.ofType(types.CREATE_ACTIVE_SHIFT)
    .mergeMap(action =>
      client({
        method: 'POST',
        entity: action.shiftInfo,
        path: `/api/workflow/shift`,
        headers: {
          'Authorization': `Bearer ${store.getState().keycloak.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .retryWhen(retry)
        .map(() => {
          return {
            type: types.FETCH_ACTIVE_SHIFT_AFTER_CREATE,
          };
        })
        .catch(error => {
            return errorObservable(actions.createActiveShiftFailure(), error);
          }
        ));


const fetchActiveShiftAfterCreation = (action$, store, { client }) =>
  action$.ofType(types.FETCH_ACTIVE_SHIFT_AFTER_CREATE)
    .mergeMap(action =>
      shift(store.getState().keycloak.tokenParsed.email, store.getState().keycloak.token, client)
        .retryWhen(retry)
        .flatMap(payload => {
          if (payload.status.code === 200 && payload.entity.length === 0) {
            console.log(`Empty shift details returned...retying as shift creation is asynchronous`);
            throw {
              status: {
                code: 403
              }
            };
          } else {
            console.log(`Shift details located...`);
            PubSub.publish('submission', {
              submission: true,
              autoDismiss: true,
              message: `Shift successfully started`
            });
            return ([actions.createActiveShiftSuccess(),
              actions.fetchActiveShiftSuccess(payload)]);
          }
        })
        .retryWhen((errors) => {
          return errors
            .takeWhile((error) => {
              const retryableError = error.status.code === 403;
              console.log(`Retryable error while trying to get shift...`);
              return retryableError;
            })
            .delay(1000)
            .take(10)
            .concat(errors.flatMap(s => {
              return Rx.Observable.throw(s);
            }));
        })
        .catch(error => {
            console.log(`Failed to create shift information...${JSON.stringify(error)}`);
            return errorObservable(actions.createActiveShiftFailure(), error);
          }
        ));

export default combineEpics(fetchActiveShift, submit, createActiveShift, fetchShiftForm,
  fetchActiveShiftAfterCreation, fetchStaffDetails, endShift);
