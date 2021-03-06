import Immutable from 'immutable';
import * as actions from './actionTypes';
import { FAILED, NOT_SUBMITTED, SUBMISSION_SUCCESSFUL, SUBMITTING } from './constants';

const { Map } = Immutable;

const initialState = new Map({
  loadingTaskForm: false,
  form: null,
  submissionStatus: NOT_SUBMITTED,
  customEventSubmissionStatus: NOT_SUBMITTED
});

function reducer(state = initialState, action) {
  switch (action.type) {
    case actions.RESET_FORM:
      return initialState;
    case actions.FETCH_TASK_FORM:
      return state.set('loadingTaskForm', true)
        .set('form', null)
        .set('taskFormCompleteSuccessful', false)
        .set('submittingTaskFormForCompletion', false);
    case actions.FETCH_TASK_FORM_SUCCESS:
      const data = action.payload.entity;
      return state.set('loadingTaskForm', false)
        .set('form', data);
    case actions.FETCH_TASK_FROM_FAILURE:
      return state.set('loadingTaskForm', false);
    case actions.SUBMIT_TASK_FORM:
      return state.set('submissionStatus', SUBMITTING);
    case actions.SUBMIT_TASK_FORM_FAILURE:
      return state.set('submissionStatus', FAILED);
    case actions.COMPLETE_TASK_FORM:
      return state.set('submissionStatus', SUBMITTING);
    case actions.COMPLETE_TASK_FORM_SUCCESS:
      return state.set('submissionStatus', SUBMISSION_SUCCESSFUL);
    case actions.COMPLETE_TASK_FORM_FAILURE:
      return state.set('submissionStatus', FAILED);

    case actions.TASK_CUSTOM_EVENT:
      return state.set('customEventSubmissionStatus', SUBMITTING);
    case actions.TASK_CUSTOM_EVENT_SUCCESS:
      return state.set('customEventSubmissionStatus', SUBMISSION_SUCCESSFUL);
    case actions.TASK_CUSTOM_EVENT_FAILURE:
      return state.set('customEventSubmissionStatus', FAILED);
     default:
      return state;
  }

}

export default reducer;
