import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Row, Col, Form } from 'react-bootstrap';
import { connect } from 'react-redux';
import { reset, formValueSelector } from 'redux-form';
import { defaultMemoize } from 'reselect';

import Page from '../../components/layout/Page';
import { GroupNavigation } from '../../components/layout/Navigation';
import ResourceRenderer from '../../components/helpers/ResourceRenderer';
import EditGroupForm, { EDIT_GROUP_FORM_LOCALIZED_TEXTS_DEFAULT } from '../../components/forms/EditGroupForm';
import RelocateGroupForm, { getPossibleParentsOfGroup } from '../../components/forms/RelocateGroupForm';
import OrganizationalGroupButtonContainer from '../../containers/OrganizationalGroupButtonContainer';
import ArchiveGroupButtonContainer from '../../containers/ArchiveGroupButtonContainer';
import DeleteGroupButtonContainer from '../../containers/DeleteGroupButtonContainer';
import Box from '../../components/widgets/Box';
import Callout from '../../components/widgets/Callout';
import GroupArchivedWarning from '../../components/Groups/GroupArchivedWarning/GroupArchivedWarning';
import { BanIcon, InfoIcon, EditGroupIcon } from '../../components/icons';

import { fetchGroup, fetchGroupIfNeeded, editGroup, relocateGroup } from '../../redux/modules/groups';
import {
  groupSelector,
  canViewParentDetailSelector,
  notArchivedGroupsSelector,
  groupDataAccessorSelector,
} from '../../redux/selectors/groups';
import { loggedInUserIdSelector, selectedInstanceId } from '../../redux/selectors/auth';
import { isLoggedAsSuperAdmin } from '../../redux/selectors/users';
import { getLocalizedTextsInitialValues, transformLocalizedTextsFormData } from '../../helpers/localizedData';

import withLinks from '../../helpers/withLinks';
import { hasPermissions, hasOneOfPermissions } from '../../helpers/common';

const canRelocate = group => hasPermissions(group, 'relocate') && !group.archived;

const getRelocateFormInitialValues = defaultMemoize(group => ({ groupId: group.parentGroupId }));

class EditGroup extends Component {
  componentDidMount = () => this.props.loadAsync();

  componentDidUpdate(prevProps) {
    if (this.props.match.params.groupId !== prevProps.match.params.groupId) {
      this.props.reset();
      this.props.loadAsync();
    }
  }

  getInitialValues = defaultMemoize(
    ({ localizedTexts, externalId, public: isPublic, privateData: { publicStats, threshold, detaining } }) => ({
      localizedTexts: getLocalizedTextsInitialValues(localizedTexts, EDIT_GROUP_FORM_LOCALIZED_TEXTS_DEFAULT),
      externalId,
      isPublic,
      publicStats,
      detaining,
      hasThreshold: threshold !== null && threshold !== undefined,
      threshold: threshold !== null && threshold !== undefined ? String(Number(threshold) * 100) : '0',
    })
  );

  render() {
    const {
      history: { replace },
      group,
      groups,
      groupsAccessor,
      isSuperAdmin,
      editGroup,
      relocateGroup,
      hasThreshold,
      canViewParentDetail,
      instanceId,
      reload,
      links: { GROUP_INFO_URI_FACTORY, INSTANCE_URI_FACTORY, GROUP_EDIT_URI_FACTORY },
      intl: { locale },
    } = this.props;

    return (
      <Page
        resource={group}
        icon={<EditGroupIcon />}
        title={<FormattedMessage id="app.editGroup.title" defaultMessage="Change Group Settings" />}>
        {group => (
          <div>
            <GroupNavigation
              groupId={group.id}
              canEdit={hasOneOfPermissions(group, 'update', 'archive', 'remove', 'relocate')}
              canViewDetail={hasPermissions(group, 'viewDetail')}
            />

            {!hasOneOfPermissions(group, 'update', 'archive', 'remove', 'relocate') && (
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

            <GroupArchivedWarning {...group} groupsDataAccessor={groupsAccessor} linkFactory={GROUP_EDIT_URI_FACTORY} />

            {hasPermissions(group, 'update') && (
              <>
                {!group.archived && (
                  <Row>
                    <Col lg={3}>
                      <p>
                        <OrganizationalGroupButtonContainer id={group.id} locale={locale} />
                      </p>
                    </Col>
                    <Col lg={9}>
                      <p className="small text-muted" style={{ padding: '0.75em' }}>
                        <InfoIcon gapRight />
                        <FormattedMessage
                          id="app.editGroup.organizationalExplain"
                          defaultMessage="Regular groups are containers for students and assignments. Organizational groups are intended to create hierarchy, so they are forbidden to hold any students or assignments."
                        />
                      </p>
                    </Col>
                  </Row>
                )}
                {hasPermissions(group, 'archive') && (!group.archived || group.directlyArchived) && (
                  <Row>
                    <Col lg={3}>
                      <p>
                        <ArchiveGroupButtonContainer id={group.id} onChange={reload} />
                      </p>
                    </Col>
                    <Col lg={9}>
                      <p className="small text-muted" style={{ padding: '0.75em' }}>
                        <InfoIcon gapRight />
                        <FormattedMessage
                          id="app.editGroup.archivedExplain"
                          defaultMessage="Archived groups are containers for students, assignments and results after the course is finished. They are immutable and can be accessed through separate Archive page."
                        />
                      </p>
                    </Col>
                  </Row>
                )}
              </>
            )}

            {hasPermissions(group, 'update') && !group.archived && (
              <EditGroupForm
                form="editGroup"
                initialValues={this.getInitialValues(group)}
                onSubmit={editGroup}
                hasThreshold={hasThreshold}
                isPublic={group.public}
                isSuperAdmin={isSuperAdmin}
              />
            )}

            {canRelocate(group) && (
              <ResourceRenderer resource={groups.toArray()} returnAsArray>
                {groups =>
                  getPossibleParentsOfGroup(groups, group).length > 1 && (
                    <Box
                      type="warning"
                      title={<FormattedMessage id="app.editGroup.relocateGroup" defaultMessage="Relocate Group" />}>
                      <RelocateGroupForm
                        initialValues={getRelocateFormInitialValues(group)}
                        groups={getPossibleParentsOfGroup(groups, group)}
                        groupsAccessor={groupsAccessor}
                        onSubmit={relocateGroup}
                      />
                    </Box>
                  )
                }
              </ResourceRenderer>
            )}

            {hasPermissions(group, 'remove') && (
              <Box
                type="danger"
                title={<FormattedMessage id="app.editGroup.deleteGroup" defaultMessage="Delete Group" />}>
                <div>
                  <p>
                    <FormattedMessage
                      id="app.editGroup.deleteGroupWarning"
                      defaultMessage="Deleting a group will make all attached entities (assignments, solutions, ...) inaccessible."
                    />
                  </p>
                  <p className="text-center">
                    <DeleteGroupButtonContainer
                      id={group.id}
                      disabled={
                        group.parentGroupId === null || (group.childGroups && group.childGroups.length > 0) // TODO whatabout archived sub-groups?
                      }
                      onDeleted={() =>
                        replace(
                          canViewParentDetail
                            ? GROUP_INFO_URI_FACTORY(group.parentGroupId)
                            : INSTANCE_URI_FACTORY(instanceId)
                        )
                      }
                    />

                    {group.parentGroupId === null && (
                      <Form.Text>
                        <FormattedMessage
                          id="app.editGroup.cannotDeleteRootGroup"
                          defaultMessage="This is a so-called root group and it cannot be deleted."
                        />
                      </Form.Text>
                    )}

                    {group.parentGroupId !== null && group.childGroups && group.childGroups.length > 0 && (
                      <Form.Text>
                        <FormattedMessage
                          id="app.editGroup.cannotDeleteGroupWithSubgroups"
                          defaultMessage="Group with nested sub-groups cannot be deleted."
                        />
                      </Form.Text>
                    )}
                  </p>
                </div>
              </Box>
            )}
          </div>
        )}
      </Page>
    );
  }
}

EditGroup.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  }),
  links: PropTypes.object.isRequired,
  loadAsync: PropTypes.func.isRequired,
  reload: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      groupId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  group: ImmutablePropTypes.map,
  groups: ImmutablePropTypes.map,
  groupsAccessor: PropTypes.func.isRequired,
  canViewParentDetail: PropTypes.bool.isRequired,
  instanceId: PropTypes.string,
  editGroup: PropTypes.func.isRequired,
  relocateGroup: PropTypes.func.isRequired,
  hasThreshold: PropTypes.bool,
  isSuperAdmin: PropTypes.bool,
  intl: PropTypes.object,
};

const editGroupFormSelector = formValueSelector('editGroup');

export default withLinks(
  connect(
    (
      state,
      {
        match: {
          params: { groupId },
        },
      }
    ) => ({
      group: groupSelector(state, groupId),
      groups: notArchivedGroupsSelector(state),
      groupsAccessor: groupDataAccessorSelector(state),
      userId: loggedInUserIdSelector(state),
      hasThreshold: editGroupFormSelector(state, 'hasThreshold'),
      isSuperAdmin: isLoggedAsSuperAdmin(state),
      canViewParentDetail: canViewParentDetailSelector(state, groupId),
      instanceId: selectedInstanceId(state),
    }),
    (
      dispatch,
      {
        match: {
          params: { groupId },
        },
      }
    ) => ({
      reset: () => dispatch(reset('editGroup')),
      loadAsync: () => dispatch(fetchGroupIfNeeded(groupId)),
      reload: () => dispatch(fetchGroup(groupId)),
      editGroup: ({ localizedTexts, externalId, isPublic, publicStats, detaining, threshold, hasThreshold }) => {
        const transformedData = {
          localizedTexts: transformLocalizedTextsFormData(localizedTexts),
          externalId,
          isPublic,
          publicStats,
          detaining,
          hasThreshold,
        };
        if (hasThreshold) {
          transformedData.threshold = Number(threshold);
        }
        return dispatch(editGroup(groupId, transformedData));
      },
      relocateGroup: ({ groupId: newParentId }) => dispatch(relocateGroup(groupId, newParentId)),
    })
  )(injectIntl(EditGroup))
);
