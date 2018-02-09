import React from 'react'
import { Route } from 'react-router-dom'
import { Delete } from 'admin-on-rest'
import Dashboard from '../cms/components/dashboard'
import { PostList, PostCreate, PostEdit } from '../cms/components/posts'
import { SettingsList, SettingsEdit } from '../cms/components/settings'

export default [
  <Route exact path='/admin' component={Dashboard} />,
  <Route exact path='/admin/reactions' render={(routeProps) => <PostList hasCreate={true} resource='reaction-rule' {...routeProps} />} />,
  <Route exact path='/admin/settings' render={(routeProps) => <SettingsList hasCreate={false} resource='settings' {...routeProps} />} />,
  <Route exact path='/admin/settings/:id' render={(routeProps) => <SettingsEdit resource='settings' {...routeProps} />} />,
  <Route exact path='/admin/users' render={(routeProps) => <PostList hasCreate={true} resource='users' {...routeProps} />} />,
  <Route exact path='/admin/posts' render={(routeProps) => <PostList hasCreate={true} resource='posts' {...routeProps} />} />,
  <Route exact path='/admin/posts/create' render={(routeProps) => <PostCreate resource='posts' {...routeProps} />} />,
  <Route exact path='/admin/posts/:id' render={(routeProps) => <PostEdit resource='posts' {...routeProps} />} />,
  <Route exact path="/admin/posts/:id/delete" render={(routeProps) => <Delete resource='posts' {...routeProps} />} />
]
