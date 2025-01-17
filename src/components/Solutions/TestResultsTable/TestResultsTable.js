import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import prettyMs from 'pretty-ms';

import Button from '../../widgets/TheButton';
import { prettyPrintBytes } from '../../helpers/stringFormatters';
import exitCodeMapping from '../../helpers/exitCodeMapping';
import Icon, { SuccessOrFailureIcon, SuccessIcon, FailureIcon } from '../../icons';

import styles from './TestResultsTable.less';

const hasValue = value => value !== null;

const tickOrCrossAndRatioOrValue = (isOK, ratio, value, pretty, multiplier) => (
  <span
    className={classnames({
      'text-center': true,
      'text-success': isOK,
      'text-danger': !isOK,
    })}>
    <SuccessOrFailureIcon success={isOK} smallGapRight />
    <small>
      {hasValue(value) && '('}
      {(ratio || ratio === 0) && (
        <FormattedNumber value={ratio} style="percent" minimumFractionDigits={1} maximumFactionDigits={3} />
      )}
      {hasValue(value) && ') '}
      {hasValue(value) && pretty(value * multiplier)}
    </small>
  </span>
);

const showTimeResults = (wallTime, wallTimeRatio, wallTimeExceeded, cpuTime, cpuTimeRatio, cpuTimeExceeded) => {
  const showWall = Boolean(wallTimeRatio) || (wallTimeExceeded && !cpuTimeExceeded);
  const showCpu = Boolean(cpuTimeRatio) || cpuTimeExceeded || !showWall;
  return (
    <table style={{ display: 'inline-block' }}>
      <tbody>
        {showCpu && (
          <tr>
            <td className="text-muted p-0">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="wall-time-icon">
                    <FormattedMessage
                      id="app.submissions.testResultsTable.cpuTimeExplain"
                      defaultMessage="CPU time (total time the CPU was used by all threads)"
                    />
                  </Tooltip>
                }>
                <Icon icon="microchip" gapRight />
              </OverlayTrigger>
            </td>
            <td className="text-left p-0 text-nowrap">
              {tickOrCrossAndRatioOrValue(cpuTimeExceeded === false, cpuTimeRatio, cpuTime, prettyMs, 1000)}
            </td>
          </tr>
        )}
        {showWall && (
          <tr>
            <td className="text-muted p-0">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="wall-time-icon">
                    <FormattedMessage
                      id="app.submissions.testResultsTable.wallTimeExplain"
                      defaultMessage="Wall time (real-time measured by external clock)"
                    />
                  </Tooltip>
                }>
                <Icon icon={['far', 'clock']} gapRight />
              </OverlayTrigger>
            </td>
            <td className="text-left p-0 text-nowrap">
              {tickOrCrossAndRatioOrValue(wallTimeExceeded === false, wallTimeRatio, wallTime, prettyMs, 1000)}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

class TestResultsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  isLogOpen = testName => Boolean(this.state[testName]);

  toggleLogOpen = testName => {
    this.setState({ [testName]: !this.isLogOpen(testName) });
  };

  setAllLogsState = open => () => {
    const { results } = this.props;
    results.forEach(({ testName, judgeLogStdout, judgeLogStderr }) => {
      if (judgeLogStdout || judgeLogStderr) {
        this.setState({ [testName]: open });
      }
    });
  };

  renderRow = ({
    testName,
    score,
    status,
    memoryExceeded,
    wallTimeExceeded,
    cpuTimeExceeded,
    memoryRatio,
    wallTimeRatio,
    cpuTimeRatio,
    memory,
    wallTime,
    cpuTime,
    exitCode,
    exitSignal,
    judgeLogStdout = '',
    judgeLogStderr = '',
  }) => {
    const { runtimeEnvironmentId, showJudgeLogStdout = false, showJudgeLogStderr = false } = this.props;
    return (
      <tr key={testName}>
        <td>
          <strong>{testName}</strong>
        </td>
        <td
          className={classnames({
            'text-center': true,
            'text-success': score === 1,
            'text-danger': score === 0,
            'text-warning': score < 1 && score > 0,
          })}>
          <b>
            <FormattedNumber value={score} style="percent" />
          </b>
        </td>
        <td className="text-center">
          <b>
            {status === 'OK' && (
              <span className="text-success">
                <FormattedMessage id="app.submissions.testResultsTable.statusOK" defaultMessage="OK" />
              </span>
            )}
            {status === 'SKIPPED' && (
              <span className="text-warning">
                <FormattedMessage id="app.submissions.testResultsTable.statusSkipped" defaultMessage="SKIPPED" />
              </span>
            )}
            {status === 'FAILED' && (
              <span className="text-danger">
                <FormattedMessage id="app.submissions.testResultsTable.statusFailed" defaultMessage="FAILED" />
              </span>
            )}
          </b>
        </td>

        <td className="text-center text-nowrap">
          {tickOrCrossAndRatioOrValue(memoryExceeded === false, memoryRatio, memory, prettyPrintBytes, 1024)}
        </td>
        <td className="text-center">
          {showTimeResults(wallTime, wallTimeRatio, wallTimeExceeded, cpuTime, cpuTimeRatio, cpuTimeExceeded)}
        </td>

        <td className="text-center">
          {Boolean(exitSignal) && (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="signal">
                  <FormattedMessage
                    id="app.submissions.testResultsTable.signalTooltip"
                    defaultMessage="Process terminated by signal"
                  />
                </Tooltip>
              }>
              <strong>
                <Icon icon="satellite-dish" className="text-danger" gapRight />
                {exitSignal}
                {exitCode !== -1 && <br />}
              </strong>
            </OverlayTrigger>
          )}
          {(exitCode !== -1 || !exitSignal) && exitCodeMapping(runtimeEnvironmentId, exitCode)}
        </td>

        {(showJudgeLogStdout || showJudgeLogStderr) && (
          <td className="text-right">
            {((judgeLogStdout && showJudgeLogStdout) || (judgeLogStderr && showJudgeLogStderr)) && (
              <Button
                variant={this.isLogOpen(testName) ? 'warning' : 'primary'}
                size="xs"
                onClick={() => this.toggleLogOpen(testName)}>
                {this.isLogOpen(testName) ? (
                  <FormattedMessage id="app.submissions.testResultsTable.hideLog" defaultMessage="Hide Log" />
                ) : (
                  <FormattedMessage id="app.submissions.testResultsTable.showLog" defaultMessage="Show Log" />
                )}
              </Button>
            )}
          </td>
        )}
      </tr>
    );
  };

  renderLog = ({ testName, judgeLogStdout = '', judgeLogStderr = '' }) => {
    const {
      showJudgeLogStdout = false,
      showJudgeLogStderr = false,
      isJudgeLogStdoutPublic = null,
      isJudgeLogStderrPublic = null,
      isJudgeLogMerged = true,
    } = this.props;
    return (
      <tr key={`${testName}-log`}>
        <td colSpan={7} className={styles.logWrapper}>
          <table className={styles.logWrapper}>
            <tbody>
              {judgeLogStdout && showJudgeLogStdout && (
                <tr>
                  <td>
                    {!isJudgeLogMerged && (
                      <small className="text-muted">
                        <FormattedMessage
                          id="app.submissions.testResultsTable.primaryLog"
                          defaultMessage="Primary Log"
                        />
                        {isJudgeLogStdoutPublic === false && (
                          <strong>
                            {' '}
                            (
                            <FormattedMessage
                              id="app.submissions.testResultsTable.logIsPrivate"
                              defaultMessage="not visible to students"
                            />
                            )
                          </strong>
                        )}
                        :
                      </small>
                    )}
                    <pre className={styles.log}>{judgeLogStdout}</pre>
                  </td>
                </tr>
              )}

              {judgeLogStderr && showJudgeLogStderr && !isJudgeLogMerged && (
                <tr>
                  <td>
                    {!isJudgeLogMerged && (
                      <small className="text-muted">
                        <FormattedMessage
                          id="app.submissions.testResultsTable.secondaryLog"
                          defaultMessage="Secondary Log"
                        />
                        {isJudgeLogStderrPublic === false && (
                          <strong>
                            {' '}
                            (
                            <FormattedMessage
                              id="app.submissions.testResultsTable.logIsPrivate"
                              defaultMessage="not visible to students"
                            />
                            )
                          </strong>
                        )}
                        :
                      </small>
                    )}
                    <pre className={styles.log}>{judgeLogStderr}</pre>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </td>
      </tr>
    );
  };

  render() {
    const { results, showJudgeLogStdout = false, showJudgeLogStderr = false, isJudgeLogMerged = true } = this.props;
    const showLogButton =
      (showJudgeLogStdout || showJudgeLogStderr) &&
      results.reduce(
        (out, { judgeLogStdout = '', judgeLogStderr = '' }) =>
          out ||
          (Boolean(judgeLogStdout) && showJudgeLogStdout) ||
          (Boolean(judgeLogStderr) && showJudgeLogStderr && !isJudgeLogMerged),
        false
      );
    const allLogsClosed =
      showLogButton && results.reduce((out, { testName }) => out && !this.isLogOpen(testName), true);

    return (
      <Table responsive>
        <thead>
          <tr>
            <th />
            <th className="text-center text-nowrap text-muted">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="status">
                    <FormattedMessage
                      id="app.submissions.testResultsTable.overallTestResult"
                      defaultMessage="Overall test result"
                    />
                  </Tooltip>
                }>
                <span>
                  <SuccessIcon smallGapRight className="text-muted" />/
                  <FailureIcon smallGapLeft className="text-muted" />
                </span>
              </OverlayTrigger>
            </th>
            <th className="text-center text-nowrap text-muted">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="correctness">
                    <FormattedMessage
                      id="app.submissions.testResultsTable.correctness"
                      defaultMessage="Correctness of the result (verdict of the judge)"
                    />
                  </Tooltip>
                }>
                <Icon icon="balance-scale" />
              </OverlayTrigger>
            </th>
            <th className="text-center text-nowrap text-muted">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="memoryExceeded">
                    <FormattedMessage
                      id="app.submissions.testResultsTable.memoryExceeded"
                      defaultMessage="Measured memory utilization"
                    />
                  </Tooltip>
                }>
                <span>
                  <Icon icon="thermometer-half" gapRight />
                  <Icon icon="memory" />
                </span>
              </OverlayTrigger>
            </th>
            <th className="text-center text-nowrap text-muted">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="timeExceeded">
                    <FormattedMessage
                      id="app.submissions.testResultsTable.timeExceeded"
                      defaultMessage="Measured execution time"
                    />
                  </Tooltip>
                }>
                <span>
                  <Icon icon="thermometer-half" gapRight />
                  <Icon icon="running" />
                </span>
              </OverlayTrigger>
            </th>
            <th className="text-center text-nowrap text-muted">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="exitCode">
                    <FormattedMessage
                      id="app.submissions.testResultsTable.exitCode"
                      defaultMessage="Exit code (possibly translated into error message if translation is available)"
                    />
                  </Tooltip>
                }>
                <Icon icon="power-off" />
              </OverlayTrigger>
            </th>
            {(showJudgeLogStdout || (showJudgeLogStderr && !isJudgeLogMerged)) && (
              <th className="text-right">
                {showLogButton && (
                  <Button
                    variant={allLogsClosed ? 'primary' : 'warning'}
                    size="xs"
                    onClick={this.setAllLogsState(allLogsClosed)}>
                    {allLogsClosed ? (
                      <FormattedMessage id="generic.showAll" defaultMessage="Show All" />
                    ) : (
                      <FormattedMessage id="generic.hideAll" defaultMessage="Hide All" />
                    )}
                  </Button>
                )}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {results.map(result =>
            this.isLogOpen(result.testName) ? [this.renderRow(result), this.renderLog(result)] : this.renderRow(result)
          )}
        </tbody>
      </Table>
    );
  }
}

TestResultsTable.propTypes = {
  results: PropTypes.arrayOf(
    PropTypes.shape({
      testName: PropTypes.string,
    })
  ).isRequired,
  runtimeEnvironmentId: PropTypes.string,
  showJudgeLogStdout: PropTypes.bool,
  showJudgeLogStderr: PropTypes.bool,
  isJudgeLogStdoutPublic: PropTypes.bool,
  isJudgeLogStderrPublic: PropTypes.bool,
  isJudgeLogMerged: PropTypes.bool,
};

export default TestResultsTable;
