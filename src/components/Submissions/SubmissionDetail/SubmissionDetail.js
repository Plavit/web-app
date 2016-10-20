import React, { PropTypes } from 'react';
import Icon from 'react-fontawesome';
import classnames from 'classnames';
import { FormattedMessage, FormattedNumber, FormattedDate, FormattedTime } from 'react-intl';
import { Table, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router';

import { isReady, isLoading, hasFailed } from '../../../redux/helpers/resourceManager';

import Box from '../../AdminLTE/Box';
import { LoadingIcon, MaybeSucceededIcon } from '../../Icons';
import SourceCodeInfoBox from '../../SourceCodeInfoBox';
import AssignmentDetails, {
  LoadingAssignmentDetails,
  FailedAssignmentDetails
} from '../../Assignments/Assignment/AssignmentDetails';
import AssignmentStatusIcon from '../../Assignments/Assignment/AssignmentStatusIcon';
import TestResultsTable from '../TestResultsTable';
import BonusPoints from '../../Assignments/SubmissionsTable/BonusPoints';
import CommentThreadContainer from '../../../containers/CommentThreadContainer';

const SubmissionDetail = ({
  assignmentId,
  id,
  note = '',
  evaluationStatus,
  submittedAt,
  evaluation,
  maxPoints,
  assignment,
  files,
  onCloseSourceViewer,
  children
}, {
  links: { SOURCE_CODE_DETAIL_URI_FACTORY }
}) => (
  <div>
    <Row>
      <Col lg={4}>
        <Row>
          <Col lg={12} md={6} sm={12}>
            <Box
              title={<FormattedMessage id='app.submission.title' defaultMessage='Your solution' />}
              noPadding={true}
              collapsable={true}
              type={!evaluation ? undefined : (evaluation.isCorrect ? 'success' : 'danger')}
              isOpen={true}>
              <Table>
                <tbody>
                  {note.length > 0 &&
                    <tr>
                      <th><FormattedMessage id='app.submission.yourNote' defaultMessage='Your note:' /></th>
                      <td>{note}</td>
                    </tr>
                  }
                  <tr>
                    <th><FormattedMessage id='app.submission.submittedAt' defaultMessage='Submitted at:' /></th>
                    <td>
                      <FormattedDate value={submittedAt * 1000} />&nbsp;<FormattedTime value={submittedAt * 1000} />
                    </td>
                  </tr>
                  <tr>
                    <th><FormattedMessage id='app.submission.isCorrect' defaultMessage='Your solution is correct:' /></th>
                    <td>
                      <strong>
                        <AssignmentStatusIcon status={evaluationStatus} />{' '}
                        {evaluationStatus === 'done' &&
                          <FormattedMessage id='app.submission.evaluation.status.isCorrect' defaultMessage='Your solution is correct and meets all criteria.' />}
                        {evaluationStatus === 'work-in-progress' &&
                          <FormattedMessage id='app.submission.evaluation.status.workInProgress' defaultMessage='Your solution has not been evaluated yet.' />}
                        {evaluationStatus === 'failed' &&
                          <FormattedMessage id='app.submission.evaluation.status.failed' defaultMessage='Your solution does not meet the defined criteria.' />}
                        {evaluationStatus === 'evaluation-failed' &&
                          <FormattedMessage id='app.submission.evaluation.status.systemFailiure' defaultMessage={`Evaluation process had failed and your submission
                            could not have been evaluated. Please submit your solution once more. If you keep receiving errors please contact the administrator of this project.`} />}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Box>
          </Col>

          {evaluationStatus !== 'work-in-progress' && (
            <Col lg={12} md={6} sm={12}>
              <Box
                title={<FormattedMessage id='app.submission.evaluation.title.details' defaultMessage='Evaluation details' />}
                noPadding={true}
                collapsable={true}
                isOpen={true}>

                <Table>
                {!evaluation && (
                  <tbody>
                    <tr>
                      <td className='text-center' colSpan={2}>
                        <LoadingIcon />{' '} <FormattedMessage id='app.submission.evaluation.loading' defaultMessage="Loading results of your solution's evaluation" />}
                      </td>
                    </tr>
                  </tbody>
                )}

                {evaluation && (
                  <tbody>
                    <tr>
                      <th><FormattedMessage id='app.submission.evaluation.evaluatedAt' defaultMessage='Evaluated at:' /></th>
                      <td className='text-center'>
                        <FormattedDate value={evaluation.evaluatedAt * 1000} />&nbsp;<FormattedTime value={evaluation.evaluatedAt * 1000} />
                      </td>
                    </tr>

                    <tr>
                      <th><FormattedMessage id='app.submission.evaluation.beforeFirstDeadline' defaultMessage='Was submitted before the deadline:' /></th>
                      <td className='text-center'>
                        {isReady(assignment) && (
                          submittedAt < assignment.getIn(['data', 'deadline', 'first'])
                            ? <Icon name='check' className='text-success' />
                            : <Icon name='times' className='text-danger' />
                        )}
                      </td>
                    </tr>

                    {isReady(assignment) && submittedAt >= assignment.getIn(['data', 'deadline', 'first']) && (
                      <tr>
                        <th><FormattedMessage id='app.submission.evaluation.beforeSecondDeadline' defaultMessage='Was submitted before the second deadline:' /></th>
                        <td className='text-center'>
                          {isReady(assignment) && (
                            <MaybeSucceededIcon success={submittedAt < assignment.getIn(['data', 'deadline', 'second'])} />
                          )}
                        </td>
                      </tr>
                    )}

                    <tr>
                      <th><FormattedMessage id='app.submission.evaluation.hasFinished' defaultMessage='Evaluation process has finished:' /></th>
                      <td className='text-center'>
                        <MaybeSucceededIcon name={evaluation.evaluationFailed} />
                      </td>
                    </tr>

                    <tr>
                      <th><FormattedMessage id='app.submission.evaluation.isValid' defaultMessage='Evaluation is valid:' /></th>
                      <td className='text-center'>
                        <MaybeSucceededIcon success={evaluation.isValid} />
                      </td>
                    </tr>

                    <tr>
                      <th><FormattedMessage id='app.submission.evaluation.buildSucceeded' defaultMessage='Build succeeded:' /></th>
                      <td className='text-center'>
                        <MaybeSucceededIcon success={!evaluation.initFailed} />
                      </td>
                    </tr>

                    <tr>
                      <th><FormattedMessage id='app.submission.evaluation.isCorrect' defaultMessage='Is correct:' /></th>
                      <td className={
                        classnames({
                          'text-center': true,
                          'text-danger': !evaluation.isCorrect,
                          'text-success': evaluation.isCorrect
                        })
                      }>
                        <b><FormattedNumber style='percent' value={evaluation.score} /></b>
                      </td>
                    </tr>
                    <tr>
                      <th><FormattedMessage id='app.submission.evaluation.score' defaultMessage='Score:' /></th>
                      <td className={
                        classnames({
                          'text-center': true,
                          'text-danger': !evaluation.isCorrect && evaluation.bonusPoints === 0,
                          'text-success': evaluation.isCorrect && evaluation.bonusPoints === 0,
                          'text-bold': evaluation.bonusPoints === 0
                        })
                      }>
                        {evaluation.points}/{maxPoints}
                      </td>
                    </tr>
                    {evaluation.bonusPoints !== 0 && (
                      <tr>
                        <th><FormattedMessage id='app.submission.evaluation.bonusPoints' defaultMessage='Bonus points:' /></th>
                        <td className='text-center'>
                          <BonusPoints bonus={evaluation.bonusPoints} />
                        </td>
                      </tr>
                    )}
                    {evaluation.bonusPoints !== 0 && (
                      <tr>
                        <th><FormattedMessage id='app.submission.evaluation.totalScore' defaultMessage='Total score:' /></th>
                        <td className={
                          classnames({
                            'text-center': true,
                            'text-danger': !evaluation.isCorrect,
                            'text-success': evaluation.isCorrect
                          })
                        }>
                          <b>
                            {evaluation.points + evaluation.bonusPoints}/{maxPoints}
                          </b>
                        </td>
                      </tr>
                    )}
                  </tbody>
                )}
                </Table>
              </Box>
            </Col>
          )}
        </Row>
        <Row>
        {files.map(file => (
          <Col lg={12} sm={6} key={file.id}>
            <Link to={SOURCE_CODE_DETAIL_URI_FACTORY(assignmentId, id, file.id)}>
              <SourceCodeInfoBox {...file} />
            </Link>
          </Col>
        ))}
        </Row>
      </Col>
      <Col lg={8}>
        <Row>
          {evaluation && (
            <Col sm={6}>
              <Box
                title={<FormattedMessage id='app.submission.evaluation.title.testResults' defaultMessage='Test results' />}
                noPadding={true}
                collapsable={true}
                isOpen={true}>
                <TestResultsTable results={evaluation.testResults} />
              </Box>
              <CommentThreadContainer threadId={id} />
            </Col>
          )}
          <Col sm={6}>
            {isLoading(assignment) && <LoadingAssignmentDetails />}
            {hasFailed(assignment) && <FailedAssignmentDetails />}
            {isReady(assignment) && (
              <AssignmentDetails
                assignment={assignment.get('data').toJS()}
                isAfterFirstDeadline={assignment.getIn(['data', 'deadline', 'first']) * 1000 < Date.now()}
                isAfterSecondDeadline={assignment.getIn(['data', 'deadline', 'second']) * 1000 < Date.now()} />
            )}
          </Col>
        </Row>
      </Col>
    </Row>

    {children &&
      React.cloneElement(children, { show: !!children, onCloseSourceViewer })}
  </div>
);

SubmissionDetail.propTypes = {
  id: PropTypes.string.isRequired,
  note: PropTypes.string,
  submittedAt: PropTypes.number.isRequired,
  evaluation: PropTypes.object,
  maxPoints: PropTypes.number.isRequired
};

SubmissionDetail.contextTypes = {
  links: PropTypes.object
};

export default SubmissionDetail;
