import client from "../../common/rest/client";
import {errorObservable} from "../../core/error/epicUtil";
import * as types from "./actionTypes";
import * as actions from "./actions";
import {combineEpics} from "redux-observable";
import {retryOnForbidden} from "../../core/util/retry";

const fetchTasksAssignedYou = (action$, store) =>
    action$.ofType(types.FETCH_TASKS_ASSIGNED_TO_YOU)
        .mergeMap(action =>
            client({
                method: 'GET',
                path: `${action.url}`,
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${store.getState().keycloak.token}`
                }
            }).retryWhen(retryOnForbidden).map(payload => actions.fetchTasksAssignedToYouSuccess(payload))
                .catch(error => {
                        return errorObservable(actions.fetchTasksAssignedToYouFailure(), error);
                    }
                ));


const fetchYourGroupTasks = (action$, store) =>
    action$.ofType(types.FETCH_YOUR_GROUP_TASKS)
        .mergeMap(action =>
            client({
                method: 'GET',
                path: `${action.url}`,
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${store.getState().keycloak.token}`
                }
            }).retryWhen(retryOnForbidden).map(payload => actions.fetchYourGroupTasksSuccess(payload))
                .catch(error => {
                        return errorObservable(actions.fetchYourGroupTasksFailure(), error);
                    }
                ));


const fetchUnassignedTasks = (action$, store) =>
    action$.ofType(types.FETCH_UNASSIGNED_TASKS)
        .mergeMap(action =>
            client({
                method: 'GET',
                path: `${action.url}`,
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${store.getState().keycloak.token}`
                }
            }).retryWhen(retryOnForbidden).map(payload => actions.fetchUnassignedTasksSuccess(payload))
                .catch(error => {
                        return errorObservable(actions.fetchUnassignedTasksFailure(), error);
                    }
                ));


export default combineEpics(fetchTasksAssignedYou, fetchYourGroupTasks, fetchUnassignedTasks);
