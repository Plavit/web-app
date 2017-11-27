import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Col, Row, Alert } from 'react-bootstrap';

import Button from '../../components/widgets/FlatButton';
import { LinkContainer } from 'react-router-bootstrap';

import {
  fetchAssignmentIfNeeded,
  syncWithExercise
} from '../../redux/modules/assignments';
import { canSubmit } from '../../redux/modules/canSubmit';
import {
  init,
  submitAssignmentSolution as submitSolution
} from '../../redux/modules/submission';
import { fetchUsersSubmissions } from '../../redux/modules/submissions';
import { fetchRuntimeEnvironments } from '../../redux/modules/runtimeEnvironments';

import {
  getAssignment,
  runtimeEnvironmentsSelector,
  getUserSubmissions
} from '../../redux/selectors/assignments';
import { canSubmitSolution } from '../../redux/selectors/canSubmit';
import { isSubmitting } from '../../redux/selectors/submission';
import { loggedInUserIdSelector } from '../../redux/selectors/auth';
import {
  isStudentOf,
  isSupervisorOf,
  isLoggedAsSuperAdmin
} from '../../redux/selectors/users';
import { runtimeEnvironmentSelector } from '../../redux/selectors/runtimeEnvironments';

import Page from '../../components/layout/Page';
import ResourceRenderer from '../../components/helpers/ResourceRenderer';
import { LocalizedExerciseName } from '../../components/helpers/LocalizedNames';
import UsersNameContainer from '../../containers/UsersNameContainer';
import { ResubmitAllSolutionsContainer } from '../../containers/ResubmitSolutionContainer';
import HierarchyLineContainer from '../../containers/HierarchyLineContainer';
import AssignmentDetails from '../../components/Assignments/Assignment/AssignmentDetails';
import { EditIcon, ResultsIcon } from '../../components/icons';
import LocalizedTexts from '../../components/helpers/LocalizedTexts';
import SubmitSolutionButton from '../../components/Assignments/SubmitSolutionButton';
import SubmitSolutionContainer from '../../containers/SubmitSolutionContainer';
import SubmissionsTable from '../../components/Assignments/SubmissionsTable';

import withLinks from '../../hoc/withLinks';

class Assignment extends Component {
  static loadAsync = ({ assignmentId }, dispatch, userId) =>
    Promise.all([
      dispatch(fetchAssignmentIfNeeded(assignmentId)),
      dispatch(fetchRuntimeEnvironments()),
      dispatch(canSubmit(assignmentId)),
      dispatch(fetchUsersSubmissions(userId, assignmentId))
    ]);

  componentWillMount() {
    this.props.loadAsync(this.props.userId);
  }

  componentWillReceiveProps(newProps) {
    if (
      this.props.params.assignmentId !== newProps.params.assignmentId ||
      this.props.userId !== newProps.userId
    ) {
      newProps.loadAsync(newProps.userId);
    }
  }

  isAfter = unixTime => {
    return unixTime * 1000 < Date.now();
  };

  sortSubmissions(submissions) {
    return submissions.sort((a, b) => {
      var aTimestamp = a.getIn(['data', 'solution', 'createdAt']);
      var bTimestamp = b.getIn(['data', 'solution', 'createdAt']);
      return bTimestamp - aTimestamp;
    });
  }

  render() {
    const {
      assignment,
      submitting,
      userId,
      loggedInUserId,
      init,
      isSuperAdmin,
      isStudentOf,
      isSupervisorOf,
      canSubmit,
      runtimeEnvironments,
      exerciseSync,
      submissions,
      links: { ASSIGNMENT_EDIT_URI_FACTORY, SUPERVISOR_STATS_URI_FACTORY }
    } = this.props;

    return (
      <Page
        resource={assignment}
        title={assignment => <LocalizedExerciseName entity={assignment} />}
        description={
          <FormattedMessage
            id="app.assignment.title"
            defaultMessage="Exercise assignment"
          />
        }
        breadcrumbs={[
          {
            resource: assignment,
            iconName: 'group',
            breadcrumb: assignment => ({
              text: (
                <FormattedMessage
                  id="app.group.title"
                  defaultMessage="Group detail"
                />
              ),
              link: ({ GROUP_URI_FACTORY }) =>
                GROUP_URI_FACTORY(assignment.groupId)
            })
          },
          {
            text: (
              <FormattedMessage
                id="app.assignment.title"
                defaultMessage="Exercise assignment"
              />
            ),
            iconName: 'puzzle-piece'
          }
        ]}
      >
        {assignment =>
          <div>
            <Row>
              <Col xs={12}>
                <HierarchyLineContainer groupId={assignment.groupId} />
                {loggedInUserId !== userId &&
                  <p>
                    <UsersNameContainer userId={userId} />
                  </p>}
                {(isSuperAdmin || isSupervisorOf(assignment.groupId)) &&
                  <p>
                    <LinkContainer
                      to={ASSIGNMENT_EDIT_URI_FACTORY(assignment.id)}
                    >
                      <Button bsStyle="warning">
                        <EditIcon />{' '}
                        <FormattedMessage
                          id="app.assignment.editSettings"
                          defaultMessage="Edit assignment settings"
                        />
                      </Button>
                    </LinkContainer>
                    <LinkContainer
                      to={SUPERVISOR_STATS_URI_FACTORY(assignment.id)}
                    >
                      <Button bsStyle="primary">
                        <ResultsIcon />{' '}
                        <FormattedMessage
                          id="app.assignment.viewResults"
                          defaultMessage="View student results"
                        />
                      </Button>
                    </LinkContainer>
                    <ResubmitAllSolutionsContainer
                      assignmentId={assignment.id}
                    />
                  </p>}
              </Col>
            </Row>
            {(isSuperAdmin || isSupervisorOf(assignment.groupId)) &&
              (!assignment.exerciseSynchronizationInfo.exerciseConfig
                .upToDate ||
                !assignment.exerciseSynchronizationInfo
                  .exerciseEnvironmentConfigs.upToDate ||
                !assignment.exerciseSynchronizationInfo.hardwareGroups
                  .upToDate ||
                !assignment.exerciseSynchronizationInfo.localizedTexts
                  .upToDate ||
                !assignment.exerciseSynchronizationInfo.limits.upToDate ||
                !assignment.exerciseSynchronizationInfo.scoreConfig.upToDate ||
                !assignment.exerciseSynchronizationInfo.scoreCalculator
                  .upToDate) &&
              <Row>
                <Col sm={12}>
                  <Alert bsStyle="warning">
                    <h4>
                      <FormattedMessage
                        id="app.assignment.syncRequired"
                        defaultMessage="The exercise was updated!"
                      />
                    </h4>
                    <div>
                      <FormattedMessage
                        id="app.assignment.syncDescription"
                        defaultMessage="The exercise for this assignment was updated in following categories:"
                      />
                      <ul>
                        {!assignment.exerciseSynchronizationInfo.exerciseConfig
                          .upToDate &&
                          <li>
                            <FormattedMessage
                              id="app.assignment.syncExerciseConfig"
                              defaultMessage="Exercise configuration"
                            />
                          </li>}
                        {!assignment.exerciseSynchronizationInfo
                          .exerciseEnvironmentConfigs.upToDate &&
                          <li>
                            <FormattedMessage
                              id="app.assignment.syncExerciseEnvironmentConfigs"
                              defaultMessage="Environment configuration"
                            />
                          </li>}
                        {!assignment.exerciseSynchronizationInfo.hardwareGroups
                          .upToDate &&
                          <li>
                            <FormattedMessage
                              id="app.assignment.syncHardwareGroups"
                              defaultMessage="Hardware groups"
                            />
                          </li>}
                        {!assignment.exerciseSynchronizationInfo.localizedTexts
                          .upToDate &&
                          <li>
                            <FormattedMessage
                              id="app.assignment.syncLocalizedTexts"
                              defaultMessage="Localized texts"
                            />
                          </li>}
                        {!assignment.exerciseSynchronizationInfo.limits
                          .upToDate &&
                          <li>
                            <FormattedMessage
                              id="app.assignment.syncLimits"
                              defaultMessage="Limits"
                            />
                          </li>}
                        {!assignment.exerciseSynchronizationInfo.scoreConfig
                          .upToDate &&
                          <li>
                            <FormattedMessage
                              id="app.assignment.syncScoreConfig"
                              defaultMessage="Score configuration"
                            />
                          </li>}
                        {!assignment.exerciseSynchronizationInfo.scoreCalculator
                          .upToDate &&
                          <li>
                            <FormattedMessage
                              id="app.assignment.syncScoreCalculator"
                              defaultMessage="Score calculator"
                            />
                          </li>}
                      </ul>
                    </div>
                    <p>
                      <Button bsStyle="primary" onClick={exerciseSync}>
                        <FormattedMessage
                          id="app.assignment.syncButton"
                          defaultMessage="Update this assignment"
                        />
                      </Button>
                    </p>
                  </Alert>
                </Col>
              </Row>}

            <Row>
              <Col lg={6}>
                {assignment.localizedTexts.length > 0 &&
                  <div>
                    <LocalizedTexts locales={assignment.localizedTexts} />
                  </div>}
              </Col>
              <ResourceRenderer resource={runtimeEnvironments}>
                {(...runtimes) =>
                  <Col lg={6}>
                    <AssignmentDetails
                      {...assignment}
                      isAfterFirstDeadline={this.isAfter(
                        assignment.firstDeadline
                      )}
                      isAfterSecondDeadline={this.isAfter(
                        assignment.secondDeadline
                      )}
                      canSubmit={canSubmit}
                      runtimeEnvironments={runtimes}
                      alreadySubmitted={submissions.count()}
                    />

                    {isStudentOf(assignment.groupId) &&
                      <div>
                        <p className="text-center">
                          <ResourceRenderer
                            loading={<SubmitSolutionButton disabled={true} />}
                            resource={canSubmit}
                          >
                            {canSubmit =>
                              <SubmitSolutionButton
                                onClick={init(assignment.id)}
                                disabled={!canSubmit}
                              />}
                          </ResourceRenderer>
                        </p>
                        <SubmitSolutionContainer
                          userId={userId}
                          id={assignment.id}
                          onSubmit={submitSolution}
                          onReset={init}
                          isOpen={submitting}
                          runtimeEnvironments={runtimes}
                        />
                      </div>}

                    {(isStudentOf(assignment.groupId) ||
                      isSupervisorOf(assignment.groupId) ||
                      isSuperAdmin) &&
                      <SubmissionsTable
                        title={
                          <FormattedMessage
                            id="app.submissionsTable.title"
                            defaultMessage="Submitted solutions"
                          />
                        }
                        userId={userId}
                        submissions={this.sortSubmissions(submissions)}
                        assignmentId={assignment.id}
                      />}
                  </Col>}
              </ResourceRenderer>
            </Row>
          </div>}
      </Page>
    );
  }
}

Assignment.propTypes = {
  userId: PropTypes.string.isRequired,
  loggedInUserId: PropTypes.string,
  params: PropTypes.shape({
    assignmentId: PropTypes.string.isRequired
  }),
  isSuperAdmin: PropTypes.bool,
  isStudentOf: PropTypes.func.isRequired,
  isSupervisorOf: PropTypes.func.isRequired,
  assignment: PropTypes.object,
  canSubmit: ImmutablePropTypes.map,
  submitting: PropTypes.bool.isRequired,
  init: PropTypes.func.isRequired,
  loadAsync: PropTypes.func.isRequired,
  links: PropTypes.object.isRequired,
  runtimeEnvironments: PropTypes.array,
  exerciseSync: PropTypes.func.isRequired,
  submissions: ImmutablePropTypes.list.isRequired
};

export default withLinks(
  connect(
    (state, { params: { assignmentId, userId } }) => {
      const assignmentSelector = getAssignment(assignmentId);
      const environments = runtimeEnvironmentsSelector(assignmentId)(
        state
      ).toJS();
      const loggedInUserId = loggedInUserIdSelector(state);
      userId = userId || loggedInUserId;
      return {
        assignment: assignmentSelector(state),
        submitting: isSubmitting(state),
        runtimeEnvironments: environments.map(i =>
          runtimeEnvironmentSelector(i)(state)
        ),
        userId,
        loggedInUserId,
        isSuperAdmin: isLoggedAsSuperAdmin(state),
        isStudentOf: groupId => isStudentOf(loggedInUserId, groupId)(state),
        isSupervisorOf: groupId =>
          isSupervisorOf(loggedInUserId, groupId)(state),
        canSubmit: canSubmitSolution(assignmentId)(state),
        submissions: getUserSubmissions(userId, assignmentId)(state)
      };
    },
    (dispatch, { params: { assignmentId, userId } }) => ({
      init: userId => () => dispatch(init(userId, assignmentId)),
      loadAsync: userId =>
        Assignment.loadAsync({ assignmentId }, dispatch, userId),
      exerciseSync: () => dispatch(syncWithExercise(assignmentId))
    })
  )(Assignment)
);
