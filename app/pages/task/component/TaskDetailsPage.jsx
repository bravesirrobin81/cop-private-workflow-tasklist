import React from 'react';
import Actions from './Actions';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import TaskTitle from './TaskTitle';
import Comments from './Comments';
import TaskForm from '../../../core/task-form/components/TaskForm';
import 'flatpickr/dist/flatpickr.min.css';
import flatpickr from 'flatpickr';
import moment from 'moment';
import * as actions from '../actions';
import PropTypes from 'prop-types';
import {
  submittingCustomEvent,
  submittingTaskFormForCompletion
} from '../../../core/task-form/selectors';

import DataSpinner from '../../../core/components/DataSpinner';
import Loader from 'react-loader-advanced';

export class TaskDetailsPage extends React.Component {

  componentDidMount() {
    const { updateDueDate } = this.refs;
    flatpickr(updateDueDate, {
      enableTime: true,
      dateFormat: 'd-m-Y H:i',
      minDate: 'today',
      time_24hr: true,
      onClose: (selectedDates, dateStr, instance) => {
        const { task } = this.props;
        this.props.updateDueDate({ taskId: task.get('id'), dueDate: dateStr });
      }
    });
  }

  render() {
    const { task, variables, submittingTaskFormForCompletion, submittingCustomEvent } = this.props;
    const hasFormKey = task && task.get('formKey');
    return <div>
      <Loader show={submittingTaskFormForCompletion || submittingCustomEvent}
              message={<div style={{ justifyContent: 'center' }}><DataSpinner message="Actioning task..."/></div>}
              hideContentOnLoad={submittingTaskFormForCompletion || submittingCustomEvent}
              foregroundStyle={{ color: 'black' }}
              backgroundStyle={{ backgroundColor: 'white' }}>
        <div><TaskTitle {...this.props} />

          <div className="grid-row">
            <div className="column-two-thirds" style={{ paddingTop: '10px' }}>
              <p id="taskDescription">{task.get('description')}</p>
              {hasFormKey ? <TaskForm task={task} variables={variables}/> :
                <Actions task={task} variables={variables}/>}
            </div>
            <div className="column-one-third" style={{ paddingTop: '10px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="updateDueDate">Change due date:</label>
                <div className="input-group">
                  <input className="form-control" ref="updateDueDate" id="updateDueDate" type="text"
                         name="updateDueDate"
                         defaultValue={moment(task.get('due'))
                           .format('DD-MM-YYYY HH:mm')}/>
                  <span className="input-group-addon"><span
                    className="glyphicon glyphicon-calendar"/></span>
                </div>
              </div>
              <Comments taskId={task.get('id')} {...this.props} />
            </div>
          </div>
        </div>
      </Loader>

    </div>;
  }
}


TaskDetailsPage.propTypes = {
  updateDueDate: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

export default withRouter(connect((state) => {
  return {
    kc: state.keycloak,
    submittingTaskFormForCompletion: submittingTaskFormForCompletion(state),
    submittingCustomEvent: submittingCustomEvent(state)
  };
}, mapDispatchToProps)(TaskDetailsPage));
