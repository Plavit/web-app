import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { reset, startAsyncValidation } from 'redux-form';
import { defaultMemoize } from 'reselect';
import { Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import PageContent from '../../components/layout/PageContent';
import ResourceRenderer from '../../components/helpers/ResourceRenderer';
import RegistrationForm from '../../components/forms/RegistrationForm';
import Box from '../../components/widgets/Box';
import Button, { TheButtonGroup } from '../../components/widgets/TheButton';
import InsetPanel from '../../components/widgets/InsetPanel';
import { MailIcon, LinkIcon, SignInIcon } from '../../components/icons';

import { createAccount, createExternalAccount } from '../../redux/modules/registration';
import { fetchInstances } from '../../redux/modules/instances';
import { publicInstancesSelector } from '../../redux/selectors/instances';
import { hasSucceeded } from '../../redux/selectors/registration';

import { getConfigVar, getConfigVarLocalized } from '../../helpers/config';
import withLinks from '../../helpers/withLinks';

// Configuration properties
const ALLOW_LOCAL_REGISTRATION = getConfigVar('ALLOW_LOCAL_REGISTRATION');
const EXTERNAL_AUTH_HELPDESK_URL = getConfigVar('EXTERNAL_AUTH_HELPDESK_URL');

const getInitialValues = defaultMemoize(instances => {
  const firstInstance = instances && instances[0];
  return {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    passwordStrength: null,
    instanceId: firstInstance && firstInstance.id,
    gdpr: false,
  };
});

class Registration extends Component {
  componentDidMount = () => {
    this.checkIfIsDone(this.props);
    this.props.loadAsync();
  };

  componentDidUpdate = () => this.checkIfIsDone(this.props);

  checkIfIsDone = ({ hasSucceeded, reset, history: { replace }, links: { DASHBOARD_URI } }) => {
    if (hasSucceeded) {
      setTimeout(() => {
        replace(DASHBOARD_URI);
        reset();
      }, 600);
    }
  };

  render() {
    const {
      instances,
      createAccount,
      links: { LOGIN_URI },
      intl: { locale },
    } = this.props;

    const EXTERNAL_AUTH_NAME = getConfigVarLocalized('EXTERNAL_AUTH_NAME', locale);
    const showExternalInfo = Boolean(!ALLOW_LOCAL_REGISTRATION && EXTERNAL_AUTH_NAME && EXTERNAL_AUTH_HELPDESK_URL);

    return (
      <PageContent
        icon="user-plus"
        title={<FormattedMessage id="app.registration.title" defaultMessage="Create a New ReCodEx Account" />}>
        <ResourceRenderer resource={instances.toArray()} returnAsArray>
          {instances => (
            <Row>
              <Col lg={{ span: 8, offset: 2 }} md={{ span: 10, offset: 1 }} sm={{ span: 12, offset: 0 }}>
                {ALLOW_LOCAL_REGISTRATION && (
                  <RegistrationForm
                    instances={instances}
                    initialValues={getInitialValues(instances)}
                    onSubmit={createAccount}
                  />
                )}

                {showExternalInfo && (
                  <Box
                    title={
                      <FormattedMessage
                        id="app.registration.externalTitle"
                        defaultMessage="External Authentication Enabled"
                      />
                    }
                    footer={
                      <div className="text-center">
                        <TheButtonGroup>
                          <Link to={LOGIN_URI}>
                            <Button variant="primary">
                              <SignInIcon gapRight />
                              <FormattedMessage
                                id="app.registration.external.gotoSignin"
                                defaultMessage="Sign-in Page"
                              />
                            </Button>
                          </Link>

                          <a href={EXTERNAL_AUTH_HELPDESK_URL}>
                            {EXTERNAL_AUTH_HELPDESK_URL.startsWith('mailto:') ? (
                              <Button variant="warning">
                                <MailIcon gapRight />
                                <FormattedMessage
                                  id="app.registration.external.mail"
                                  defaultMessage="Contact Support"
                                />
                              </Button>
                            ) : (
                              <Button variant="primary">
                                <LinkIcon gapRight />
                                <FormattedMessage
                                  id="app.registration.external.link"
                                  defaultMessage="Visit Help Page"
                                />
                              </Button>
                            )}
                          </a>
                        </TheButtonGroup>
                      </div>
                    }>
                    <InsetPanel>
                      <FormattedMessage
                        id="app.registration.externalInfo"
                        defaultMessage='Registration of local accounts is disabled. However, external authenticator "{authName}" is registered which is allowed to create or connect ReCodEx accounts. Simply visit "Sign in" page and use this authenticator.'
                        values={{ authName: EXTERNAL_AUTH_NAME }}
                      />
                    </InsetPanel>
                  </Box>
                )}
              </Col>
            </Row>
          )}
        </ResourceRenderer>
      </PageContent>
    );
  }
}

Registration.propTypes = {
  instances: ImmutablePropTypes.map.isRequired,
  loadAsync: PropTypes.func.isRequired,
  createAccount: PropTypes.func.isRequired,
  createExternalAccount: PropTypes.func.isRequired,
  hasSucceeded: PropTypes.bool,
  reset: PropTypes.func.isRequired,
  triggerAsyncValidation: PropTypes.func.isRequired,
  links: PropTypes.object.isRequired,
  intl: PropTypes.object,
};

export default withLinks(
  connect(
    state => ({
      instances: publicInstancesSelector(state),
      hasSucceeded: hasSucceeded(state),
    }),
    dispatch => ({
      loadAsync: () => Promise.all([dispatch(fetchInstances())]),
      createAccount: ({ firstName, lastName, email, password, passwordConfirm, instanceId }) =>
        dispatch(createAccount(firstName, lastName, email, password, passwordConfirm, instanceId)),
      createExternalAccount:
        (authType = 'secondary') =>
        ({ instanceId, serviceId, ...credentials }) =>
          dispatch(createExternalAccount(instanceId, serviceId, credentials, authType)),
      triggerAsyncValidation: () => dispatch(startAsyncValidation('registration')),
      reset: () => {
        dispatch(reset('registration'));
        dispatch(reset('external-registration'));
      },
    })
  )(injectIntl(Registration))
);
