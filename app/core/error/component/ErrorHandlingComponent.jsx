import React from 'react';
import PropTypes from 'prop-types';
import { errors, hasError, unauthorised } from '../selectors';
import * as actions from '../actions';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Redirect, withRouter } from 'react-router';
import ErrorPanel from './ErrorPanel';

export class ErrorHandlingComponent extends React.Component {

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.hasError) {
      const path = this.props.history.location.pathname;
      const user = this.props.kc.tokenParsed.email;
      const errors = this.props.errors ? this.props.errors.map((error) => {
          return {
            path: path,
            level: 'error',
            status: error.get('status'),
            message: error.get('message'),
            url: error.get('url'),
            user: user,
          }
        }) : [];
      this.props.log(errors);
    }
  }

  componentDidCatch(error, errorInfo) {
    const path = this.props.history.location.pathname;
    const user = this.props.kc.tokenParsed.email;
    this.props.log([{
      level: 'error',
      user: user,
      path: path,
      error,
      errorInfo
    }]);
  }

  render() {
    const { hasError, unauthorised, skipAuthError } = this.props;
    if (!unauthorised && !hasError) {
      return <div>{this.props.children}</div>;
    }

    if (unauthorised && !skipAuthError) {
      return <Redirect push to="/dashboard"/>;
    } else {
      return <div>
        <ErrorPanel {...this.props} />
        {this.props.children}
      </div>;
    }
  }
}

ErrorHandlingComponent.propTypes = {
  log: PropTypes.func,
  hasError: PropTypes.bool,
  errors: ImmutablePropTypes.list,
  unauthorised: PropTypes.bool
};


const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

export default withRouter(connect((state) => {
  return {
    kc: state.keycloak,
    hasError: hasError(state),
    errors: errors(state),
    unauthorised: unauthorised(state),

  };
}, mapDispatchToProps)(ErrorHandlingComponent));
