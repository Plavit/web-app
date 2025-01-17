import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Row, Col } from 'react-bootstrap';

import Button from '../../../widgets/TheButton';
import Callout from '../../../widgets/Callout';
import DateTime from '../../../widgets/DateTime';
import Explanation from '../../../widgets/Explanation';

const syncMessages = {
  supplementaryFiles: (
    <FormattedMessage id="app.assignment.syncSupplementaryFiles" defaultMessage="Supplementary files" />
  ),
  attachmentFiles: <FormattedMessage id="app.assignment.syncAttachmentFiles" defaultMessage="Text attachment files" />,
  exerciseTests: <FormattedMessage id="app.assignment.syncExerciseTests" defaultMessage="Exercise tests" />,
  localizedTexts: <FormattedMessage id="app.assignment.syncLocalizedTexts" defaultMessage="Localized texts" />,
  configurationType: (
    <FormattedMessage
      id="app.assignment.syncConfigurationType"
      defaultMessage="Configuration was switched to advanced mode"
    />
  ),
  scoreConfig: <FormattedMessage id="app.assignment.syncScoreConfig" defaultMessage="Score configuration" />,
  exerciseConfig: <FormattedMessage id="app.assignment.syncExerciseConfig" defaultMessage="Exercise configuration" />,
  runtimeEnvironments: (
    <FormattedMessage id="app.assignment.syncRuntimeEnvironments" defaultMessage="Selection of runtime environments" />
  ),
  exerciseEnvironmentConfigs: (
    <FormattedMessage id="app.assignment.syncExerciseEnvironmentConfigs" defaultMessage="Environment configuration" />
  ),
  hardwareGroups: <FormattedMessage id="app.assignment.syncHardwareGroups" defaultMessage="Hardware groups" />,
  limits: <FormattedMessage id="app.assignment.syncLimits" defaultMessage="Limits" />,
  mergeJudgeLogs: (
    <span>
      <FormattedMessage id="app.assignment.syncMergeJudgeLogs" defaultMessage="Judge logs merge flag" />
      <Explanation id="syncMergeJudgeLogs">
        <FormattedMessage
          id="app.exercise.mergeJudgeLogsExplanation"
          defaultMessage="The merge flag indicates whether primary (stdout) and secondary (stderr) judge logs are are concatenated in one log (which should be default for built-in judges). If the logs are separated, the visibility of each part may be controlled idividually in assignments. That might be helpful if you need to pass two separate logs from a custom judge (e.g., one is for students and one is for supervisors)."
        />
      </Explanation>
    </span>
  ),
};

const getSyncMessages = syncInfo => {
  const res = [];
  for (const field in syncMessages) {
    if (!syncInfo[field]) {
      continue;
    }

    if (!syncInfo[field].upToDate) {
      res.push(<li key={field}>{syncMessages[field]}</li>);
    }
  }
  return res;
};

const AssignmentSync = ({ syncInfo, exerciseSync }) => {
  const messages = getSyncMessages(syncInfo);
  return messages.length > 0 ? (
    <Row>
      <Col sm={12}>
        <Callout variant="warning">
          <h4>
            <FormattedMessage
              id="app.assignment.syncRequiredTitle"
              defaultMessage="The exercise data are newer than assignment data"
              values={{
                exerciseUpdated: <DateTime unixts={syncInfo.updatedAt.exercise} emptyPlaceholder="??" />,
                assignmentUpdated: <DateTime unixts={syncInfo.updatedAt.assignment} emptyPlaceholder="??" />,
              }}
            />
          </h4>
          <p>
            <FormattedMessage
              id="app.assignment.syncRequired"
              defaultMessage="Exercise was updated <strong>{exerciseUpdated}</strong>, but the assignment was last updated <strong>{assignmentUpdated}</strong>!"
              values={{
                exerciseUpdated: <DateTime unixts={syncInfo.updatedAt.exercise} emptyPlaceholder="??" />,
                assignmentUpdated: <DateTime unixts={syncInfo.updatedAt.assignment} emptyPlaceholder="??" />,
                strong: contents => <strong>{contents}</strong>,
              }}
            />
          </p>
          <div>
            <FormattedMessage
              id="app.assignment.syncDescription"
              defaultMessage="The following sections were updated:"
            />
            <ul>{messages}</ul>
          </div>
          <p>
            <Button variant="primary" onClick={exerciseSync} disabled={!syncInfo.isSynchronizationPossible}>
              <FormattedMessage id="app.assignment.syncButton" defaultMessage="Update Assignment" />
            </Button>

            {!syncInfo.isSynchronizationPossible && (
              <span style={{ marginLeft: '2em' }} className="text-muted">
                <FormattedMessage
                  id="app.assignment.syncButton.exerciseBroken"
                  defaultMessage="The update button is disabled since the exercise is broken. The exercise configuration must be mended first."
                />
              </span>
            )}
          </p>
        </Callout>
      </Col>
    </Row>
  ) : (
    <div />
  );
};

AssignmentSync.propTypes = {
  syncInfo: PropTypes.object.isRequired,
  exerciseSync: PropTypes.func.isRequired,
};

export default AssignmentSync;
