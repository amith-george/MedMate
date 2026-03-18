// This file maps the avatar string from the database to the required image asset.
export const avatars = {
  'boy1.png': require('../assets/avatar/boy1.png'),
  'boy2.png': require('../assets/avatar/boy2.png'),
  'boy3.png': require('../assets/avatar/boy3.png'),
  'girl1.png': require('../assets/avatar/girl1.png'),
  'girl2.png': require('../assets/avatar/girl2.png'),
  'girl3.png': require('../assets/avatar/girl3.png'),
  // Add a default just in case
  default: require('../assets/avatar/boy1.png'),
};

export const getAvatar = (avatarName) => {
  return avatars[avatarName] || avatars.default;
};