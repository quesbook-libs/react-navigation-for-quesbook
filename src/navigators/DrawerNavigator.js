/* @flow */

import React from 'react';
import { Dimensions, Platform } from 'react-native';

import createNavigator from './createNavigator';
import createNavigationContainer from '../createNavigationContainer';
import TabRouter from '../routers/TabRouter';
import DrawerScreen from '../views/Drawer/DrawerScreen';
import DrawerView from '../views/Drawer/DrawerView';
import DrawerItems from '../views/Drawer/DrawerNavigatorItems';

import NavigatorTypes from './NavigatorTypes';

import type { DrawerViewConfig } from '../views/Drawer/DrawerView';
import type {
  NavigationRouteConfigMap,
  NavigationTabRouterConfig,
} from '../TypeDefinition';

export type DrawerNavigatorConfig =
  & { containerConfig?: void }
  & NavigationTabRouterConfig
  & DrawerViewConfig;

const DefaultDrawerConfig = {
  /*
   * Default drawer width is screen width - header width
   * https://material.io/guidelines/patterns/navigation-drawer.html
   */
  drawerWidth: Dimensions.get('window').width -
  (Platform.OS === 'android' ? 56 : 64),
  contentComponent: DrawerItems,
  drawerPosition: 'left',
};

let disenableGestures = false;
const disenableGestureListeners = [];

export function setDisenableGestures(input) {
  disenableGestures = input;
  disenableGestureListeners.forEach(listener => listener(input));
}

class ChooseGesturesDrawerView extends React.Component {

  constructor(props) {
    super(props);
    this.listener = disenableGestures => {
      this.setState({disenableGestures});
    };
    this.state = {
      disenableGestures: disenableGestures,
    };
  }

  componentDidMount() {
    disenableGestureListeners.push(this.listener);
  }

  componentWillUnmount() {
    const index = disenableGestureListeners.indexOf(this.listener);
    if (index !== -1) {
      disenableGestureListeners.splice(index, 1);
    }
  }

  render() {
    return <DrawerView key={`${this.state.disenableGestures}`}
                       {...this.props}
                       disenableGestures={this.state.disenableGestures}/>;
  }
}

const DrawerNavigator = (
  routeConfigs: NavigationRouteConfigMap,
  config: DrawerNavigatorConfig,
  onDrawerAppear: Function,
) => {
  const mergedConfig = { ...DefaultDrawerConfig, ...config };
  const {
    containerConfig,
    drawerWidth,
    contentComponent,
    contentOptions,
    drawerPosition,
    ...tabsConfig
  } = mergedConfig;

  const contentRouter = TabRouter(routeConfigs, tabsConfig);

  const drawerRouter = TabRouter(
    {
      DrawerClose: {
        screen: createNavigator(
          contentRouter,
          routeConfigs,
          config,
          NavigatorTypes.DRAWER,
        )((props: *) => {
          if (onDrawerAppear) {
            onDrawerAppear();
          }
          return <DrawerScreen {...props} />;
        }),
      },
      DrawerOpen: {
        screen: () => null,
      },
    },
    {
      initialRouteName: 'DrawerClose',
    },
  );

  const navigator = createNavigator(
    drawerRouter,
    routeConfigs,
    config,
    NavigatorTypes.DRAWER,
  )((props: *) => (
    <ChooseGesturesDrawerView
      {...props}
      drawerWidth={drawerWidth}
      contentComponent={contentComponent}
      contentOptions={contentOptions}
      drawerPosition={drawerPosition}
    />
  ));

  const result = createNavigationContainer(navigator, containerConfig);
  result.setDisenableGestures = setDisenableGestures;
  return result;
};

export default DrawerNavigator;
