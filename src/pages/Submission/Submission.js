import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Modal, Row, Col } from 'react-bootstrap';

import PageContent from '../../components/PageContent';
import ResourceRenderer from '../../components/ResourceRenderer';
import SubmissionDetail, {
  LoadingSubmissionDetail,
  FailedSubmissionDetail
} from '../../components/Submissions/SubmissionDetail';

import { isReady, getData } from '../../redux/helpers/resourceManager';
import { fetchAssignmentIfNeeded } from '../../redux/modules/assignments';
import { fetchSubmissionIfNeeded } from '../../redux/modules/submissions';
import { getSubmission } from '../../redux/selectors/submissions';
import { getAssignment } from '../../redux/selectors/assignments';

class Submission extends Component {

  componentWillMount() {
    this.props.loadAsync();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.params.submissionId !== newProps.params.submissionId) {
      newProps.loadAsync();
    }
  }

  closeSourceCodeViewer = () => {
    const { assignmentId, submissionId } = this.props.params;
    const { links: { SUBMISSION_DETAIL_URI_FACTORY } } = this.context;
    const link = SUBMISSION_DETAIL_URI_FACTORY(assignmentId, submissionId);
    this.context.router.push(link);
  };

  render() {
    const {
      assignment,
      submission,
      evaluation,
      params: { submissionId, assignmentId },
      children
    } = this.props;

    const {
      links: {
        GROUP_URI_FACTORY,
        ASSIGNMENT_DETAIL_URI_FACTORY
      }
    } = this.context;

    const title = (
      <ResourceRenderer resource={assignment}>
        {assignmentData => <span>{assignmentData.name}</span>}
      </ResourceRenderer>
    );

    return (
      <PageContent
        title={title}
        description={<FormattedMessage id='app.submission.evaluation.title' defaultMessage='Your solution evaluation' />}
        breadcrumbs={[
          { text: <FormattedMessage id='app.group.title' defaultMessage='Group detail' />, iconName: 'user', link: isReady(assignment) ? GROUP_URI_FACTORY(getData(assignment).groupId) : undefined },
          { text: <FormattedMessage id='app.assignment.title' defaultMessage='Exercise assignment' />, iconName: 'puzzle-piece', link: ASSIGNMENT_DETAIL_URI_FACTORY(assignmentId) },
          { text: <FormattedMessage id='app.submission.title' defaultMessage='Your solution' />, iconName: '' }
        ]}>
        <ResourceRenderer
          loading={<LoadingSubmissionDetail />}
          failed={<FailedSubmissionDetail />}
          resource={submission}>
          {data => (
            <SubmissionDetail
              {...data}
              assignmentId={assignmentId}
              assignment={assignment}
              onCloseSourceViewer={this.closeSourceCodeViewer}>
              {children}
            </SubmissionDetail>
          )}
        </ResourceRenderer>
      </PageContent>
    );
  }

}

Submission.contextTypes = {
  router: PropTypes.object,
  links: PropTypes.object
};

Submission.propTypes = {
  params: PropTypes.shape({
    assignmentId: PropTypes.string.isRequired,
    submissionId: PropTypes.string.isRequired
  }).isRequired,
  submission: PropTypes.object,
  loadAsync: PropTypes.func.isRequired
};

export default connect(
  (state, { params: { submissionId, assignmentId } }) => ({
    submission: getSubmission(submissionId)(state),
    assignment: getAssignment(assignmentId)(state)
  }),
  (dispatch, { params: { submissionId, assignmentId } }) => ({
    loadAsync: () => Promise.all([
      dispatch(fetchSubmissionIfNeeded(submissionId)),
      dispatch(fetchAssignmentIfNeeded(assignmentId))
    ])
  })
)(Submission);
