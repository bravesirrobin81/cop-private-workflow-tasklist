import {errorObservable} from "../../core/error/epicUtil";
import * as types from "./actionTypes";
import * as actions from "./actions";
import {combineEpics} from "redux-observable";
import {retry} from "../../core/util/retry";


const fetchTaskCounts = (action$, store, {client}) =>
    action$.ofType(types.FETCH_TASK_COUNTS)
        .mergeMap(action =>
            client({
                method: 'GET',
                path: `/api/workflow/tasks/_task-counts`,
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${store.getState().keycloak.token}`
                }
            }).retryWhen(retry).map(payload => actions.fetchTaskCountsSuccess(payload))
                .catch(error => {
                        return errorObservable(actions.fetchTaskCountsFailure(), error);
                    }
                ));


const fetchMessageCounts = (action$, store, {client}) =>
    action$.ofType(types.FETCH_NOTIFICATIONS_COUNT)
        .mergeMap(action =>
            client({
                method: 'GET',
                path: `/api/workflow/notifications?countOnly=true`,
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${store.getState().keycloak.token}`
                }
            }).retryWhen(retry).map(payload => actions.fetchMessageCountsSuccess(payload))
                .catch(error => {
                        return errorObservable(actions.fetchMessageCountsFailure(), error);
                    }
                ));


export default combineEpics(fetchTaskCounts, fetchMessageCounts);
