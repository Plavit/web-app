import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { formValueSelector } from 'redux-form';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Row, Col } from 'react-bootstrap';

import {
  createGroup,
  fetchGroupIfNeeded,
  fetchAllGroups,
  addAdmin,
  addSupervisor,
  addObserver,
  removeMember,
} from '../../redux/modules/groups';
import { fetchByIds, fetchUser } from '../../redux/modules/users';
import { loggedInUserIdSelector } from '../../redux/selectors/auth';
import { isLoggedAsSuperAdmin } from '../../redux/selectors/users';
import { groupSelector, groupDataAccessorSelector, groupsSelector } from '../../redux/selectors/groups';
import {
  primaryAdminsOfGroupSelector,
  supervisorsOfGroupSelector,
  observersOfGroupSelector,
  studentsIdsOfGroup,
  loggedUserIsStudentOfSelector,
  loggedUserIsSupervisorOfSelector,
  loggedUserIsAdminOfSelector,
  pendingMembershipsSelector,
} from '../../redux/selectors/usersGroups';

import Page from '../../components/layout/Page';
import { GroupNavigation } from '../../components/layout/Navigation';
import GroupInfoTable, { LoadingGroupDetail, FailedGroupDetail } from '../../components/Groups/GroupDetail';
import SupervisorsList from '../../components/Users/SupervisorsList';
import LeaveJoinGroupButtonContainer from '../../containers/LeaveJoinGroupButtonContainer';
import { getLocalizedName, transformLocalizedTextsFormData } from '../../helpers/localizedData';
import { isReady } from '../../redux/helpers/resourceManager/index';
import Box from '../../components/widgets/Box';
import Callout from '../../components/widgets/Callout';
import GroupsTreeContainer from '../../containers/GroupsTreeContainer';
import EditGroupForm, { EDIT_GROUP_FORM_EMPTY_INITIAL_VALUES } from '../../components/forms/EditGroupForm';
import AddSupervisor from '../../components/Groups/AddSupervisor';
import { BanIcon, GroupIcon } from '../../components/icons';
import { hasPermissions, hasOneOfPermissions, safeGet } from '../../helpers/common';
import GroupArchivedWarning from '../../components/Groups/GroupArchivedWarning/GroupArchivedWarning';

import withLinks from '../../helpers/withLinks';

class GroupInfo extends Component {
  static loadAsync = ({ groupId }, dispatch) =>
    dispatch(fetchGroupIfNeeded(groupId))
      .then(res => res.value)
      .then(group =>
        Promise.all([
          dispatch(fetchByIds(safeGet(group, ['primaryAdminsIds']) || [])),
          dispatch(fetchByIds(safeGet(group, ['privateData', 'supervisors']) || [])),
          dispatch(fetchByIds(safeGet(group, ['privateData', 'observers']) || [])),
        ])
      );

  componentDidMount = () => this.props.loadAsync();

  componentDidUpdate(prevProps) {
    if (this.props.match.params.groupId !== prevProps.match.params.groupId) {
      this.props.loadAsync();
      return;
    }

    if (isReady(this.props.group) && isReady(prevProps.group)) {
      const newData = this.props.group.toJS().data.privateData;
      const prevData = prevProps.group.toJS().data.privateData;
      const groupJs = this.props.group.toJS();
      if (safeGet(prevData, ['primaryAdmins', 'length'], -1) !== safeGet(newData, ['primaryAdmins', 'length'], -1)) {
        this.props.refetchUsers(safeGet(groupJs, ['data', 'primaryAdminsIds']) || []);
      }
      if (safeGet(prevData, ['supervisors', 'length'], -1) !== safeGet(newData, ['supervisors', 'length'], -1)) {
        this.props.refetchUsers(safeGet(groupJs, ['data', 'privateData', 'supervisors']) || []);
      }
      if (safeGet(prevData, ['observers', 'length'], -1) !== safeGet(newData, ['observers', 'length'], -1)) {
        this.props.refetchUsers(safeGet(groupJs, ['data', 'privateData', 'observers']) || []);
      }
    }
  }

  render() {
    const {
      group,
      userId,
      groups,
      groupsAccessor,
      primaryAdmins = [],
      supervisors = [],
      observers = [],
      studentsIds = [],
      isAdmin,
      isSuperAdmin,
      isSupervisor,
      isStudent,
      addSubgroup,
      hasThreshold,
      pendingMemberships,
      addAdmin,
      addSupervisor,
      addObserver,
      removeMember,
      links: { GROUP_INFO_URI_FACTORY },
      intl: { locale },
    } = this.props;

    const isAdminOrSuperadmin = isAdmin || isSuperAdmin;

    return (
      <Page
        resource={group}
        icon={group => <GroupIcon organizational={group && group.organizational} archived={group && group.archived} />}
        title={<FormattedMessage id="app.groupInfo.title" defaultMessage="Group Details and Metadata" />}
        loading={<LoadingGroupDetail />}
        failed={<FailedGroupDetail />}>
        {data => (
          <div>
            <GroupNavigation
              groupId={data.id}
              canEdit={hasOneOfPermissions(data, 'update', 'archive', 'remove', 'relocate')}
              canViewDetail={hasPermissions(data, 'viewDetail')}
            />

            {!isAdmin &&
              !isSupervisor &&
              (data.public || (isStudent && !data.privateData.detaining)) &&
              !data.organizational && (
                <div className="my-3">
                  <LeaveJoinGroupButtonContainer userId={userId} groupId={data.id} size={null} redirectAfterLeave />
                </div>
              )}

            <GroupArchivedWarning {...data} groupsDataAccessor={groupsAccessor} linkFactory={GROUP_INFO_URI_FACTORY} />

            {!hasPermissions(data, 'viewDetail') && (
              <Row>
                <Col sm={12}>
                  <Callout variant="warning" className="larger" icon={<BanIcon />}>
                    <FormattedMessage
                      id="generic.accessDenied"
                      defaultMessage="You do not have permissions to see this page. If you got to this page via a seemingly legitimate link or button, please report a bug."
                    />
                  </Callout>
                </Col>
              </Row>
            )}

            <Row>
              <Col sm={6}>
                {hasPermissions(data, 'viewDetail') && (
                  <GroupInfoTable
                    group={data}
                    supervisors={supervisors}
                    isAdmin={isAdminOrSuperadmin}
                    groups={groups}
                    locale={locale}
                  />
                )}

                {hasPermissions(data, 'viewMembers') && (
                  <Box
                    noPadding
                    collapsable
                    unlimitedHeight
                    title={
                      <FormattedMessage
                        id="app.groupDetail.supervisors"
                        defaultMessage="Supervisors of {groupName}"
                        values={{
                          groupName: getLocalizedName(
                            {
                              name: data.name,
                              localizedTexts: data.localizedTexts,
                            },
                            locale
                          ),
                        }}
                      />
                    }>
                    <SupervisorsList
                      groupId={data.id}
                      primaryAdmins={primaryAdmins}
                      supervisors={supervisors}
                      observers={observers}
                      showButtons={isAdminOrSuperadmin && !data.archived}
                      isLoaded={
                        supervisors.length === data.privateData.supervisors.length &&
                        primaryAdmins.length === data.primaryAdminsIds.length
                      }
                      addAdmin={addAdmin}
                      addSupervisor={addSupervisor}
                      removeMember={removeMember}
                      addObserver={addObserver}
                      pendingMemberships={pendingMemberships}
                    />
                  </Box>
                )}

                {isAdminOrSuperadmin && !data.archived && (
                  <Box
                    title={
                      <FormattedMessage id="app.group.adminsView.addSupervisor" defaultMessage="Add Supervisor" />
                    }>
                    <AddSupervisor
                      instanceId={data.privateData.instanceId}
                      groupId={data.id}
                      primaryAdmins={primaryAdmins}
                      supervisors={supervisors}
                      observers={observers}
                      studentsIds={studentsIds}
                      addAdmin={addAdmin}
                      addSupervisor={addSupervisor}
                      addObserver={addObserver}
                      pendingMemberships={pendingMemberships}
                    />
                  </Box>
                )}
              </Col>
              <Col sm={6}>
                {hasPermissions(data, 'viewSubgroups') && (
                  <Box
                    title={<FormattedMessage id="app.groupDetail.subgroups" defaultMessage="Subgroups Hierarchy" />}
                    unlimitedHeight
                    extraPadding>
                    <GroupsTreeContainer
                      selectedGroupId={data.id}
                      showArchived={data.archived}
                      isExpanded
                      autoloadAuthors
                    />
                  </Box>
                )}

                {hasPermissions(data, 'addSubgroup') && !data.archived && (
                  <EditGroupForm
                    form="addSubgroup"
                    onSubmit={addSubgroup(data.privateData.instanceId, userId)}
                    initialValues={EDIT_GROUP_FORM_EMPTY_INITIAL_VALUES}
                    createNew
                    collapsable
                    isOpen={false}
                    hasThreshold={hasThreshold}
                    isSuperAdmin={isSuperAdmin}
                  />
                )}
              </Col>
            </Row>
          </div>
        )}
      </Page>
    );
  }
}

GroupInfo.propTypes = {
  match: PropTypes.shape({ params: PropTypes.shape({ groupId: PropTypes.string.isRequired }).isRequired }).isRequired,
  userId: PropTypes.string.isRequired,
  group: ImmutablePropTypes.map,
  groupsAccessor: PropTypes.func.isRequired,
  instance: ImmutablePropTypes.map,
  primaryAdmins: PropTypes.array,
  supervisors: PropTypes.array,
  observers: PropTypes.array,
  studentsIds: PropTypes.array,
  groups: ImmutablePropTypes.map,
  isAdmin: PropTypes.bool,
  isSupervisor: PropTypes.bool,
  isSuperAdmin: PropTypes.bool,
  isStudent: PropTypes.bool,
  addSubgroup: PropTypes.func,
  loadAsync: PropTypes.func,
  refetchUsers: PropTypes.func.isRequired,
  addAdmin: PropTypes.func.isRequired,
  addSupervisor: PropTypes.func.isRequired,
  addObserver: PropTypes.func.isRequired,
  removeMember: PropTypes.func.isRequired,
  hasThreshold: PropTypes.bool,
  pendingMemberships: ImmutablePropTypes.list,
  links: PropTypes.object,
  intl: PropTypes.shape({ locale: PropTypes.string.isRequired }).isRequired,
};

const addSubgroupFormSelector = formValueSelector('addSubgroup');

const mapStateToProps = (
  state,
  {
    match: {
      params: { groupId },
    },
  }
) => {
  const userId = loggedInUserIdSelector(state);

  return {
    group: groupSelector(state, groupId),
    userId,
    groups: groupsSelector(state),
    groupsAccessor: groupDataAccessorSelector(state),
    primaryAdmins: primaryAdminsOfGroupSelector(state, groupId),
    supervisors: supervisorsOfGroupSelector(state, groupId),
    observers: observersOfGroupSelector(state, groupId),
    studentsIds: studentsIdsOfGroup(groupId)(state),
    isSupervisor: loggedUserIsSupervisorOfSelector(state)(groupId),
    isAdmin: loggedUserIsAdminOfSelector(state)(groupId),
    isSuperAdmin: isLoggedAsSuperAdmin(state),
    isStudent: loggedUserIsStudentOfSelector(state)(groupId),
    hasThreshold: addSubgroupFormSelector(state, 'hasThreshold'),
    pendingMemberships: pendingMembershipsSelector(state, groupId),
  };
};

const mapDispatchToProps = (dispatch, { match: { params } }) => ({
  addSubgroup:
    (instanceId, userId) =>
    ({ localizedTexts, hasThreshold, threshold, makeMeAdmin, ...data }) =>
      dispatch(
        createGroup({
          ...data,
          hasThreshold,
          threshold: hasThreshold ? threshold : undefined,
          localizedTexts: transformLocalizedTextsFormData(localizedTexts),
          noAdmin: !makeMeAdmin, // inverted logic in API, user is added as admin by default
          instanceId,
          parentGroupId: params.groupId,
        })
      ).then(() => Promise.all([dispatch(fetchAllGroups()), dispatch(fetchUser(userId))])),
  loadAsync: () => GroupInfo.loadAsync(params, dispatch),
  refetchUsers: ids => dispatch(fetchByIds(ids)),
  addAdmin: (userId, groupId) => dispatch(addAdmin(userId, groupId)),
  addSupervisor: (userId, groupId) => dispatch(addSupervisor(userId, groupId)),
  addObserver: (userId, groupId) => dispatch(addObserver(userId, groupId)),
  removeMember: (userId, groupId) => dispatch(removeMember(userId, groupId)),
});

export default withLinks(connect(mapStateToProps, mapDispatchToProps)(injectIntl(GroupInfo)));
