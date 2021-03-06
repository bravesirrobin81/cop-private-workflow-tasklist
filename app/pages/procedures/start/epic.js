import * as types from "./actionTypes";
import * as actions from "./actions";
import {combineEpics} from "redux-observable";
import {errorObservable} from "../../../core/error/epicUtil";
import {retry} from "../../../core/util/retry";
import PubSub from 'pubsub-js';


const fetchProcessDefinition = (action$, store,  {client}) =>
    action$.ofType(types.FETCH_PROCESS_DEFINITION)
        .mergeMap(action =>
            client({
                method: 'GET',
                path: `/api/workflow/process-definitions/${action.processKey}`,
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${store.getState().keycloak.token}`
                }
            }).retryWhen(retry).map(payload => actions.fetchProcessDefinitionSuccess(payload))
                .catch(error => {
                        return errorObservable(actions.fetchProcessDefinitionFailure(), error);
                    }
                ));

const fetchForm = (action$, store, { client }) =>
  action$.ofType(types.FETCH_FORM)
    .mergeMap(action =>
      client({
        method: 'GET',
        path: `/api/translation/form/${action.formName}`,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${store.getState().keycloak.token}`
        }
      })
        .retryWhen(retry)
        .map(payload => actions.fetchFormSuccess(payload))
        .catch(error => {
            return errorObservable(actions.fetchFormFailure(), error);
          }
        ));

const fetchFormWithContext = (action$, store, { client }) =>
  action$.ofType(types.FETCH_FORM_WITH_CONTEXT)
    .mergeMap(action =>
      client({
        method: 'POST',
        path: `/api/translation/form`,
        entity: {
          'formName': action.formName,
          'dataContext': action.dataContext
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${store.getState().keycloak.token}`
        }
      })
        .retryWhen(retry)
        .map(payload => actions.fetchFormSuccess(payload))
        .catch(error => {
            return errorObservable(actions.fetchFormFailure(), error);
          }
        ));

const submit = (action$, store, { client }) =>
  action$.ofType(types.SUBMIT)
    .mergeMap(action => {
      const submissionData = action.submissionData;
      return  client({
        method: 'POST',
        path: `/api/form/${action.formId}/submission`,
        entity: {
          'data':submissionData
        },
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${store.getState().keycloak.token}`,
          'Content-Type': 'application/json'
        }
      })
        .retryWhen(retry)
        .map(payload => {
          if (action.nonShiftApiCall) {
            return {
              type: types.SUBMIT_TO_WORKFLOW_NON_SHIFT,
              processKey: action.processKey,
              variableName: action.variableName,
              data: submissionData,
              processName: action.processName
            };
          } else {
            return {
              type: types.SUBMIT_TO_WORKFLOW,
              processKey: action.processKey,
              variableName: action.variableName,
              data: payload.entity.data,
              processName: action.processName
            };
          }
        })
        .catch(error => {
            return errorObservable(actions.submitFailure(), error);
          }
        )
    });


const submitToWorkflow = (action$, store, { client }) =>
  action$.ofType(types.SUBMIT_TO_WORKFLOW)
    .mergeMap(action =>
      client({
        method: 'POST',
        path: `/api/workflow/process-instances`,
        entity: {
          'data': action.data,
          'processKey': action.processKey,
          'variableName': action.variableName
        },
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${store.getState().keycloak.token}`,
          'Content-Type': 'application/json'
        }
      })
        .retryWhen(retry)
        .map(payload => {
          PubSub.publish('submission', {
            submission: true,
            autoDismiss: true,
            message: `${action.processName} successfully started`
          });
          return actions.submitToWorkflowSuccess(payload);
        })
        .catch(error => {
          return errorObservable(actions.submitToWorkflowFailure(), error);
        })
    );

const createVariable = (action, email) => {
  const variableName = action.variableName;
  const variables = {};
  variables[variableName] = {
    value: JSON.stringify(action.data),
    type: 'json'
  };
  variables['initiatedBy'] = {
    value: email,
    type: "String"
  };

  variables['type'] = {
    value: 'non-notifications',
    type: 'String'
  };
  return {
    "variables" : variables
  };
};

const submitToWorkflowUsingNonShiftApi = (action$, store, { client }) =>
  action$.ofType(types.SUBMIT_TO_WORKFLOW_NON_SHIFT)
    .mergeMap(action =>
      client({
        method: 'POST',
        path: `/rest/camunda/process-definition/key/${action.processKey}/start`,
        entity: createVariable(action, store.getState().keycloak.tokenParsed.email),
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${store.getState().keycloak.token}`,
          'Content-Type': 'application/json'
        }
      }).retryWhen(retry)
        .map(payload => {
          console.log(JSON.stringify(action));
          PubSub.publish('submission', {
            submission: true,
            autoDismiss: true,
            message: `${action.processName} successfully started`
          });
          return actions.submitToWorkflowSuccess(payload);
        })
        .catch(error => {
          return errorObservable(actions.submitToWorkflowFailure(), error);
        })
    );


export default combineEpics(fetchProcessDefinition, fetchForm, fetchFormWithContext, submit, submitToWorkflow, submitToWorkflowUsingNonShiftApi);
