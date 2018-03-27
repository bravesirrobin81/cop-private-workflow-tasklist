import React, {PropTypes} from "react";
import {withRouter} from "react-router-dom";
import {connect} from "react-redux";
import PersonalDetailsSection from "./PersonalDetailsSection";
import {hasActiveSession, isFetching} from "../../../core/session/selectors";
import {bindActionCreators} from "redux";
import {createStructuredSelector} from "reselect";
import * as sessionActions from "../../../core/session/actions";
import * as formActions from '../../../core/forms/actions';

import {form, isFetchingForm} from "../../../core/forms/selectors";

import Spinner from 'react-spinkit';
import FormioUtils from 'formiojs/utils';
import {Formio} from 'react-formio';
import 'react-formio/formio.css';

class ProfilePage extends React.Component {

    componentDidMount() {
        this.props.actions.sessionActions.fetchActiveSession();
        this.props.actions.formActions.fetchForm("createSession");
    }



    parseForm = (form) => {

        if (!this.props.isFetchingFrom && form) {
            FormioUtils.eachComponent(form.components, function(component) {
                if (component.data && component.data.url) {
                    const url = component.data.url;
                    component.data.url = `${window.location.origin}/api/reference-data${url}`;
                }
            });
        }
        return form;
    };


    render() {

        const {hasActiveSession, isFetching, isFetchingFrom} = this.props;
        const form = this.parseForm(this.props.form);
        const toDisplay = !hasActiveSession ?
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <div className="notice">
                    <i className="icon icon-important">
                        <span className="visually-hidden">Warning</span>
                    </i>
                    <strong className="bold-small">
                        Please enter your current task assignment before proceeding
                    </strong>
                </div>
            </div> : <div/>;
        return <div>
            {isFetching && isFetchingForm?
                <div style={{display: 'flex', justifyContent: 'center'}}><Spinner
                    name="three-bounce" color="#005ea5"/></div>
                : toDisplay
            }

            <div className="grid-row">
                <div className="column-one-half">
                    <PersonalDetailsSection {...this.props} />
                </div>
                <div className="column-one-half">
                    <fieldset>
                        <legend>
                            <h3 className="heading-medium">Team Details</h3>
                        </legend>
                        {isFetchingFrom ? <div>
                            Loading form...
                        </div> : <Formio form={form} />
                        }
                    </fieldset>
                </div>

            </div>
        </div>
    }
}


ProfilePage.propTypes = {
    isFetching: PropTypes.bool,
    hasActiveSession: PropTypes.bool,
    isFetchingFrom : PropTypes.bool
};


const mapDispatchToProps = (dispatch) => {
    return {
        actions: {
            formActions: bindActionCreators(formActions, dispatch),
            sessionActions: bindActionCreators(sessionActions, dispatch)
        }
    };
};

export default connect((state) => {
    return {
        kc: state.keycloak,
        hasActiveSession: hasActiveSession(state),
        isFetching: isFetching(state),
        isFetchingForm: isFetchingForm(state),
        form: form(state)
    }
}, mapDispatchToProps)(withRouter(ProfilePage))