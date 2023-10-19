let userProfileCustomForm = {
  'fields': {
    'required': [],
    'richText': [],
    'allowComments': [],
    'blocks': [
      {
        'fields': [
          'party',
          'occupation',
          'birthday',
          'gender',
          'province'
        ],
        'name': 'About the user'
      }
    ],
    'properties': {
      'occupation': {
        'type': 'string',
        'title': "User's occupation"
      },
      'party': {
        'type': 'string',
        'title': "User's party"
      },
      'gender': {
        'type': 'string',
        'title': "User's gender"
      },
      'birthday': {
        'type': 'string',
        'title': "User's birthday"
      },
      'province': {
        'type': 'string',
        'title': "User's province"
      },
      'tags': {
        'title': "User's tags",
        'type': 'array',
        'uniqueItems': true,
        'items': { 'type': 'string' }
      },
      'authors': {
        'title': "User's followed authors",
        'type': 'array',
        'uniqueItems': true,
        'items': { 'type': 'string' }
      },
      'tagsNotification': {
        'title': "User's tags notification setting",
        'anyof': [
          {
            'type': 'null'
          },
          {
            'type': 'boolean'
          }
        ]
      },
      'popularNotification': {
        'title': "User's popular notifications setting",
        'anyof': [
          {
            'type': 'null'
          },
          {
            'type': 'boolean'
          }
        ]
      }
    }
  },
  'name': 'User Profile',
  'slug': 'user-profile',
  'icon': 'fas fa-user',
  'description': 'Template for a user profile'
}

module.exports = userProfileCustomForm
