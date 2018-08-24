import React, {PropTypes} from 'react';
import {withRouter} from "react-router";
import DashboardTitle from "./DashboardTitle";
import DashboardPanel from "./DashboardPanel";
import {bindActionCreators} from "redux";
import * as actions from "../../../core/shift/actions";
import connect from "react-redux/es/connect/connect";
import {
    hasActiveShift, isFetchingShift
} from "../../../core/shift/selectors";
import {errors, hasError} from "../../../core/error/selectors";
import ErrorPanel from "../../../core/error/component/ErrorPanel";
import Spinner from 'react-spinkit';
import 'react-spinkit/css/wordpress.css';

class DashboardPage extends React.Component {

    componentDidMount() {
        this.props.fetchActiveShift();
    }

    render() {
        const {hasActiveShift, isFetchingShift} = this.props;

        const headerToDisplay = !isFetchingShift && !hasActiveShift ?
            <div style={{display: 'flex', justifyContent: 'center', paddingTop: '15px'}}>
                <div className="notice">
                    <i className="icon icon-important">
                        <span className="visually-hidden">Warning</span>
                    </i>
                    <strong className="bold-medium">
                        Please start your shift before proceeding
                    </strong>
                </div>
            </div> : (isFetchingShift ? <div style={{paddingTop: '15px'}}>
                <div>
                    <strong className="bold loading">
                        Checking if you have an active shift
                    </strong>
                </div>
            </div> : <div/>);


        if (isFetchingShift) {
            return <div>
                <div className="loader-content">
                    <Spinner
                        name="line-spin-fade-loader" color="black"/>
                </div>
                <div className="loader-message"><strong className="bold">
                    Checking if you have an active shift
                </strong></div>
            </div>


        } else {
            return <div>
                {headerToDisplay}
                <ErrorPanel {...this.props} />
                <DashboardTitle hasActiveShift={hasActiveShift}/>
                <DashboardPanel hasActiveShift={hasActiveShift}/>
            </div>
        }


    }
}

DashboardPage.propTypes = {
    fetchActiveShift: PropTypes.func.isRequired,
    isFetchingShift: PropTypes.bool,
    hasActiveShift: PropTypes.bool
};


const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

export default withRouter(connect((state) => {
    return {
        kc: state.keycloak,
        hasActiveShift: hasActiveShift(state),
        hasError: hasError(state),
        errors: errors(state),
        isFetchingShift: isFetchingShift(state)
    }
}, mapDispatchToProps)(DashboardPage))