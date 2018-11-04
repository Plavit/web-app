import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { FormattedMessage, injectIntl } from 'react-intl';
import { defaultMemoize } from 'reselect';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

import { safeGet, EMPTY_ARRAY } from '../../../helpers/common';
import UsersName from '../../Users/UsersName';
import SortableTable from '../../widgets/SortableTable';
import withLinks from '../../../helpers/withLinks';
import { LocalizedExerciseName } from '../../helpers/LocalizedNames';
import { getLocalizedName } from '../../../helpers/localizedData';
import { compareAssignments } from '../../helpers/compareAssignments';
import { downloadString } from '../../../redux/helpers/api/download';
import Button from '../../widgets/FlatButton';
import { DownloadIcon } from '../../icons';

import styles from './ResultsTable.less';
import escapeString from '../../helpers/escapeString';

const getIndexedAssignments = defaultMemoize(assignments => {
  const res = {};
  assignments.forEach(a => (res[a.id] = a));
  return res;
});

// Functors for rendering cells of individual columns.
const cellRenderers = defaultMemoize((assignments, loggedUser, locale) => ({
  // default renderer is used for all assignment points
  '': (points, idx, key, row) =>
    <OverlayTrigger
      placement="bottom"
      overlay={
        <Tooltip id={`results-table-cell-${row.user.id}-${idx}`}>
          {row.user.name.firstName} {row.user.name.lastName}
          {', '}
          {assignments[key] && getLocalizedName(assignments[key], locale)}
        </Tooltip>
      }
    >
      <span>
        {points && Number.isInteger(points.gained)
          ? <span>
              {points.gained}
              {points.bonus > 0 &&
                <span className={styles.bonusPoints}>
                  +{points.bonus}
                </span>}
              {points.bonus < 0 &&
                <span className={styles.malusPoints}>
                  {points.bonus}
                </span>}
            </span>
          : '-'}
      </span>
    </OverlayTrigger>,
  user: user =>
    user &&
    <UsersName
      {...user}
      currentUserId={loggedUser.id}
      useGravatar={loggedUser.privateData.settings.useGravatar}
      showEmail="icon"
    />,
  total: points =>
    <strong>
      {points ? `${points.gained}/${points.total}` : '-/-'}
    </strong>,
  buttons: btns => btns // identity for buttons prevents using default (points) renderer
}));

// Per-col styling for the table
const tableStyles = {
  '': { className: 'text-center' },
  user: { className: 'text-left' },
  buttons: { className: 'text-right' }
};

// Create comparators object based on given locale ...
const prepareTableComparators = defaultMemoize(locale => {
  const nameComparator = (u1, u2) =>
    u1.name.lastName.localeCompare(u2.name.lastName, locale) ||
    u1.name.firstName.localeCompare(u2.name.firstName, locale) ||
    u1.privateData.email.localeCompare(u2.privateData.email, locale);
  return {
    user: ({ user: u1 }, { user: u2 }) => nameComparator(u1, u2),
    total: ({ total: t1, user: u1 }, { total: t2, user: u2 }) =>
      (Number(t2 && t2.gained) || -1) - (Number(t1 && t1.gained) || -1) ||
      nameComparator(u1, u2)
  };
});

// Prepare data in CSV format
const getCSVValues = (assignments, data, locale) => {
  const QUOTE = '"';
  const SEPARATOR = ';';
  const NEWLINE = '\n';
  let result = [];

  const enquote = string => `${QUOTE}${string}${QUOTE}`;

  let header = [
    enquote('userName'),
    enquote('userEmail'),
    enquote('totalPoints')
  ];
  assignments.forEach(assignment => {
    header.push(
      enquote(`${escapeString(getLocalizedName(assignment, locale))}`)
    );
  });
  result.push(header);

  data.forEach(item => {
    let row = [
      enquote(`${escapeString(item.user.fullName)}`),
      item.user.privateData
        ? enquote(`${escapeString(item.user.privateData.email)}`)
        : '',
      item.total.gained
    ];
    assignments.forEach(assignment => {
      if (!Number.isInteger(item[assignment.id].gained)) {
        row.push('');
      } else {
        const gainedPoints = item[assignment.id].gained;
        const bonusPoints = item[assignment.id].bonus;
        if (Number.isInteger(bonusPoints)) {
          if (bonusPoints > 0) {
            row.push(`${gainedPoints}+${bonusPoints}`);
          } else if (bonusPoints < 0) {
            row.push(`${gainedPoints}${bonusPoints}`); // minus sign comes with the bonusPoints value
          } else {
            row.push(gainedPoints);
          }
        }
      }
    });
    result.push(row);
  });

  // get string from arrays
  return result.map(row => row.join(SEPARATOR)).join(NEWLINE);
};

class ResultsTable extends Component {
  // Prepare header descriptor object for SortableTable.
  prepareHeader = defaultMemoize(assignments => {
    const {
      isAdmin,
      isSupervisor,
      links: { ASSIGNMENT_STATS_URI_FACTORY, ASSIGNMENT_DETAIL_URI_FACTORY }
    } = this.props;
    const header = {
      user: <FormattedMessage id="generic.name" defaultMessage="Name" />
    };

    assignments.sort(compareAssignments).forEach(
      assignment =>
        (header[assignment.id] = (
          <div className={styles.verticalText}>
            <div>
              <Link
                to={
                  isAdmin || isSupervisor
                    ? ASSIGNMENT_STATS_URI_FACTORY(assignment.id)
                    : ASSIGNMENT_DETAIL_URI_FACTORY(assignment.id)
                }
              >
                <LocalizedExerciseName entity={assignment} />
              </Link>
            </div>
          </div>
        ))
    );

    header.total = (
      <FormattedMessage id="app.resultsTable.total" defaultMessage="Total" />
    );

    if (isAdmin) {
      header.buttons = '';
    }
    return header;
  });

  // Prepare header suffix row with assignment max points
  prepareHeaderMaxPoints = defaultMemoize(assignments => {
    const { isAdmin } = this.props;

    return (
      <tr className={styles.maxPointsRow}>
        <th>
          <FormattedMessage
            id="app.groupResultsTable.maxPointsRow"
            defaultMessage="Max points:"
          />
        </th>
        {assignments.map(assignment =>
          <th key={assignment.id}>
            {assignment.maxPointsBeforeFirstDeadline}
            {Boolean(assignment.maxPointsBeforeSecondDeadline) &&
              ` / ${assignment.maxPointsBeforeSecondDeadline}`}
          </th>
        )}
        <th />
        {isAdmin && <th />}
      </tr>
    );
  });

  // Re-format the data, so they can be rendered by the SortableTable ...
  prepareData = defaultMemoize((assignments, users, stats) => {
    const {
      isAdmin,
      isSupervisor,
      loggedUser,
      publicStats,
      renderActions
    } = this.props;

    if (!isAdmin && !isSupervisor && !publicStats) {
      users = users.filter(({ id }) => id === loggedUser.id);
    }

    return users.map(user => {
      const userStats = stats.find(stat => stat.userId === user.id);
      const data = {
        id: user.id,
        user: user,
        total: userStats && userStats.points,
        buttons: renderActions && isAdmin ? renderActions(user.id) : ''
      };
      assignments.forEach(assignment => {
        const assignmentStats = safeGet(userStats, [
          'assignments',
          a => a.id === assignment.id,
          'points'
        ]);
        data[assignment.id] = assignmentStats || {};
      });
      return data;
    });
  });

  render() {
    const {
      assignments = EMPTY_ARRAY,
      users = EMPTY_ARRAY,
      loggedUser,
      stats,
      isAdmin,
      isSupervisor,
      groupName,
      intl: { locale }
    } = this.props;
    return (
      <React.Fragment>
        <SortableTable
          hover
          header={this.prepareHeader(assignments)}
          headerSuffixRow={this.prepareHeaderMaxPoints(assignments)}
          comparators={prepareTableComparators(locale)}
          defaultOrder="user"
          styles={tableStyles}
          cellRenderers={cellRenderers(
            getIndexedAssignments(assignments),
            loggedUser,
            locale
          )}
          data={this.prepareData(assignments, users, stats)}
          empty={
            <div className="text-center text-muted">
              <FormattedMessage
                id="app.groupResultsTableRow.noStudents"
                defaultMessage="There are currently no students in the group."
              />
            </div>
          }
        />
        {(isAdmin || isSupervisor) &&
          <Button
            bsStyle="primary"
            className={styles.downloadButton}
            onClick={() =>
              downloadString(
                `${groupName}.csv`,
                getCSVValues(
                  assignments,
                  this.prepareData(assignments, users, stats),
                  locale
                ),
                'text/csv;charset=utf-8',
                true // add BOM
              )}
          >
            <DownloadIcon gapRight />
            <FormattedMessage
              id="app.groupResultsTable.downloadCSV"
              defaultMessage="Download results as CSV"
            />
          </Button>}
      </React.Fragment>
    );
  }
}

ResultsTable.propTypes = {
  assignments: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
  loggedUser: PropTypes.object.isRequired,
  stats: PropTypes.array.isRequired,
  publicStats: PropTypes.bool,
  isAdmin: PropTypes.bool,
  isSupervisor: PropTypes.bool,
  renderActions: PropTypes.func,
  groupName: PropTypes.string.isRequired,
  intl: PropTypes.shape({ locale: PropTypes.string.isRequired }).isRequired,
  links: PropTypes.object
};

export default withLinks(injectIntl(ResultsTable));
