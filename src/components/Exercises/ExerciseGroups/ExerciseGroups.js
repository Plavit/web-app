import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Table, Modal } from 'react-bootstrap';

import Box from '../../widgets/Box';
import Icon, { GroupIcon, LoadingIcon } from '../../icons';
import GroupsNameContainer from '../../../containers/GroupsNameContainer';
import Button from '../../widgets/TheButton';
import GroupsTreeContainer from '../../../containers/GroupsTreeContainer';
import { arrayToObject, identity } from '../../../helpers/common';

class ExerciseGroups extends Component {
  state = { dialogOpen: false };

  openDialog = () => this.setState({ dialogOpen: true });

  closeDialog = () => this.setState({ dialogOpen: false });

  attachButton = groupId => {
    const { attachingGroupId, attachExerciseToGroup } = this.props;
    return (
      <Button
        variant="success"
        size="xs"
        disabled={Boolean(attachingGroupId)}
        onClick={ev => {
          ev.stopPropagation();
          attachExerciseToGroup(groupId);
        }}>
        {groupId === attachingGroupId ? <LoadingIcon gapRight /> : <Icon icon="paperclip" gapRight />}
        <FormattedMessage id="app.exercise.attach" defaultMessage="Attach" />
      </Button>
    );
  };

  detachButton = groupId => {
    const { groupsIds, detachingGroupId, detachExerciseFromGroup } = this.props;
    return (
      <Button
        variant="danger"
        size="xs"
        disabled={Boolean(detachingGroupId) || groupsIds.length <= 1 /* last one standing */}
        onClick={ev => {
          ev.stopPropagation();
          detachExerciseFromGroup(groupId);
        }}>
        {groupId === detachingGroupId ? <LoadingIcon gapRight /> : <Icon icon="unlink" gapRight />}
        <FormattedMessage id="app.exercise.detach" defaultMessage="Detach" />
      </Button>
    );
  };

  buttonsCreator = attachedGroupsIds => group => {
    return <span>{attachedGroupsIds[group.id] ? this.detachButton(group.id) : this.attachButton(group.id)}</span>;
  };

  render() {
    const { groupsIds = [], showButtons = false } = this.props;
    return (
      <Box
        title={<FormattedMessage id="app.exercise.groups" defaultMessage="Groups of Residence" />}
        footer={
          showButtons ? (
            <div className="text-center">
              <Button variant="primary" onClick={this.openDialog}>
                <Icon icon="paperclip" gapRight />
                <FormattedMessage id="app.exercise.manageGroupAttachments" defaultMessage="Manage Group Attachments" />
              </Button>
            </div>
          ) : null
        }
        noPadding>
        <>
          <Table hover>
            <tbody>
              {groupsIds.map(groupId => (
                <tr key={groupId}>
                  <td className="shrink-col">
                    <GroupIcon className="text-muted" />
                  </td>
                  <td>
                    <GroupsNameContainer groupId={groupId} fullName translations links admins />
                  </td>
                  <td className="text-right">{showButtons && this.detachButton(groupId)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          {showButtons && (
            <Modal show={this.state.dialogOpen} backdrop="static" onHide={this.closeDialog} size="xl">
              <Modal.Header closeButton>
                <Modal.Title>
                  <FormattedMessage
                    id="app.exercise.manageGroupAttachments"
                    defaultMessage="Manage Group Attachments"
                  />
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <GroupsTreeContainer
                  onlyEditable
                  buttonsCreator={this.buttonsCreator(arrayToObject(groupsIds, identity, () => true))}
                />
              </Modal.Body>
            </Modal>
          )}
        </>
      </Box>
    );
  }
}

ExerciseGroups.propTypes = {
  showButtons: PropTypes.bool,
  groupsIds: PropTypes.array,
  attachingGroupId: PropTypes.string,
  detachingGroupId: PropTypes.string,
  attachExerciseToGroup: PropTypes.func.isRequired,
  detachExerciseFromGroup: PropTypes.func.isRequired,
};

export default ExerciseGroups;
