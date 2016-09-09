import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import Collapse from 'react-collapse';
import { Link } from 'react-router';
import MenuItem from '../MenuItem';
import LoadingMenuItem from '../LoadingMenuItem';
import { isLoading } from '../../../../redux/helpers/resourceManager';

class MenuGroup extends Component {
  componentWillMount = () =>
    this.setState({
      open: this.props.isActive === true
    });

  toggle = e => {
    e.preventDefault();
    this.setState({
      open: !this.state.open
    });
  };

  render() {
    const { open } = this.state;
    const { isActive } = this.context;
    const {
      title,
      icon = 'th',
      items,
      createLink,
      currentPath,
      notifications,
      forceOpen = false
    } = this.props;

    const itemsNotificationsCount = item => notifications[item.getIn(['data', 'id'])];
    const notificationsCount = items.reduce((acc, item) => acc + itemsNotificationsCount(item), 0);
    const someChildIsActive = items.find(item => isActive(createLink(item)));

    return (
      <li
        className={classNames({
          active: someChildIsActive || open || forceOpen,
          treeview: true
        })}>
        <a href='#' onClick={this.toggle}>
          <i className={`fa fa-${icon}`} />
          <span style={{
            whiteSpace: 'normal',
            display: 'inline-block',
            verticalAlign: 'top'
          }}>
            {title}
          </span>
          <span className='pull-right-container pull-right'>
            {notificationsCount > 0 &&
              <small className='label pull-right bg-blue'>{notificationsCount}</small>}
            <Icon name='angle-left' className='pull-right' />
          </span>
        </a>
        <ul className='treeview-menu'>
          {items.map((item, key) =>
            isLoading(item)
              ? <LoadingMenuItem key={key} />
              : <MenuItem
                  key={key}
                  title={item.getIn(['data', 'name'])}
                  icon='circle-o'
                  currentPath={currentPath}
                  notificationsCount={itemsNotificationsCount(item)}
                  link={createLink(item)} />
          )}
        </ul>
      </li>
    );
  }
}

MenuGroup.propTypes = {
  title: PropTypes.oneOfType([ PropTypes.string, PropTypes.element ]).isRequired,
  icon: PropTypes.string,
  link: PropTypes.string,
  currentPath: PropTypes.string,
  isActive: PropTypes.bool,
  forceOpen: PropTypes.bool
};

MenuGroup.contextTypes = {
  isActive: PropTypes.func
};

export default MenuGroup;