import React from "react";

const uuidv4 = require('uuid/v4');

export default class ErrorPanel extends React.Component {

    render() {
        const {hasError, errors} = this.props;
        const items = [];
        const buildMessageFrom = (err) => {
           if (!err.get('url')) {
               return <li key={uuidv4()}>{err.get('message')}</li>
           }
           return <li key={uuidv4()}>{err.get('url')} - [{err.get('status')} {err.get('error')}]
                - {err.get('message')}</li>
        };
        errors.forEach((err) => {
            items.push(buildMessageFrom(err));
        });
        if (hasError) {
            return <div className="error-summary" role="alert" aria-labelledby="error-summary-heading-example-1"
                 tabIndex="-1">
                <h2 className="heading-medium error-summary-heading" id="error-summary-heading-example-1">
                    We are experiencing technical problems
                </h2>
                <h4 className="heading-small error-summary-heading" id="error-summary-heading-example-1">
                   The technical issue has been logged for support to investigate.
                </h4>
                <details>
                    <summary><span className="summary">Error details</span></summary>
                        <ul className="list list-bullet">
                            {items}
                        </ul>
                </details>
            </div>
        } else {
            return <div/>
        }
    }
}



