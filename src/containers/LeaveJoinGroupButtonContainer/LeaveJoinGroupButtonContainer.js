import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { joinGroup, leaveGroup } from '../../redux/modules/groups';
import { isStudentOf } from '../../redux/selectors/users';
import { loggedInUserIdSelector } from '../../redux/selectors/auth';

import JoinGroupButton from '../../components/Groups/JoinGroupButton';
import LeaveGroupButton from '../../components/Groups/LeaveGroupButton';

const LeaveJoinGroupButtonContainer = ({
  isStudent,
  userId,
  groupId,
  joinGroup,
  leaveGroup,
  ...props
}) =>
  isStudent
    ? <LeaveGroupButton {...props} onClick={() => leaveGroup(groupId, userId)} />
    : <JoinGroupButton {...props} onClick={() => joinGroup(groupId, userId)} />;

LeaveJoinGroupButtonContainer.propTypes = {
  groupId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  isStudent: PropTypes.bool.isRequired,
  joinGroup: PropTypes.func.isRequired,
  leaveGroup: PropTypes.func.isRequired
};

const mapStateToProps = (state, props) => ({
  userId: loggedInUserIdSelector(state),
  isStudent: isStudentOf(props.groupId)(state)
});

const mapDispatchToProps = { joinGroup, leaveGroup };

export default connect(mapStateToProps, mapDispatchToProps)(LeaveJoinGroupButtonContainer);